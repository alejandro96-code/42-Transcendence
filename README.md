*This project has been created as part of the 42 curriculum by alejanr2, fcasaubo, xortega y andefern.*

# Social Network 42

## Description

Social Network 42 es una red social web para la comunidad de 42. Permite crear una cuenta local o iniciar sesión con la intra de 42, completar un perfil, publicar contenido, relacionarse con otros usuarios y mantener conversaciones privadas.

El proyecto se ha construido como una aplicación full stack: el cliente ofrece una interfaz responsive e internacionalizada, mientras que la API gestiona la autenticación, las reglas de negocio y la persistencia en PostgreSQL. La aplicación se distribuye en contenedores Docker y se publica detrás de Nginx mediante HTTPS.

## Instructions

**Puesta en marcha.**

1. Clona el repositorio y entra en su directorio.
2. Crea una aplicación en la sección API de la intra de 42. Configura como callback `https://<SERVER_IP>:8443/api/auth/42/callback`.
3. Ejecuta `make install` para instalar las dependencias del proyecto.
4. Ejecuta `make setup`. El comando crea `backend/.env`, genera `DB_PASSWORD` y `SESSION_SECRET`, y restringe los permisos del archivo.
5. Edita `backend/.env` e introduce `FORTYTWO_CLIENT_ID`, `FORTYTWO_CLIENT_SECRET` y `SERVER_IP`, que es la direccion ip de tu puesto donde estas sentado. El resto de valores generados no debe compartirse ni subirse al repositorio.
6. Ejecuta `make docker-up`.


Tras el arranque, la aplicación está disponible en `https://<SERVER_IP>:8443`. PostgreSQL y Adminer sólo se exponen en `127.0.0.1`: Adminer se abre en `http://localhost:8080` con servidor `postgres`, usuario `postgres` y base de datos `transcendence`; la contraseña es el valor `DB_PASSWORD` de `backend/.env`.

**Comandos disponibles.**

| Comando | Descripción |
| --- | --- |
| `make install` | Instala las dependencias del monorepo. |
| `make setup` | Crea `backend/.env` con secretos locales. |
| `make docker-up` | Inicia Nginx, frontend, backend, PostgreSQL y Adminer; inicializa el esquema de la base de datos. |
| `make docker-build` | Reconstruye las imágenes sin caché. |
| `make docker-down` | Detiene los servicios definidos por el compose principal. |
| `make docker-down-all` | Detiene los servicios de la aplicación y de la base de datos. |
| `make docker-restart` | Reinicia frontend y backend. |
| `make docker-clean` | Elimina contenedores y volúmenes, incluidos todos los datos de PostgreSQL. |
| `make mock-admin` | Crea o actualiza el usuario local de prueba definido en `backend/mock-user.sql`. |
| `make dev` / `make dev-backend` | Inicia, respectivamente, el frontend o el backend en desarrollo local. |

Si se usa un volumen de PostgreSQL ya existente y falta alguna tabla, `make docker-up` ejecuta de nuevo `backend/init.sql`. Como alternativa, se puede reinicializar el entorno con `make docker-clean` —esta acción borra los datos persistentes— y arrancarlo de nuevo.

## Team Information

Aunque cada integrante asumió una responsabilidad principal, el equipo colaboró en frontend, backend y base de datos durante la integración y la resolución de incidencias.

| Miembro | Rol asignado | Responsabilidades principales |
| --- | --- | --- |
| alejanr2 | Tech Lead, arquitecto y desarrollador | Diseño de la arquitectura del frontend, maquetación e integración de la interfaz; apoyo técnico al equipo. |
| fcasaubo | Tech Lead, arquitecta y desarrolladora | Diseño de la arquitectura del backend, modelado relacional y comunicación con la base de datos. |
| xortega | Project Manager, Scrum Master y desarrollador | Estimación y planificación de tareas, seguimiento del proyecto y desarrollo de funcionalidades backend. |
| andefern | Product Owner y desarrollador | Definición de valor y visión de producto, validación funcional y pruebas orientadas a la calidad. |

## Project Management

El trabajo comenzó con reuniones presenciales quincenales en 42 Urduliz para definir la idea, elegir el stack, repartir roles y estimar tareas. Una vez establecido el alcance, el equipo pasó a reuniones mensuales, ajustadas a la disponibilidad de sus integrantes.

Las tareas se acordaban en las reuniones y se desarrollaban en un repositorio compartido de GitHub. Se utilizaban ramas para integrar trabajo, especialmente en backend, y se revisaba la integración en la rama principal. Jira complementó la planificación y el seguimiento; Slack y WhatsApp fueron los canales cotidianos de comunicación y coordinación.

## Technical Stack

