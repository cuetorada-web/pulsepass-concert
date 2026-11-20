# Trazabilidad del PRD — PulsePass frontend

Fecha de revisión y cierre: 20 de noviembre de 2026. Referencia: PRD Frontend v1.0 y 30 capturas facilitadas por el propietario. Entrega versionada en la rama `feat/tickets-y-guardas`.

## Cobertura funcional

| Capacidad        | Implementación y evidencia                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo         | Inicio consulta próximos eventos y artistas. Cartelera con texto, categoría y artista persistidos en URL; tarjetas con estado; detalle con sede, artistas y compra. |
| Artistas y sedes | Listas activas y detalles; ID y códigos validados; eventos por artista; resolución de nombre artístico desde el filtro de cartelera.                                |
| Autenticación    | Registro validado, login, `/auth/me`, token en sessionStorage, restauración, expiración, salida y limpieza de caché. Retorno seguro al destino interno.             |
| Cuenta           | Perfil propio consultable por email y username; roles y estado de cuenta.                                                                                           |
| Tickets          | Compra con confirmación, email desde sesión, confirmación por código recuperable, lista con filtros, detalle y cancelación PAID con modal.                          |
| STAFF            | Búsqueda por código, marcado como USED, tickets pagados por evento, uso desde tabla de escritorio o tarjetas móviles.                                               |
| ADMIN            | Búsqueda de borradores por código, historial de creados en sesión, creación, asociación de artistas, publicación con confirmación.                                  |
| Transversal      | Layout por rol, menú móvil, tema claro/oscuro, 403/404/error de ruta, estados de carga/vacío/error, avisos accesibles y componentes compartidos.                    |

## Operaciones accesibles desde la interfaz

| Operación                                         | Acceso desde UI                                                |
| ------------------------------------------------- | -------------------------------------------------------------- |
| GET `/api/venues/active`                          | Sedes, creación de evento                                      |
| GET `/api/venues/{code}`                          | Detalle de sede                                                |
| POST `/api/events`                                | Crear evento                                                   |
| GET `/api/events/{eventCode}`                     | Detalle público y gestión ADMIN                                |
| GET `/api/events/published`                       | Inicio, cartelera y panel ADMIN                                |
| PATCH `/api/events/{eventCode}/publish`           | Confirmación de publicación                                    |
| POST `/api/events/{eventCode}/artists/{artistId}` | Asociar artista                                                |
| GET `/api/events/by-artist?stageName=`            | Perfil del artista y filtro de cartelera                       |
| GET `/api/artists/active`                         | Inicio, artistas y gestión ADMIN                               |
| GET `/api/artists/{id}`                           | Perfil del artista                                             |
| GET `/api/artists/by-stage-name?stageName=`       | Filtro de cartelera y enlace al perfil resuelto                |
| POST `/api/users`                                 | Registro                                                       |
| GET `/api/users/by-email?email=`                  | Mi cuenta                                                      |
| GET `/api/users/by-username?username=`            | Mi cuenta, acción consultar por usuario                        |
| POST `/api/tickets`                               | Confirmar compra                                               |
| GET `/api/tickets/{ticketCode}`                   | Detalle, confirmación y validación de ingreso                  |
| GET `/api/tickets/by-user?email=`                 | Mis tickets                                                    |
| GET `/api/events/{eventCode}/tickets/paid`        | Tickets pagados                                                |
| PATCH `/api/tickets/{ticketCode}/cancel`          | Cancelar en lista o detalle                                    |
| PATCH `/api/tickets/{ticketCode}/use`             | Validación y tickets pagados                                   |
| POST `/api/auth/login`                            | Iniciar sesión                                                 |
| GET `/api/auth/me`                                | Contexto de autenticación                                      |
| POST `/api/users` con password (F4)               | Mismo registro público, no es una operación adicional distinta |

## Pruebas automatizadas

- **Frontend (`npm test`):** 7 archivos / 120 pruebas en verde con Vitest + Testing Library + MSW + axe-core.
- **Backend (`.\mvnw.cmd clean test`):** Suite completa en verde (`0 failures`, `0 errors`).

La suite del frontend incluye:

- Validación del cliente HTTP y respuestas, Bearer solo en encabezados, 400/401/403/404/409/500 y red, cierre ante 401, prevención de redirección externa.
- Carga, éxito, vacío y error en catálogos; estados de carga y error en detalles y paneles.
- Formularios inválidos sin petición; registro válido/duplicado; login válido/401 y retorno al destino.
- Compra con email de sesión, confirmación, conflicto conservado en modal y evento agotado.
- Cancelación con éxito/conflicto; tickets usados sin acción de cancelación; filtrado de estados.
- Ingreso exitoso y conflicto de segundo uso; lista de pagados.
- Crear evento con errores generales y por campo; publicar con confirmación; asociación duplicada.
- Guardas anónimas/USER/STAFF/ADMIN, caché y expiración con reloj simulado.
- Pruebas dedicadas TEST-FE-TKT-009, STF-003, GEN-001 y GEN-002; botones por rol, copiar código, radios de compra, mostrar/ocultar contraseña, medidor de fortaleza, foco y limpieza en validación, y filtrado de artistas ya asociados.
- Axe en inicio, cartelera, login, registro, tickets y creación de evento: sin infracciones críticas o serias de las reglas estructurales evaluadas.

Las pruebas automatizadas del frontend no usan red real ni modifican la base local. El contraste visual se verificó en navegador junto con la auditoría Lighthouse. Las pruebas de fecha y expiración fijan su reloj explícitamente.

## Verificación visual, rendimiento (NFR) y límites

- **Auditoría Lighthouse (build de producción `npm run build` + `npm run preview` en `http://localhost:4173/`, modo incógnito):**
  - **Performance:** 95 / 100 (cumple `NFR-FE-001` >= 80).
  - **Accessibility:** 100 / 100 (cumple `NFR-FE-003` / WCAG 2.1 AA).
  - **Best Practices:** 100 / 100.
  - **SEO:** 82 / 100.
  - **Evidencia adjunta:** `docs/lighthouse-report.pdf`.
- **Verificación funcional en navegador real:** Se probaron con el backend Spring Boot y PostgreSQL local los flujos de catálogo, registro, login, compra y cancelación de entradas, creación/publicación en panel `ADMIN` y validación en puerta `STAFF`, además de menú móvil a 390 px, tema claro/oscuro, contraste visual y navegación por teclado.
- Se aplicaron las fuentes Inter/Poppins locales, fondo neutro, color índigo, hero degradado y tarjetas con portadas por categoría de las referencias.
- El material entregado contiene 30 capturas, aunque el PRD menciona 32 imágenes originales; se utilizó todo el material disponible. No se declara una comparación pixel a pixel de las 32 originales.
- La auditoría se realizó en Google Chrome; no se declara prueba manual exhaustiva sobre las últimas dos versiones de todos los demás navegadores.
- Pagos reales, QR, refresh token, administración de usuarios/sedes/artistas, despliegue productivo y E2E automatizados permanecen fuera del alcance definido por el PRD.

## Conservación del trabajo previo

No se publicaron credenciales, secretos ni datos locales de PostgreSQL en el repositorio. En el backend únicamente se reubicó `AuthServiceTest.java` a su paquete correspondiente (`com.pulsepass.service`) para mantener la suite de pruebas sin errores. Los cambios quedaron versionados en `feat/tickets-y-guardas` listos para Pull Request hacia `main`.