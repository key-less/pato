"""
Genera los iconos y pantallas de arranque de Pato para iOS/PWA.

    python3 scripts/generate-icons.py     # escribe en public/icons/

Rasterizador propio, sin dependencias: supersampling + escritura PNG con zlib.
Se hizo asi porque el entorno no tiene Pillow ni cairosvg, y anadir una
dependencia de imagen solo para regenerar iconos de vez en cuando no compensa.

Las formas replican public/favicon.svg sobre un viewBox de 64x64. Si cambia el
favicon, hay que reflejar el cambio aqui y volver a ejecutar el script.

Tarda unos minutos: las nueve pantallas de arranque son varios millones de
pixeles y se calculan en Python puro.
"""
import zlib, struct, os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'icons')
os.makedirs(OUT, exist_ok=True)

# ---------- utilidades de geometria ----------

def qbez(p0, c, p1, n=24):
    pts = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        pts.append((u*u*p0[0] + 2*u*t*c[0] + t*t*p1[0],
                    u*u*p0[1] + 2*u*t*c[1] + t*t*p1[1]))
    return pts

def cbez(p0, c1, c2, p1, n=24):
    pts = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        pts.append((u**3*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*p1[0],
                    u**3*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*p1[1]))
    return pts

BODY = [(14.0, 40.0)]
BODY += qbez((14, 40), (14, 28), (27, 28))
BODY += [(40.0, 28.0)]
BODY += qbez((40, 28), (50, 28), (50, 40))
BODY += qbez((50, 40), (50, 50), (32, 50))
BODY += qbez((32, 50), (14, 50), (14, 40))

HEART = [(28.0, 38.0)]
HEART += cbez((28, 38), (26, 35.5), (22.5, 37), (22.5, 40))
HEART += cbez((22.5, 40), (22.5, 42.2), (28, 45.5), (28, 45.5))
HEART += cbez((28, 45.5), (28, 45.5), (33.5, 42.2), (33.5, 40))
HEART += cbez((33.5, 40), (33.5, 37), (30, 35.5), (28, 38))

BEAK = [(53.0, 22.0), (60.0, 24.0), (53.0, 27.0)]

def in_poly(poly, x, y):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            if x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                inside = not inside
        j = i
    return inside

def in_circle(cx, cy, r, x, y):
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r

def in_ellipse(cx, cy, rx, ry, x, y):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0

