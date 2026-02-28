# ytmusicapi en Pato

Integración de [ytmusicapi](https://github.com/sigma67/ytmusicapi) para obtener datos de playlists de YouTube Music.

## 1. Instalar dependencias (Python 3)

```bash
pip install -r requirements.txt
```

## 2. Crear `browser.json` (credenciales)

Sigue la guía oficial: **[Browser authentication — ytmusicapi](https://ytmusicapi.readthedocs.io/en/stable/setup/browser.html)**

Resumen:

1. Copia `browser.json.example` como **`browser.json`** en esta misma carpeta.
2. En el navegador, abre [music.youtube.com](https://music.youtube.com) con la sesión iniciada.
3. Abre las herramientas de desarrollador (F12) → pestaña **Red**.
4. Filtra por **`browse`** y localiza una petición POST a `music.youtube.com`.
5. Copia los encabezados de la petición (Request headers) y pega **Authorization** y **Cookie** en tu `browser.json`.

El archivo `browser.json` **no se sube al repositorio** (está en `.gitignore`).

## 3. Uso desde el servidor Node

Al agregar una playlist por URL (YouTube Music), el servidor intenta primero este script. Si `browser.json` existe y Python tiene instalado `ytmusicapi`, se usan los datos de ytmusicapi; si no, se usa la YouTube Data API v3 (con `YOUTUBE_API_KEY`).

Ruta opcional del archivo de credenciales: variable de entorno **`YTMUSIC_BROWSER_JSON`** en `server/.env`.
