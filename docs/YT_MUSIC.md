# YouTube Music y ytmusicapi

La app puede obtener datos de playlists de **YouTube Music** de dos formas:

1. **YouTube Data API v3** (con `YOUTUBE_API_KEY` en `server/.env`) — funciona para muchas playlists públicas.
2. **ytmusicapi** (Python) con **autenticación por navegador** — permite acceder a más contenido y no requiere API key de Google. Se integra con el servidor Node usando el archivo `browser.json`.

---

## Autenticación por navegador (browser.json)

Según la [documentación oficial de ytmusicapi](https://ytmusicapi.readthedocs.io/en/stable/setup/browser.html):

1. Abre una pestaña en el navegador y las **herramientas de desarrollador** (F12 o Ctrl+Mayús+I). Pestaña **Red** (Network).
2. Entra en **https://music.youtube.com** y asegúrate de estar **logueado** en tu cuenta de YouTube Music.
3. Busca una petición **POST** autenticada: en el filtro de la pestaña Red escribe **`browse`**. Si no aparece, haz scroll o clic en **Biblioteca**.
4. **Copia los encabezados de la petición:**
   - **Firefox:** clic derecho en la petición → Copiar → Copiar encabezados de la petición.
   - **Chrome/Edge:** clic en el nombre de la petición → pestaña "Headers" → en "Request Headers" copia todo desde `accept: */*` hasta el final.  
     En Chrome reciente puedes usar "Copy as fetch (Node.js)" y quedarte solo con:  
     `Accept`, `Authorization`, `Content-Type`, `X-Goog-AuthUser`, `x-origin`, `Cookie`.
5. Crea el archivo de credenciales en el proyecto:
   - Copia `server/ytmusicapi/browser.json.example` como `server/ytmusicapi/browser.json`.
   - Pega **Authorization** y **Cookie** en los campos correspondientes del JSON (tal como indica el ejemplo).

El archivo `browser.json` debe tener esta forma (con tus valores):

```json
{
  "Accept": "*/*",
  "Authorization": "PASTE_AUTHORIZATION",
  "Content-Type": "application/json",
  "X-Goog-AuthUser": "0",
  "x-origin": "https://music.youtube.com",
  "Cookie": "PASTE_COOKIE"
}
```

**Importante:** No subas `browser.json` al repositorio (está en `.gitignore`). Las credenciales suelen ser válidas mientras mantengas la sesión en YouTube Music (aprox. 2 años si no cierras sesión).

---

## Instalación de ytmusicapi (Python)

En la carpeta del servidor o en un entorno con Python 3:

```bash
cd server/ytmusicapi
pip install -r requirements.txt
```

O globalmente:

```bash
pip install ytmusicapi
```

Para generar `browser.json` desde la terminal (opcional):

```bash
ytmusicapi browser
```

y pegar los encabezados cuando lo pida. Eso crea el archivo en el directorio actual.

---

## Cómo lo usa Pato

- Al **agregar una playlist** por URL (YouTube o YouTube Music), el servidor Node:
  1. Si existe `server/ytmusicapi/browser.json`, intenta primero el script Python `fetch_playlist.py` (ytmusicapi).
  2. Si falla o no hay `browser.json`, usa la **YouTube Data API v3** (con `YOUTUBE_API_KEY`).

- Puedes forzar la ruta del archivo de credenciales con la variable de entorno **`YTMUSIC_BROWSER_JSON`** en `server/.env` (por ejemplo, ruta absoluta a tu `browser.json`).

---

## Referencias

- **ytmusicapi (repositorio):** https://github.com/sigma67/ytmusicapi  
- **Autenticación por navegador:** https://ytmusicapi.readthedocs.io/en/stable/setup/browser.html  
- **Uso y referencia:** https://ytmusicapi.readthedocs.io/en/stable/