| Área | Tecnologías | Decisión técnica |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Redux Toolkit, SCSS y PrimeReact | React y componentes reutilizables para la interfaz; Redux centraliza el estado de autenticación; i18next ofrece traducciones en español, euskera e inglés. |
| Backend | Node.js, Express, JavaScript, Passport y `passport-42` | Express ofrece una API ligera; Passport integra OAuth con la intra de 42 y las sesiones protegen las rutas privadas. |
| Base de datos | PostgreSQL 16 y `pg` | Una base de datos relacional mantiene con integridad los usuarios, publicaciones, amistades y mensajes. |
| Infraestructura | Docker Compose, Nginx y Adminer | Los contenedores facilitan un entorno reproducible; Nginx centraliza el acceso HTTPS y Adminer permite inspeccionar la base de datos local. |
| Calidad y seguridad | ESLint, validación de entradas, `scrypt`, cookies HTTP-only y filtrado de lenguaje ofensivo | Se validan datos de entrada, las contraseñas locales se almacenan mediante hash y las sesiones se manejan con cookies seguras. |

## Database Schema

PostgreSQL almacena cuatro entidades principales. Todas las claves foráneas mantienen la relación con `users`; los índices de publicaciones, mensajes y solicitudes optimizan las consultas más habituales.

| Tabla | Campos clave | Relaciones y propósito |
| --- | --- | --- |
| `users` | `id` (serial), `intra_id`, `username`, `email`, `password_hash`, datos de perfil y marcas de tiempo | Identidad local u OAuth. `intra_id` y `username` son únicos. |
| `posts` | `id` (serial), `author_id`, `content`, `likes`, `media`, `parent` | Cada publicación pertenece a un usuario. `parent` permite asociar respuestas o comentarios a otra publicación. |
| `friend_requests` | `id` (serial), `sender_id`, `recipient_id`, `status` | Modela solicitudes pendientes, aceptadas o rechazadas. Impide solicitudes a uno mismo y pares duplicados. |
| `chat_messages` | `id` (serial), `sender_id`, `receiver_id`, `content`, `sent_at` | Guarda mensajes directos entre dos usuarios; elimina los mensajes asociados cuando se elimina un usuario. |

La definición completa, incluidas restricciones e índices, está en [`backend/init.sql`](backend/init.sql).

## Features List

| Funcionalidad | Descripción | Participación principal |
| --- | --- | --- |
| Registro e inicio de sesión | Registro local, inicio de sesión, cierre de sesión y persistencia de sesión; OAuth con la intra de 42. | fcasaubo, alejanr2 |
| Perfiles | Consulta y edición del perfil, avatar, datos personales y visualización de perfiles de amistades. | alejanr2, fcasaubo |
| Publicaciones | Creación y lectura de publicaciones, respuestas, contenido multimedia, menciones y reacciones. | alejanr2, xortega |
| Red de amistades | Envío, aceptación o rechazo de solicitudes, listado, búsqueda, eliminación y estado de presencia. | xortega, fcasaubo |
| Chat privado | Envío y consulta de mensajes directos entre usuarios. | xortega, alejanr2 |
| Internacionalización y contenidos legales | Interfaz disponible en español, euskera e inglés, con páginas de privacidad y términos de servicio. | alejanr2, andefern |
| Protección de contenido | Validación de solicitudes y filtrado de lenguaje ofensivo en perfiles, publicaciones y mensajes. | fcasaubo, andefern |

## Modules

Se han seleccionado módulos major (2 puntos) y minor (1 punto) para cubrir la experiencia completa de una red social: interfaz, API, accesibilidad, gestión de usuarios y moderación. El total es **19 puntos**.

