*This project has been created as part of the 42 curriculum by alejanr2, fcasaubo, xortega y andefern*

# Social Network 42

## Description

Una sección de «Descripción» que presenta claramente el proyecto, incluyendo su objetivo y una breve reseña general.

## Instructions

Una sección de «Instrucciones» que contenga cualquier información relevante sobre la compilación, instalación y/o ejecución.

## Team Information

Este proyecto se ha distribuido con los siguientes roles

alejanr2: Technical lead / Architect & Developer
fcasaubo: Technical lead / Architect & Developer
xortega:  Project Manager & Scrum master & Developer
andenfern: Product Owner & Developer

Funcione de cada miembro del equipo:

alejanr2: Encargado de diseñar la arquitectura del software del frontend, maquetador del proyecto y resolucion de dudas y problemas técnicos.
fcasaubo: Encargada de diseñar la arquitectura del software del backend, creacion de tablas relacionales y comunicacion con la BBDD.
xortega:  Encargado de las estimaciones de tiempo, realización de estimar los modulos del proyecto y programar a nivel de backend.
andefern: Encargado del valor del negocio, la vision del producto y responsable de pruebas para un producto sin fallos.

A pesar de que cada miembro tenia su rol asignado todos los mimbros del grupo han trabajado como desarroladores tnato en el frontend, backend y BBDD.


Info del apartado luego borrar:
{

    Para cada miembro del equipo mencionado al inicio del archivo README.md, debes proporcionar:

    ◦ Rol(es) asignado(s): PO, PM, Tech Lead, desarrolladores, etc.
    ◦ Breve descripción de sus responsabilidades

}

## Project Management

La organización del grupo ha sido sencilla:

Se han realizado una reunion cada 2 semanas inicialmente en el edificio de 42 urduliz para la ejecucion incial del proyecto:

    ◦ Brainstorming de ideas de proyectos a realizar
    ◦ Stack tecnologico a usar
    ◦ Roles asignados 
    ◦ Distribución del trabajo y tareas

Al ser 4 miembros ya activos en trabajo laboral el proyecto se ha realizado con calma, realizando una reunión al mes y alargando el tiempo de entrega.
Para tener mejor comunicación entre nosotros, se ha decidido trabajar en un repositorio de github. Utilizando branch nuevas para la incorporacion del backend
y commits en master para la visualizacion del proyecto en frontend. 

La asignacion de tareas se realizaron directamente en las reuniones y el canal principal de comunicación para reuniones e informacion fue tanto slack como washapp

Info del apartado luego borrar:
{

    ◦ Cómo organizó el equipo el trabajo (distribución de tareas, reuniones, etc.).
    ◦ Herramientas utilizadas para la gestión del proyecto (GitHub Issues, Trello, etc.).
    ◦ Canales de comunicación utilizados (Discord, Slack, etc.).
}

## Technical Stack

    ◦ Tecnologías y frameworks de frontend utilizados. ◦ Tecnologías y frameworks de backend utilizados.
    ◦ Sistema de base de datos y motivo de su elección.
    ◦ Otras tecnologías o librerías relevantes.
    ◦ Justificación de las principales decisiones técnicas.

## Database Schema

Representación visual o descripción de la estructura de la base de datos.
    ◦ Tablas/colecciones y sus relaciones.
    ◦ Campos clave y tipos de datos.

## Features List

    ◦ Lista completa de las funcionalidades implementadas.
    ◦ Qué miembro(s) del equipo trabajó/trabajaron en cada funcionalidad.
    ◦ Breve descripción de la funcionalidad de cada característica.

## Modules

    ◦ Lista de todos los módulos seleccionados (principales y secundarios).
    ◦ Cálculo de puntos (módulo principal = 2 puntos, módulo secundario = 1 punto).
    ◦ Justificación de la elección de cada módulo, especialmente en el caso de los «módulos a elección» personalizados.
    ◦ Forma en que se implementó cada módulo.
    ◦ Miembro(s) del equipo que trabajó/trabajaron en cada módulo.

## Individual Contributions

    ◦ Desglose detallado de la contribución de cada miembro del equipo.
    ◦ Funcionalidades, módulos o componentes específicos implementados por cada persona.
    ◦ Desafíos encontrados y cómo se superaron.

