import { requireSupabase } from './client.js'
import { requireCoupleId } from './coupleContext.js'
import { unwrap, reportRemoteFailure } from './mapping.js'
import { decodeDataUrl, bufferToDataUrl } from '../media/dataUrl.js'

const TABLE = 'media'
const BUCKET = 'media'
const SIGNED_URL_TTL = 3600
const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
}

function extensionFor(mimeType) {
  return EXTENSIONS[mimeType] ?? 'bin'
}

/** Un Blob si la subida lo trae, o los bytes de un data URL si viene de una copia. */
async function resolveBinary(media) {
  if (media.blob instanceof Blob) {
    return { blob: media.blob, mimeType: media.blob.type, size: media.blob.size }
  }
  const decoded = decodeDataUrl(media.dataUrl)
  if (!decoded) return null
  return {
    blob: new Blob([decoded.buffer], { type: decoded.type }),
    mimeType: decoded.type,
    size: decoded.buffer.byteLength,
  }
}

async function resolveThumbnail(media) {
  if (media.thumbnailBlob instanceof Blob) return media.thumbnailBlob
  const decoded = decodeDataUrl(media.thumbnailDataUrl)
  return decoded ? new Blob([decoded.buffer], { type: decoded.type }) : null
}

/**
 * Album contra Supabase Storage.
 *
 * El bucket es privado: el acceso va por signed URLs de vida corta, nunca por URL
 * publica. La cuadricula pide solo las miniaturas; el original se firma cuando de
 * verdad hace falta.
 */
export function createSupabaseMediaRepository() {
  const client = requireSupabase()
  const signed = new Map()

  function remember(path, url) {
    signed.set(path, { url, expiresAt: Date.now() + (SIGNED_URL_TTL - 60) * 1000 })
    return url
  }

  function cachedUrl(path) {
    const entry = signed.get(path)
    return entry && entry.expiresAt > Date.now() ? entry.url : null
  }

  async function signOne(path) {
    if (!path) return null
    const cached = cachedUrl(path)
    if (cached) return cached

    const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
    if (error) throw reportRemoteFailure(TABLE, error)
    return remember(path, data.signedUrl)
  }

  /** En lote: una peticion para todas las miniaturas en vez de una por foto. */
  async function signMany(paths) {
    const pendientes = paths.filter((path) => path && !cachedUrl(path))
    if (pendientes.length > 0) {
      const { data, error } = await client.storage.from(BUCKET).createSignedUrls(pendientes, SIGNED_URL_TTL)
      if (error) throw reportRemoteFailure(TABLE, error)
      for (const item of data ?? []) {
        if (item.signedUrl && !item.error) remember(item.path, item.signedUrl)
      }
    }
    return Object.fromEntries(paths.filter(Boolean).map((path) => [path, cachedUrl(path)]))
  }

  async function readRow(id) {
    const coupleId = await requireCoupleId()
    return unwrap(TABLE, await client
      .from(TABLE)
      .select('*')
      .eq('couple_id', coupleId)
      .eq('id', id)
      .maybeSingle())
  }

  async function download(path) {
    if (!path) return null
    const { data, error } = await client.storage.from(BUCKET).download(path)
    if (error) throw reportRemoteFailure(TABLE, error)
    return data
  }

  async function upload(path, blob, mimeType) {
    const { error } = await client.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: mimeType, upsert: true })
    if (error) throw reportRemoteFailure(TABLE, error)
  }

  return {
    async getAll() {
      const coupleId = await requireCoupleId()
      const rows = unwrap(TABLE, await client
        .from(TABLE)
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true })) ?? []

      const urls = await signMany(rows.map((row) => row.thumbnail_path))

      return rows.map((row) => {
        const thumbnail = urls[row.thumbnail_path] ?? null
        return {
          id: row.id,
          type: row.type,
          mimeType: row.mime_type,
          size: row.size,
          date: row.date,
          relationshipStatusId: row.relationship_status_id,
          caption: row.caption ?? '',
          showOnLanding: row.show_on_landing,
          createdAt: row.created_at,
          thumbnail,
          src: thumbnail,
        }
      })
    },

    async save(media) {
      const coupleId = await requireCoupleId()
      const existing = media.id ? await readRow(media.id) : null
      const binary = await resolveBinary(media)
      const thumbnail = await resolveThumbnail(media)

      const mimeType = binary?.mimeType ?? existing?.mime_type ?? media.mimeType ?? 'application/octet-stream'
      const id = media.id
      let storagePath = existing?.storage_path ?? null
      let thumbnailPath = existing?.thumbnail_path ?? null

      if (binary) {
        storagePath = `${coupleId}/${id}.${extensionFor(mimeType)}`
        await upload(storagePath, binary.blob, mimeType)
      }
      if (thumbnail) {
        thumbnailPath = `${coupleId}/${id}_thumb.jpg`
        await upload(thumbnailPath, thumbnail, 'image/jpeg')
      }

      unwrap(TABLE, await client.from(TABLE).upsert({
        id,
        couple_id: coupleId,
        type: media.type,
        storage_path: storagePath,
        thumbnail_path: thumbnailPath,
        mime_type: mimeType,
        size: binary?.size ?? existing?.size ?? media.size ?? 0,
        date: media.date || null,
        relationship_status_id: media.relationshipStatusId || null,
        caption: media.caption ?? '',
        show_on_landing: media.showOnLanding ?? false,
        created_at: media.createdAt ?? existing?.created_at ?? new Date().toISOString(),
      }))
    },

    async remove(id) {
      const coupleId = await requireCoupleId()
      const row = await readRow(id)
      const paths = [row?.storage_path, row?.thumbnail_path].filter(Boolean)

      if (paths.length > 0) {
        const { error } = await client.storage.from(BUCKET).remove(paths)
        if (error) throw reportRemoteFailure(TABLE, error)
        for (const path of paths) signed.delete(path)
      }

      unwrap(TABLE, await client.from(TABLE).delete().eq('couple_id', coupleId).eq('id', id))
    },

    async getFileUrl(id) {
      const row = await readRow(id)
      return row ? signOne(row.storage_path) : null
    },

    async getFile(id) {
      const row = await readRow(id)
      const blob = row ? await download(row.storage_path) : null
      return blob ? { buffer: await blob.arrayBuffer(), mimeType: row.mime_type } : null
    },

    async getFileDataUrl(id) {
      const file = await this.getFile(id)
      return file ? bufferToDataUrl(file.buffer, file.mimeType) : null
    },

    async getThumbnailDataUrl(id) {
      const row = await readRow(id)
      const blob = row?.thumbnail_path ? await download(row.thumbnail_path) : null
      return blob ? bufferToDataUrl(await blob.arrayBuffer(), 'image/jpeg') : null
    },

    async estimateBytes() {
      const coupleId = await requireCoupleId()
      const rows = unwrap(TABLE, await client.from(TABLE).select('size').eq('couple_id', coupleId)) ?? []
      return rows.reduce((total, row) => total + (row.size ?? 0), 0)
    },

    async replaceAll(mediaList) {
      const coupleId = await requireCoupleId()
      const previas = unwrap(TABLE, await client
        .from(TABLE)
        .select('storage_path, thumbnail_path')
        .eq('couple_id', coupleId)) ?? []

      const paths = previas.flatMap((row) => [row.storage_path, row.thumbnail_path]).filter(Boolean)
      if (paths.length > 0) await client.storage.from(BUCKET).remove(paths)
      signed.clear()

      unwrap(TABLE, await client.from(TABLE).delete().eq('couple_id', coupleId))
      for (const media of mediaList) await this.save(media)
    },
  }
}