| Área | Módulo | Tipo | Puntos | Justificación e implementación | Participación principal |
| --- | --- | --- | ---: | --- | --- |
| Web | Frameworks de frontend y backend | Major | 2 | React, TypeScript y Vite estructuran el cliente; Node.js y Express exponen la lógica de servidor. Esta combinación separa claramente presentación, estado, API y persistencia. | alejanr2, fcasaubo |
| Web | Interacción de usuario | Major | 2 | La interfaz permite editar el perfil, publicar, reaccionar, enviar solicitudes de amistad, aceptar o rechazar peticiones y conversar por chat. React Router, Redux Toolkit y componentes reutilizables mantienen la interacción fluida. | alejanr2, xortega |
| Web | API pública | Major | 2 | Se implementó una API REST en Express para autenticación, perfiles, publicaciones, amistades y chat. Las rutas validan datos, devuelven errores estructurados y protegen los recursos privados mediante sesión. | fcasaubo, xortega |
| Web | Sistema de notificaciones | Minor | 1 | Las solicitudes de amistad pendientes y las menciones en publicaciones actúan como avisos dentro de la aplicación. Se consultan mediante los endpoints de solicitudes y el filtro de menciones del feed. | xortega, alejanr2 |
| Web | Sistema de diseño personalizado | Minor | 1 | Se creó una identidad visual propia con SCSS, variables, layouts responsive y componentes de perfil, publicaciones, amistades, cabecera y chat. PrimeReact y PrimeFlex se usan como apoyo, no como sustituto del diseño. | alejanr2 |
| Web | Búsqueda avanzada | Minor | 1 | La cabecera permite buscar amistades por nombre de usuario o nombre completo. La búsqueda se restringe a relaciones aceptadas, ordena los resultados y limita la respuesta para conservar rendimiento. | alejanr2, xortega |
| Web | Carga y gestión de archivos | Minor | 1 | Las publicaciones admiten una imagen desde el navegador. El cliente valida tipo y tamaño, la convierte a Data URL y la API la guarda asociada al post; también se ofrecen avatares de perfil predefinidos. | alejanr2, fcasaubo |
| Accesibilidad e internacionalización | Cumplimiento WCAG 2.1 AA | Major | 2 | Se incorporaron etiquetas `aria-label`, textos alternativos, controles identificables y una estructura semántica en los componentes interactivos. El diseño responsive y los mensajes de error visibles contribuyen a una interfaz más accesible. | alejanr2, andefern |
| Accesibilidad e internacionalización | Tres idiomas | Minor | 1 | i18next y react-i18next gestionan traducciones en español, euskera e inglés. Los textos de interfaz, fechas y etiquetas se adaptan al idioma seleccionado. | alejanr2, andefern |
| Accesibilidad e internacionalización | Compatibilidad con navegadores | Minor | 1 | La aplicación se construye con tecnologías web estándar y un diseño adaptable para funcionar en los navegadores modernos de escritorio y móvil. La interfaz evita dependencias específicas de un navegador. | alejanr2, andefern |
| Gestión de usuarios | Gestión estándar de usuarios | Major | 2 | Se implementaron registro local, inicio y cierre de sesión, sesión persistente, edición de perfil, amistades y presencia. Las contraseñas se protegen con `scrypt` y las sesiones usan cookies HTTP-only. | fcasaubo, xortega |
| Gestión de usuarios | Autenticación remota OAuth 2.0 | Minor | 1 | Passport y `passport-42` integran la intra de 42. En el primer acceso se crea el usuario y, en accesos posteriores, se actualizan sus datos públicos desde el proveedor. | fcasaubo |
| Inteligencia artificial | Moderación de contenido | Minor | 1 | Se filtran palabras ofensivas en nombres, perfiles, publicaciones y mensajes antes de guardarlos. El módulo `@2toad/profanity` configura el filtrado para varios idiomas y la API rechaza contenido no permitido. | fcasaubo, andefern |
| Módulos a elección | Módulo personalizado: escenario inicial de red social | Minor | 1 | Se preparó un script SQL de datos de prueba para disponer de una cuenta local desde la que validar la red social sin depender exclusivamente de OAuth. Este punto de partida facilita crear y comprobar perfiles, publicaciones, amistades y chat con datos entrelazados durante las pruebas. | xortega, fcasaubo |

**Cálculo:** 5 módulos principales × 2 puntos = 10 puntos; 9 módulos secundarios × 1 punto = 9 puntos. **Total: 19 puntos.**

## Individual Contributions

- **alejanr2:** definió la arquitectura y la maquetación del frontend, trabajó en perfiles, publicaciones, chat, rutas, estilos e internacionalización. El principal reto fue integrar una interfaz consistente con los distintos flujos autenticados; se resolvió con componentes reutilizables y un estado de autenticación centralizado.
- **fcasaubo:** diseñó la base de datos y la capa backend, incluyendo las relaciones entre usuarios, publicaciones, solicitudes y mensajes. También contribuyó a autenticación, validación y seguridad de la API. El reto central fue preservar la integridad de los datos sociales, abordado con restricciones, claves foráneas e índices SQL.
- **xortega:** organizó estimaciones y seguimiento del trabajo, y desarrolló funcionalidades backend relacionadas con amistades, presencia y mensajería. Se trató especialmente la consistencia de las solicitudes de amistad para evitar duplicados y transiciones de estado inválidas.
- **andefern:** mantuvo la visión de producto y la validación funcional, colaboró en pruebas y contenidos legales, y ayudó a detectar incidencias durante las integraciones. El foco fue que los flujos principales fueran comprensibles y que el producto respondiera a los requisitos funcionales.

## Resources

- [Documentación de React](https://react.dev/), [Vite](https://vite.dev/), [Express](https://expressjs.com/) y [PostgreSQL](https://www.postgresql.org/docs/): consulta de APIs, configuración y prácticas de implementación.
- [Passport](https://www.passportjs.org/) y [passport-42](https://www.npmjs.com/package/passport-42): integración de autenticación OAuth con la intra de 42.
- [Docker Compose](https://docs.docker.com/compose/) y [Nginx](https://nginx.org/en/docs/): definición de contenedores, red interna y proxy HTTPS.
- [Redux Toolkit](https://redux-toolkit.js.org/) e [i18next](https://www.i18next.com/): gestión del estado de autenticación e internacionalización de la interfaz.

La IA se utilizó como apoyo puntual para aclarar documentación, proponer alternativas de implementación, revisar textos y ayudar a depurar errores. Las decisiones de arquitectura, la integración en el repositorio, las pruebas y la validación final fueron realizadas y revisadas por el equipo.
