# handoff.md · Pato → app nativa de iOS

Único archivo de continuidad del proyecto. Se actualiza, no se duplica.
Última actualización: 2026-10-09

---

## 1. Estado actual del proyecto

- **Pato hoy**: web app React 18 + Vite + Tailwind con Clean Architecture (domain /
  application / infrastructure / presentation), persistencia 100 % en `localStorage`,
  backend Express de un archivo (Gmail, OAuth Spotify/YouTube, "ahora suena").
  Desplegada en Vercel (front) + Render (back). Una sola pareja, español hardcodeado,
  sin modo oscuro ni accesibilidad.
- **Decisión tomada**: migrar a **app nativa de iOS (SwiftUI)**, no WebView ni PWA, con
  rehecho total de la capa de presentación y objetivo de **distribución pública en el
  App Store**.
- **Hecho en esta sesión**: `docs/design/PATO_IOS_DESIGN_BRIEF.md` (885 líneas) — brief
  completo para Claude Design: principios, identidad, sistema de color con contrastes
  WCAG **calculados y verificados**, tipografía (New York + SF Pro con Dynamic Type),
  materiales nativos, arquitectura de 5 pestañas, mapa de pantallas con 5 estados cada
  una, catálogo de componentes, gestos/movimiento/haptics, accesibilidad, i18n,
  inclusividad, privacidad, ecosistema Apple, monetización, App Store, entregables y
  preguntas abiertas. Incluye anexo con el inventario funcional real de la web.
- **Siguiente hito**: pasar el brief a Claude Design y, en paralelo, decidir las
  8 preguntas abiertas (§23 del brief) porque dos de ellas —versión mínima de iOS y
  estrategia de sincronización— condicionan tanto el diseño como la arquitectura.

## 2. En qué puedo mejorar

- **Validar el brief contra la documentación vigente de Apple** antes de que el diseño
  escale: lo relativo a Liquid Glass / materiales de iOS 26 está marcado como "verificar",
  y conviene cerrarlo con fuentes actuales en lugar de dejarlo como supuesto.
- **Proponer la arquitectura técnica iOS** (módulos Swift Package, mapeo del dominio
  JS actual a Swift, capa de repositorios, estrategia local-first) en un documento
  hermano: el brief es de diseño y deliberadamente no entra ahí.
- **Plan de migración de datos** de `localStorage` a la app nativa: hay que decidir si
  se diseña un flujo de importación o se empieza limpio (pregunta abierta nº 8).
- **Instalar skills específicas** de iOS/SwiftUI con `/find-skills` cuando empiece la
  fase de implementación; para este entregable de diseño no eran necesarias.

## 3. En qué me equivoqué / qué corregí

- No hubo errores que corregir en esta sesión: el entregable es nuevo y no toca código
  existente.
- **Riesgo asumido y declarado**: los nombres de las APIs de Liquid Glass de iOS 26 no se
  afirman como ciertos en el brief; están marcados para verificación. No se debe
  implementar contra ellos sin comprobarlos.
- **Decisiones opinadas que pueden necesitar discusión** (están argumentadas en el brief,
  no son accidentes): eliminar la sidebar hamburguesa, eliminar las fotos/videos flotantes
  de Inicio, abandonar Cormorant Garamond y mover el envío de cartas de email a entrega
  in-app.

## 4. Cómo me corrijo

- Mantener este `handoff.md` como único punto de verdad del estado del proyecto;
  actualizarlo al final de cada sesión de peso (no en consultas sueltas).
- No afirmar APIs ni versiones de SO de memoria: verificar o marcar explícitamente.
- Separar siempre diseño (este brief) de arquitectura técnica (documento pendiente),
  para que Claude Design no reciba ruido de implementación.

## 5. Próximos pasos

1. **Decidir las preguntas abiertas** del brief (§23), con prioridad en: versión mínima
   de iOS, sincronización (CloudKit vs. Supabase) y alcance de la v1.
2. **Pasar el brief a Claude Design** y pedir primero la **§21.1 dirección visual**
   (2–3 propuestas de Inicio en claro/oscuro) antes de escalar a todas las pantallas.
3. **Escribir `docs/design/PATO_IOS_ARQUITECTURA.md`**: módulos SwiftUI, mapeo del dominio
   actual a Swift, estrategia local-first y sincronización, modelo de emparejamiento.
4. **Prototipo técnico de riesgo**: contador en vivo + widget de WidgetKit + un
   `PhotosPicker` con almacenamiento real. Son las tres piezas que pueden sorprender.
5. **Preparar la cuenta de demostración emparejada** para revisión de App Store (sin ella,
   una app de parejas es irrevisable).
