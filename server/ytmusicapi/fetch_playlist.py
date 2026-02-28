#!/usr/bin/env python3
"""
Obtiene datos de una playlist de YouTube Music con ytmusicapi (autenticación browser).
Uso: python fetch_playlist.py <playlist_id_o_url>
Salida: JSON por stdout { "ok": true, "name", "createdBy", "imageUrl" } o { "ok": false, "error": "..." }
Ver: https://ytmusicapi.readthedocs.io/en/stable/setup/browser.html
"""
import json
import re
import sys
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Falta playlist ID o URL"}))
        sys.exit(1)

    raw = sys.argv[1].strip()
    # Extraer ID: list=ID o /playlist/ID o solo ID
    list_match = re.search(r"[?&]list=([a-zA-Z0-9_-]+)", raw)
    if list_match:
        playlist_id = list_match.group(1)
    elif "/" in raw:
        playlist_id = raw.rstrip("/").split("/")[-1].split("?")[0]
    else:
        playlist_id = raw

    if not playlist_id:
        print(json.dumps({"ok": False, "error": "No se pudo extraer el ID de la playlist"}))
        sys.exit(1)

    creds_path = os.environ.get("YTMUSIC_BROWSER_JSON", "browser.json")
    if not os.path.isfile(creds_path):
        print(json.dumps({"ok": False, "error": f"No existe el archivo de credenciales: {creds_path}. Cópialo desde browser.json.example y rellénalo según https://ytmusicapi.readthedocs.io/en/stable/setup/browser.html"}))
        sys.exit(1)

    try:
        from ytmusicapi import YTMusic
    except ImportError:
        print(json.dumps({"ok": False, "error": "ytmusicapi no instalado. Ejecuta: pip install ytmusicapi"}))
        sys.exit(1)

    try:
        yt = YTMusic(creds_path)
        playlist = yt.get_playlist(playlist_id, limit=1)
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        sys.exit(1)

    title = playlist.get("title") or "Playlist"
    author = playlist.get("author")
    if isinstance(author, dict):
        created_by = author.get("name") or ""
    else:
        created_by = str(author) if author else ""

    thumbnails = playlist.get("thumbnails") or []
    image_url = thumbnails[0].get("url") if thumbnails else None

    out = {
        "ok": True,
        "platform": "youtube",
        "name": title,
        "createdBy": created_by,
        "imageUrl": image_url,
    }
    print(json.dumps(out))

if __name__ == "__main__":
    main()