## Resources

Una sección de «Recursos» que enumera referencias clásicas relacionadas con el tema (documentación, artículos, tutoriales, etc.), así como una descripción de cómo se utilizó la IA, especificando para qué tareas y en qué partes del proyecto.






## Info para añadir a los modulos de arriba

Proyecto fullstack con React + Node.js + JS + PostgreSQL

# How to build = Instructions

1º Logeate en la intra de 42
2º Vete a la Api
3º Create una app

Inicio rápido

Esto levanta:
1. Frontend (http://localhost:3000)
2. Backend (http://localhost:4000)
3. BBDD (http://localhost:8080)
    3.1 Sistema: PostgreSQL
    3.2 Servidor: postgres
    3.3 Usuario: postgres
    3.4 Contraseña: postgres
    3.5 Base de datos: transcendence

Servidor pivote (`SERVER_IP`)

`SERVER_IP` debe ser la IP real del ordenador donde levantas Docker (no `localhost`).

`make docker-up` intenta detectarla automaticamente con `ip route`.

Si quieres forzar una IP concreta:

```bash
export SERVER_IP=192.168.1.50
make docker-up
```

`docker-compose.yml` usará esa IP para:
- Frontend `VITE_API_URL`
- Backend `FRONTEND_URL`
- Backend `FORTYTWO_CALLBACK_URL`

Si la deteccion automatica falla, `make docker-up` se detendra y te pedira definir `SERVER_IP` manualmente.



Solucion error por version de paquetes con backend

docker compose build --no-cache backend
docker compose up -d --force-recreate backend
docker compose logs -f backend

si persiste el error:

docker compose stop backend
docker rm transcendence-backend
docker compose up -d --build backend

Comandos disponibles

Primera vez todo desde la raiz del proyecto

make install  # Instalar todas las dependencias (monorepo)

make docker-up        # Levantar frontend + backend (levanta BD automáticamente)


Las demas:
make docker-db        # Levantar solo PostgreSQL (se mantiene corriendo)
make mock-user        # Crear/actualizar el usuario local de prueba
make docker-down      # Detener frontend + backend (BD sigue corriendo)
make docker-down-all  # Detener TODO incluyendo PostgreSQL
make docker-clean     # Eliminar TODO (incluyendo datos de BD)
make clean            # Limpiar node_modules y lock files
```

El usuario de prueba creado por `make mock-user` tiene estas credenciales:

```
Usuario: mockuser
Contraseña: mockpass123
```

## ⚠️ Base de datos: tabla users no existe

Si al hacer login con la intra de 42 aparece el error `relation "users" does not exist`, es porque el volumen de PostgreSQL ya existía cuando se creó el contenedor y el `init.sql` no se ejecutó automáticamente.

**Solución**: ejecutar el script manualmente:
docker exec transcendence-postgres psql -U postgres -d transcendence -f /docker-entrypoint-initdb.d/init.sql

`init.sql` solo se ejecuta automáticamente cuando el volumen `postgres_data` está vacío (primera vez). Si borras el volumen con `make docker-clean` y lo recreás, se ejecuta solo.

## 🔗 Enlaces

Jira: https://transcendence-42-network.atlassian.net
Drive modulos: https://docs.google.com/spreadsheets/d/1tWkKrj_4rcdVpjzi3vXjxSJlyZc2YZTWs9tetwJPIOQ/edit?gid=0#gid=0

informacion que guardar para cada usuario en la bbdd:

nombre completo
nombre de usuario
correo electronico
profesion
texto libre
numero de post
info de post
amigos agregados
solicitudes de amigos
chat individual con cada amigo

1º clona el proyecto
2º vamos a la creaccion de la app de 42 y creamos 1 app nueva
3º make install (para instalar las dependencias del node)
4º make setup (genera el el archivo .env y genera tambien DB_PASSWORD y SESSION_SECRET)
5º colocamos FORTYTWO_CLIENT_ID y FORTYTWO_CLIENT_SECRET que se han generado en la app de 42 creda en el paso 1
6º make docker-up y levantamos nuestro proyecto