def hexc(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def grad(stops, t):
    """Gradiente multiparada. stops = [(offset, (r,g,b)), ...]"""
    t = max(0.0, min(1.0, t))
    for i in range(len(stops) - 1):
        o0, c0 = stops[i]
        o1, c1 = stops[i + 1]
        if t <= o1:
            span = (o1 - o0) or 1
            return lerp(c0, c1, (t - o0) / span)
    return stops[-1][1]

BG_STOPS = [(0.0, hexc('#fbf5ec')), (0.45, hexc('#f3e0d4')), (1.0, hexc('#f0c4cc'))]
DUCK_STOPS = [(0.0, hexc('#f3c5be')), (0.55, hexc('#dd9e8f')), (1.0, hexc('#b87560'))]

def over(dst, src, a):
    return tuple(src[i] * a + dst[i] * (1 - a) for i in range(3))

# ---------- render del pato en coordenadas 0..64 ----------

def duck_pixel(x, y, base):
    """Devuelve el color del pato en (x,y) sobre `base`, o None si no lo cubre."""
    c = base
    hit = False
    # gradiente del cuerpo, diagonal sobre el bbox del pato (14..60, 13..50)
    gt = ((x - 14) / 46 * 0.6 + (y - 13) / 37 * 0.4)
    duck = grad(DUCK_STOPS, gt)

    if in_ellipse(30, 49.5, 16, 3.2, x, y):       # sombra de apoyo, baja y sutil
        c = over(c, hexc('#a86755'), 0.16); hit = True
    if in_poly(BODY, x, y):                       # cuerpo
        c = duck; hit = True
    if in_ellipse(22, 34, 6, 3, x, y):            # brillo del ala
        c = over(c, hexc('#f8d6cd'), 0.40); hit = True
    if in_poly(BEAK, x, y):                       # pico (detras de la cabeza)
        c = hexc('#f0a878'); hit = True
    if in_circle(44, 24, 11, x, y):               # cabeza
        c = duck; hit = True
    if in_ellipse(40, 20, 3, 2.5, x, y):          # mejilla
        c = over(c, hexc('#f8d6cd'), 0.50); hit = True
    if in_poly(BEAK, x, y) and x > 50:            # punta del pico por delante
        c = hexc('#f0a878'); hit = True
    if in_circle(46, 22.5, 2, x, y):              # ojo
        c = hexc('#2d2424'); hit = True
    if in_circle(46.6, 22.0, 0.55, x, y):         # destello del ojo
        c = (255, 255, 255); hit = True
    if in_poly(HEART, x, y):                      # corazon
        c = over(c, hexc('#9d4f48'), 0.85); hit = True
    return c if hit else None

# ---------- escritura PNG ----------

def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    comp = zlib.compress(raw, 9)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', comp)
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    return len(png)

# ---------- generadores ----------

def render_icon(size, duck_scale=0.78, ss=3):
    """Icono cuadrado a sangre: iOS le aplica su propia mascara redondeada."""
    rows = []
    d = 64.0 / (size * duck_scale)          # unidades svg por pixel del pato
    off = (size * (1 - duck_scale)) / 2      # margen para centrar el pato
    for py in range(size):
        row = bytearray()
        for px in range(size):
            acc = [0.0, 0.0, 0.0]
            for sy in range(ss):
                for sx in range(ss):
                    fx = px + (sx + 0.5) / ss
                    fy = py + (sy + 0.5) / ss
                    base = grad(BG_STOPS, (fx / size) * 0.5 + (fy / size) * 0.5)
                    ux = (fx - off) * d
                    uy = (fy - off) * d
                    col = duck_pixel(ux, uy, base) if 0 <= ux <= 64 and 0 <= uy <= 64 else None
                    col = col if col is not None else base
                    for i in range(3):
                        acc[i] += col[i]
            n = ss * ss
            row += bytes(int(max(0, min(255, acc[i] / n + 0.5))) for i in range(3))
        rows.append(row)
    return rows

def render_splash(w, h, ss=2):
    """Pantalla de arranque: fondo degradado + pato centrado, para el modo standalone."""
    icon_px = int(min(w, h) * 0.30)
    ix0 = (w - icon_px) // 2
    iy0 = int(h * 0.5 - icon_px * 0.62)
    d = 64.0 / icon_px
    rows = []
    for py in range(h):
        row = bytearray()
        for px in range(w):
            acc = [0.0, 0.0, 0.0]
            for sy in range(ss):
                for sx in range(ss):
                    fx = px + (sx + 0.5) / ss
                    fy = py + (sy + 0.5) / ss
                    base = grad(BG_STOPS, (fx / w) * 0.35 + (fy / h) * 0.65)
                    col = base
                    ux = (fx - ix0) * d
                    uy = (fy - iy0) * d
                    if 0 <= ux <= 64 and 0 <= uy <= 64:
                        c = duck_pixel(ux, uy, base)
                        if c is not None:
                            col = c
                    for i in range(3):
                        acc[i] += col[i]
            n = ss * ss
            row += bytes(int(max(0, min(255, acc[i] / n + 0.5))) for i in range(3))
        rows.append(row)
    return rows

if __name__ == '__main__':
    icons = [
        ('apple-touch-icon.png', 180, 0.80),
        ('icon-192.png', 192, 0.80),
        ('icon-512.png', 512, 0.80),
        ('icon-maskable-512.png', 512, 0.58),   # zona segura para mascaras Android
    ]
    for name, size, scale in icons:
        n = write_png(os.path.join(OUT, name), size, size, render_icon(size, scale))
        print(f'{name:28s} {size}x{size}  {n/1024:.1f} KB')

    splashes = [
        (828, 1792), (1125, 2436), (1170, 2532), (1179, 2556),
        (1206, 2622), (1242, 2688), (1284, 2778), (1290, 2796), (1320, 2868),
    ]
    for w, h in splashes:
        name = f'splash-{w}x{h}.png'
        n = write_png(os.path.join(OUT, name), w, h, render_splash(w, h))
        print(f'{name:28s} {w}x{h}  {n/1024:.1f} KB')
