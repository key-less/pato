import { StorageQuotaError, StorageWriteError } from '../../domain/errors/StorageError.js'
import { emitStorageFailure } from './storageAlerts.js'
import { readJson, removeKey } from './localStorageDriver.js'
import { decodeDataUrl, bufferToDataUrl } from '../media/dataUrl.js'

const DB_NAME = 'pato'
const DB_VERSION = 1
const META_STORE = 'media'
const FILE_STORE = 'media_files'
const LEGACY_KEY = 'pato-media'

/**
 * Metadatos del medio. Sin binarios: el archivo va al store aparte y la
 * miniatura se fusiona con la que ya hubiera guardada.
 */
function toMetaRecord(media) {
  return {
    id: media.id,
    type: media.type,
    date: media.date ?? null,
    relationshipStatusId: media.relationshipStatusId ?? null,
    caption: media.caption ?? '',
    showOnLanding: media.showOnLanding ?? false,
    createdAt: media.createdAt ?? new Date().toISOString(),
  }
}

/** Acepta un Blob (subida) o un data URL (restauracion de copia). */
async function resolveBinary(media) {
  if (media.blob instanceof Blob) {
    return { buffer: await media.blob.arrayBuffer(), type: media.blob.type }
  }
  const decoded = decodeDataUrl(media.dataUrl)
  return decoded ? { buffer: decoded.buffer, type: decoded.type } : null
}

async function resolveThumbnail(media) {
  if (media.thumbnailBlob instanceof Blob) {
    return { buffer: await media.thumbnailBlob.arrayBuffer(), type: media.thumbnailBlob.type }
  }
  const decoded = decodeDataUrl(media.thumbnailDataUrl)
  return decoded ? { buffer: decoded.buffer, type: decoded.type } : null
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function runWrite(db, stores, apply) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, 'readwrite')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('Transaccion cancelada.'))
    apply(Object.fromEntries(stores.map((name) => [name, transaction.objectStore(name)])))
  })
}

function reportWriteFailure(cause) {
  const error = cause?.name === 'QuotaExceededError'
    ? new StorageQuotaError(META_STORE, cause)
    : new StorageWriteError(META_STORE, cause)
  emitStorageFailure(error)
  return error
}

/** Los ids antiguos llevan el timestamp de creacion: media-<ms>-<rand>. */
function legacyCreatedAt(item, index) {
  const stamp = Number.parseInt(String(item.id ?? '').split('-')[1], 10)
  return Number.isFinite(stamp) ? new Date(stamp).toISOString() : new Date(index).toISOString()
}

/**
 * Pasa el album de localStorage (data URLs) a IndexedDB.
 * La clave antigua solo se borra si todos los elementos entraron.
 */
async function migrateLegacyAlbum(db) {
  const legacy = readJson(LEGACY_KEY, null)
  if (!Array.isArray(legacy)) return

  if (legacy.length === 0) {
    removeKey(LEGACY_KEY)
    return
  }

  const migrated = []
  let failures = 0

  legacy.forEach((item, index) => {
    const file = decodeDataUrl(item.src)
    if (!file) {
      failures += 1
      return
    }
    const thumbnail = decodeDataUrl(item.thumbnail)
    migrated.push({
      meta: {
        ...toMetaRecord({ ...item, createdAt: legacyCreatedAt(item, index) }),
        mimeType: file.type,
        size: file.buffer.byteLength,
        thumbnailData: thumbnail?.buffer ?? null,
        thumbnailMimeType: thumbnail?.type ?? null,
      },
      file: { id: item.id, data: file.buffer, mimeType: file.type },
    })
  })

  if (migrated.length > 0) {
    await runWrite(db, [META_STORE, FILE_STORE], (stores) => {
      for (const entry of migrated) {
        stores[META_STORE].put(entry.meta)
        stores[FILE_STORE].put(entry.file)
      }
    })
  }

  if (failures === 0) removeKey(LEGACY_KEY)
}

/**
 * Album en IndexedDB, separado en metadatos y binarios.
 *
 * getAll() solo lee metadatos y miniaturas, asi que abrir el album no carga
 * los archivos completos en memoria. El original se pide por id cuando se necesita.
 *
 * Invariante: el binario de un id nunca se reemplaza -- editar solo toca metadatos --
 * asi que cada object URL se crea una vez y se revoca unicamente al borrar.
 */
