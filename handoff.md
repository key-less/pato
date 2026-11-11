# Handoff — Pato iOS

_Última actualización: 2026-11-11_

## Estado actual del proyecto

- La web (React + Express) sigue intacta en la raíz. La app nativa vive en `ios/` y el esquema del backend en `supabase/`.
- **Decisiones tomadas por Kevin**: SwiftUI nativo, backend Supabase, no tiene Mac (se compila con GitHub Actions).
- Hecho en la primera entrega:
  - `PatoCore` (Swift puro, con pruebas): modelos, predicción de ciclo, distancia → "río", contadores, almacén offline-first con fusión por última escritura.
  - App SwiftUI con 5 pestañas: Hoy, Recuerdos (álbum, fechas, cartas selladas), Río (mapa), Ánimo (12 patos + ciclo), Nosotros (perfil, vinculación, Spotify).
  - Widgets: "El río" (pequeño/mediano) y "Días juntos".
  - Supabase: tablas `couples`, `members`, `items`, `presence`, bucket `media`, RLS y funciones `create_couple` / `join_couple` / `leave_couple`.
  - 26 iconos de patos en SVG generados por script + icono de la app.
  - CI: `.github/workflows/ios.yml`.
- **Verificado**: la migración SQL (aplicada dos veces en Postgres 16 local, con pruebas de RLS: un extraño no lee ni escribe, un tercero no entra a una pareja llena) y el render de los patos.
- **Sin verificar localmente**: todo el código Swift. Este entorno no tiene toolchain de Swift ni acceso a descargarlo; el único compilador es el CI de GitHub. Revisar el resultado del workflow antes de dar nada por bueno.

## En qué puedo mejorar

- Compilar antes de escribir tanto: la próxima vez subir primero un esqueleto mínimo al CI y crecer desde ahí, en vez de ~3.300 líneas de una sola vez.
- Preguntar antes por las cuentas (Apple Developer, Supabase, Spotify) porque condicionan qué se puede probar de verdad.

## En qué me equivoqué

- Asumí al inicio que había una migración iOS empezada ("terminar la migración"); no existía nada y tuve que confirmarlo.
- La primera versión de `join_couple` tenía una comprobación redundante; la quité antes de probar.

## Arreglarme a mí mismo

- No afirmar que algo de iOS "funciona" sin un build verde del CI y, para comportamiento real (ubicación en segundo plano, widgets, HealthKit), sin prueba en un iPhone.
- Los datos del periodo son sensibles: nunca meterlos en `items` (tabla compartida). Solo viaja `CycleSummary` dentro de `presence`.

## Próximos pasos

1. Dejar el CI en verde (corregir errores de compilación que aparezcan).
2. Kevin: crear proyecto Supabase, correr la migración, poner `{{ .Token }}` en la plantilla de correo, y decidir si paga Apple Developer (99 USD/año) — sin eso no hay instalación en iPhone, TestFlight ni push.
3. Con cuenta de pago: firma automática + TestFlight desde Actions (fastlane/App Store Connect API key como secrets).
4. Pendiente de producto: notificaciones push ("cuac" y avisos de ánimo), videos en el álbum, widget que se actualice solo desde el servidor (hoy depende de que la app despierte), música en segundo plano vía Edge Function, Apple Music, importar datos desde la web (localStorage), modo oscuro, widget de pantalla de bloqueo.
5. Revisión de App Store: la guía 5.1.3 restringe compartir datos de HealthKit con terceros; el resumen de ciclo a la pareja se comparte por decisión explícita de la persona, pero hay que redactar la política de privacidad antes de enviar a revisión.
