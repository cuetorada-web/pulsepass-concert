# PulsePass — Frontend

Cliente web de PulsePass: React, TypeScript estricto, Vite, Tailwind v4, React Router, TanStack Query, React Hook Form y Zod.

## Arranque local

Requisitos: Node 22.22+ (o una versión LTS compatible superior), Java y PostgreSQL según el backend. Ejecutar los comandos desde las carpetas indicadas.

```powershell
# Desde frontend/
npm ci
npm run dev
```

La aplicación abre en http://localhost:5173. Las llamadas a `/api` pasan por el proxy de Vite hacia http://localhost:8080. Se puede configurar `VITE_API_PROXY_TARGET` copiando `.env.example` a `.env.local`. Las variables VITE son públicas: no contienen contraseñas ni secretos.

En otra terminal, desde la raíz del repositorio, iniciar el backend con sus variables locales. En Windows:

```powershell
$env:PULSEPASS_CORS_ALLOWED_ORIGINS = "http://localhost:5173"
# Configurar PULSEPASS_JWT_SECRET_BASE64 y DB_URL/DB_USER/DB_PASSWORD localmente.
.\mvnw.cmd spring-boot:run
```

Si PostgreSQL está en Docker, comprobar primero `docker ps`. En el equipo original el contenedor se llama `pulsepass-db` y publica 5432. Si ya existe pero está detenido: `docker start pulsepass-db`. No eliminar contenedores o volúmenes para resolver un problema de arranque. Los usuarios y eventos de la base de datos no se transfieren mediante Git.

## Comprobaciones

```powershell
npm run build
npm run lint
npm test
npm run test:coverage
```

Las pruebas usan Vitest, Testing Library, user-event, jsdom y MSW. No requieren el backend ni modifican PostgreSQL. `npm test` termina al completar la suite; `npm run test:watch` observa cambios. Los datos y fechas del escenario se fijan en `src/test/fixtures.ts`; el vencimiento de sesión usa reloj simulado en su prueba.

`npm run build` comprueba TypeScript estricto y genera `dist/`. `npm run preview` sirve ese resultado para inspección; el proxy de desarrollo no configura por sí mismo un servidor productivo. El despliegue productivo está fuera del alcance del taller.

## Rutas

| Ruta                                | Acceso        | Uso                                                  |
| ----------------------------------- | ------------- | ---------------------------------------------------- |
| `/`                                 | Público       | Inicio, próximos eventos y artistas                  |
| `/eventos`                          | Público       | Cartelera con `q`, `categoria` y `artista` en la URL |
| `/eventos/:eventCode`               | Según API     | Detalle y compra con confirmación                    |
| `/artistas`, `/artistas/:id`        | Público       | Catálogo y perfil con eventos                        |
| `/sedes`, `/sedes/:code`            | Público       | Sedes y detalles                                     |
| `/login`, `/registro`               | Público       | Acceso y creación de cuenta USER                     |
| `/cuenta`                           | Autenticado   | Perfil por email o username                          |
| `/mis-tickets`                      | Autenticado   | Tickets propios, filtros y cancelación               |
| `/mis-tickets/:ticketCode`          | Autenticado   | Detalle de entrada                                   |
| `/compra/confirmacion/:ticketCode`  | Autenticado   | Confirmación recuperable tras recarga                |
| `/staff/validacion`                 | STAFF o ADMIN | Buscar entrada y registrar ingreso                   |
| `/staff/eventos`                    | STAFF o ADMIN | Buscar evento para operación                         |
| `/staff/eventos/:eventCode/tickets` | STAFF o ADMIN | Tickets pagados y uso                                |
| `/admin/eventos`                    | ADMIN         | Buscar y recordar borradores creados en sesión       |
| `/admin/eventos/nuevo`              | ADMIN         | Crear evento                                         |
| `/admin/eventos/:eventCode`         | ADMIN         | Publicar y asociar artistas                          |
| `/403`                              | Público       | Acceso denegado                                      |
| Otras                               | Público       | 404                                                  |

Las rutas protegidas conservan el destino para volver tras el login. Los permisos se vuelven a comprobar en el backend; ocultar enlaces no concede ni limita permisos reales.

## Roles de demostración

El registro público crea USER. No hay contraseñas predeterminadas incluidas en este repositorio. Cada equipo debe registrar sus usuarios locales. El usuario `carlos` del otro desarrollador y sus credenciales no se distribuyen con el código.

Para asignar un rol de demostración en la base local, un administrador de PostgreSQL puede ejecutar (sustituir el nombre):

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'ADMIN' FROM users WHERE username = 'USUARIO_LOCAL'
ON CONFLICT DO NOTHING;
```

Para STAFF se usa el literal `'STAFF'`. Ejecutar en PostgreSQL; nunca agregar esos cambios a una migración ya aplicada. Cerrar sesión y volver a entrar para renovar el perfil visible.

## Contratos y límites

- Cada respuesta se valida con Zod; los tipos se derivan con `z.infer`.
- El token se conserva en memoria y sessionStorage, nunca en localStorage, URL o logs. Solo el tema visual usa localStorage.
- El login consulta `/api/auth/me`; al salir o expirar se elimina token y caché.
- Las compras toman el email de la sesión; precio, capacidad, edad y transiciones los valida el backend.
- Los errores 400 se asignan a campos y/o avisos; 409 conserva el mensaje del backend; los 500 no muestran detalles internos.
- No hay endpoint para listar todos los eventos. Los borradores se consultan por código; se recuerdan los creados en esta pestaña.
- La capacidad de una sede no es disponibilidad de entradas.
- No se procesan pagos ni se generan QR. No hay refresh token.
- Las fechas de eventos son LocalDateTime, sin zona horaria; se presentan en formato es-CO. La moneda es COP.
- Las operaciones POST/PATCH no se reintentan automáticamente. Las consultas reintentan una vez errores de red/5xx; no reintentan 4xx.

## Diseño y accesibilidad

Referencias: capturas entregadas por el propietario del PRD. Colores índigo/rosa, tipografías locales Inter/Poppins, tarjetas por categoría y superficies claras/oscuras. Se incluyen menú móvil desde 360 px, enlace para saltar al contenido, foco visible, avisos accesibles, labels y diálogos nativos con foco y Escape. La preferencia de tema respeta el sistema al inicio y permite alternar.

## Estado y alcance de la verificación

Consultar `PRD-COVERAGE.md` para la trazabilidad de operaciones, pruebas y límites de la comprobación. No se publican credenciales, cambios de base de datos ni despliegues con el frontend.