export function createIndexedDbMediaRepository() {
  let ready = null
  const thumbnailUrls = new Map()
  const fileUrls = new Map()

  function connect() {
    if (ready === null) {
      ready = openDatabase().then(async (db) => {
        await migrateLegacyAlbum(db)
        return db
      })
    }
    return ready
  }

  function toEntity(record) {
    let thumbnail = thumbnailUrls.get(record.id) ?? null
    if (!thumbnail && record.thumbnailData) {
      thumbnail = URL.createObjectURL(new Blob([record.thumbnailData], { type: record.thumbnailMimeType }))
      thumbnailUrls.set(record.id, thumbnail)
    }
    const entity = { ...record, thumbnail, src: thumbnail ?? fileUrls.get(record.id) ?? null }
    delete entity.thumbnailData
    return entity
  }

  function releaseUrls(id) {
    for (const cache of [thumbnailUrls, fileUrls]) {
      const url = cache.get(id)
      if (url) URL.revokeObjectURL(url)
      cache.delete(id)
    }
  }

  async function readFile(id) {
    const db = await connect()
    return requestResult(db.transaction(FILE_STORE, 'readonly').objectStore(FILE_STORE).get(id))
  }

  async function readMeta(db) {
    const records = await requestResult(db.transaction(META_STORE, 'readonly').objectStore(META_STORE).getAll())
    return records ?? []
  }

  /**
   * Escribe metadatos fusionados con lo ya guardado, dentro de la misma transaccion.
   * Sin esto, editar la fecha de una foto borraria su miniatura y su tamano.
   */
  function putMerged(store, meta, binary, thumbnail) {
    const existing = store.get(meta.id)
    existing.onsuccess = () => {
      const previous = existing.result ?? {}
      store.put({
        ...previous,
        ...meta,
        mimeType: binary?.type ?? previous.mimeType ?? 'application/octet-stream',
        size: binary?.buffer.byteLength ?? previous.size ?? 0,
        thumbnailData: thumbnail?.buffer ?? previous.thumbnailData ?? null,
        thumbnailMimeType: thumbnail?.type ?? previous.thumbnailMimeType ?? null,
      })
    }
  }

  return {
    async getAll() {
      const db = await connect()
      const records = await readMeta(db)
      return records
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
        .map(toEntity)
    },

    async save(media) {
      const db = await connect()
      const [binary, thumbnail] = await Promise.all([resolveBinary(media), resolveThumbnail(media)])
      const meta = toMetaRecord(media)

      try {
        await runWrite(db, [META_STORE, FILE_STORE], (stores) => {
          putMerged(stores[META_STORE], meta, binary, thumbnail)
          if (binary) stores[FILE_STORE].put({ id: meta.id, data: binary.buffer, mimeType: binary.type })
        })
      } catch (cause) {
        throw reportWriteFailure(cause)
      }
    },

    async remove(id) {
      const db = await connect()
      try {
        await runWrite(db, [META_STORE, FILE_STORE], (stores) => {
          stores[META_STORE].delete(id)
          stores[FILE_STORE].delete(id)
        })
      } catch (cause) {
        throw reportWriteFailure(cause)
      }
      releaseUrls(id)
    },

    /** Object URL del archivo original. Se crea una vez por id y vive lo que la sesion. */
    async getFileUrl(id) {
      const cached = fileUrls.get(id)
      if (cached) return cached

      const file = await readFile(id)
      if (!file) return null

      const url = URL.createObjectURL(new Blob([file.data], { type: file.mimeType }))
      fileUrls.set(id, url)
      return url
    },

    /** Bytes del original. Solo lo usa la copia de seguridad. */
    async getFile(id) {
      const file = await readFile(id)
      return file ? { buffer: file.data, mimeType: file.mimeType } : null
    },

    /** El original como data URL. Solo lo usa la copia de seguridad. */
    async getFileDataUrl(id) {
      const file = await readFile(id)
      return file ? bufferToDataUrl(file.data, file.mimeType) : null
    },

    /** La miniatura como data URL, para que una restauracion no pierda la optimizacion. */
    async getThumbnailDataUrl(id) {
      const db = await connect()
      const record = await requestResult(db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get(id))
      return record?.thumbnailData ? bufferToDataUrl(record.thumbnailData, record.thumbnailMimeType) : null
    },

    /** Suma de tamanos sin leer un solo binario. */
    async estimateBytes() {
      const db = await connect()
      const records = await readMeta(db)
      return records.reduce((total, record) => total + (record.size ?? 0), 0)
    },

    /** Reemplaza el album entero. Solo lo usa la restauracion de copia de seguridad. */
    async replaceAll(mediaList) {
      const db = await connect()
      const entries = await Promise.all(
        mediaList.map(async (media) => {
          const [binary, thumbnail] = await Promise.all([resolveBinary(media), resolveThumbnail(media)])
          return {
            meta: {
              ...toMetaRecord(media),
              mimeType: binary?.type ?? media.mimeType ?? 'application/octet-stream',
              size: binary?.buffer.byteLength ?? media.size ?? 0,
              thumbnailData: thumbnail?.buffer ?? null,
              thumbnailMimeType: thumbnail?.type ?? null,
            },
            binary,
          }
        })
      )

      try {
        await runWrite(db, [META_STORE, FILE_STORE], (stores) => {
          stores[META_STORE].clear()
          stores[FILE_STORE].clear()
          for (const entry of entries) {
            stores[META_STORE].put(entry.meta)
            if (entry.binary) {
              stores[FILE_STORE].put({ id: entry.meta.id, data: entry.binary.buffer, mimeType: entry.binary.type })
            }
          }
        })
      } catch (cause) {
        throw reportWriteFailure(cause)
      }
      for (const id of [...thumbnailUrls.keys(), ...fileUrls.keys()]) releaseUrls(id)
    },
  }
}
