# Trazabilidad del PRD — PulsePass frontend

Fecha de revisión: 19 de noviembre de 2026. Referencia: PRD Frontend v1.0 y 30 capturas facilitadas por el propietario. Implementación local en la rama de trabajo existente; sin publicación ni merge automático.

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

120 pruebas con Vitest + Testing Library + MSW. Incluyen:

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

Las pruebas no usan red real ni cuentas de la base local. El contraste de color se excluye de axe en jsdom porque no dispone de un motor visual. La prueba de fecha y la de expiración fijan su reloj explícitamente.

## Verificación visual y límites

- Se inspeccionaron en navegador el inicio, catálogo y detalle con datos del backend local, además de menú móvil y tema oscuro a 390 px.
- Se aplicaron las fuentes Inter/Poppins locales, fondo neutro, color índigo, hero degradado y tarjetas con portadas por categoría de las referencias.
- Las pantallas administrativas y transacciones se verificaron con respuestas simuladas: no se consumieron ni cancelaron tickets reales del usuario durante esta implementación.
- El material entregado contiene 30 capturas, aunque el PRD menciona 32 imágenes originales; se utilizó todo el material disponible. No se declara una comparación pixel a pixel de las 32 originales.
- No se ejecutó Lighthouse ni se midió un puntaje de rendimiento. No se declara certificación completa WCAG AA, ni compatibilidad manual con las últimas dos versiones de todos los navegadores. La suite y revisión visual no sustituyen esas comprobaciones.
- Pagos reales, QR, refresh token, administración de usuarios/sedes/artistas, despliegue productivo y E2E automatizados permanecen fuera del alcance definido por el PRD.

## Conservación del trabajo previo

No se modificaron datos de PostgreSQL, secretos, roles reales ni archivos de backend. El cambio de salto de línea que ya existía en V4 se conserva como cambio del usuario. No se hicieron commits, pushes, merges ni despliegues.
