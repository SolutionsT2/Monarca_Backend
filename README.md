# 02 Solutions

_Innovación en Tecnologías de la Información para Soluciones Empresariales Avanzadas_

<img src="./Contenido%2002%20Solutions/logo.jpeg" alt="Logo de 02 Solutions" width="300" height="300"/>

## 📚 Tabla de Contenido

- [Introducción](#-introducción)
- [Visión](#-visión)
- [Misión](#-misión)
- [Valores](#-valores)
- [📌 Proyecto Monarca](#proyecto-monarca-sistema-integral-de-gestión-de-viajes-empresariales)
- [🚀 Guía de Inicialización](#-guía-de-inicialización)
  - [🛠️ Requisitos y Herramientas](#️-instalación-del-entorno-de-desarrollo)
  - [📥 Instalación del Proyecto](#-instalación-del-proyecto)
  - [🐳 Inicio y gestión de los servicios Docker (PostgreSQL)](#-inicio-y-gestión-de-los-servicios-docker-postgresql)
  - [🔁 Reinicializar la Base de Datos](#-reinicializar-la-base-de-datos)
- [🧪 Pruebas](#-ejecutar-pruebas-end-to-end)
- [📑 Documentación API](#-documentación-de-los-endpoints-con-openapi)


## 📌 Introducción

Bienvenido al repositorio oficial de **02 Solutions**, una compañía especializada en el desarrollo de **soluciones avanzadas de tecnologías de la información**, dedicada a impulsar la transformación digital de las empresas a través de herramientas innovadoras, escalables y personalizables.

Este repositorio forma parte de **Proyecto Monarca**, una iniciativa estratégica diseñada para revolucionar la gestión de viajes empresariales mediante una plataforma integral, segura y altamente adaptable.

---

## 🎯 Visión

**“Convertirnos en líderes globales en el desarrollo de soluciones tecnológicas innovadoras, flexibles y escalables, que impulsen la transformación digital y la eficiencia operativa de empresas en diversas industrias.”**

Esta visión guía nuestro crecimiento y nos motiva a innovar continuamente en la creación de herramientas tecnológicas que aporten valor real a nuestros clientes.

---

## 💼 Misión

**“Diseñar e implementar soluciones avanzadas de tecnologías de la información que optimicen procesos empresariales, fomenten la innovación y generen un impacto positivo y sostenible en las organizaciones.”**

Nuestra misión impulsa el desarrollo de plataformas personalizables y escalables, orientadas a resolver desafíos empresariales complejos a través de la tecnología.

---

## 💎 Valores

En **02 Solutions**, nuestros valores son el cimiento de cada decisión y desarrollo que llevamos a cabo:

1. **Innovación:** Buscamos soluciones disruptivas y creativas que resuelvan desafíos reales.
2. **Flexibilidad:** Nos adaptamos a las necesidades específicas de cada cliente, sin restricciones rígidas.
3. **Transparencia:** Fomentamos una comunicación clara y abierta, tanto interna como externamente.
4. **Colaboración:** Creemos en el trabajo en equipo como motor clave para lograr grandes resultados.
5. **Calidad:** Nos comprometemos a ofrecer productos y servicios con los más altos estándares.
6. **Seguridad:** Protegemos la información y los datos con protocolos sólidos y actualizados.
7. **Compromiso:** Trabajamos con dedicación y responsabilidad para alcanzar nuestros objetivos comunes.

---

## **Proyecto Monarca:** Sistema integral de gestión de viajes empresariales

**¿Por qué "Monarca"?**  
El nombre hace referencia a las icónicas migraciones de las mariposas monarca, que recorren miles de kilómetros en un viaje complejo y perfectamente coordinado. Este paralelismo representa la esencia del proyecto: facilitar, optimizar y coordinar los viajes empresariales con la misma precisión y fluidez que las migraciones de estas mariposas.

**Monarca** refleja nuestro compromiso por crear soluciones que no solo optimicen procesos, sino que también brinden experiencias fluidas y eficientes para todos los usuarios involucrados.

Esta plataforma actuará como nuestro **"Single Repository of Truth"**, garantizando que toda la información oficial y decisiones relevantes estén centralizadas y accesibles para todos los miembros del equipo.

La gestión de viajes corporativos suele estar limitada por sistemas costosos, inflexibles y difíciles de personalizar. Nuestra misión con **Monarca** es cambiar esa narrativa, creando una solución tecnológica libre de estas barreras, capaz de adaptarse a las necesidades específicas de cada organización.

---

# 🏛️ **Arquitectura**

Framework: NestJS

Base de datos: PostgreSQL

ORM: TypeORM

Autenticación: JWT

Estructura de carpetas: modular (cada dominio en su propio módulo)

```md
src/
├─ auth/               # Login, registro, refresh tokens
├─ jwt/                # Estrategias y guards de JWT
├─ guards/             # Guards genéricos (RolesGuard, etc.)
├─ users/              # CRUD de usuarios
├─ roles/              # Gestión de roles y permisos
├─ departments/        # Unidades organizacionales
├─ cost-centers/       # Centros de costo, asignaciones presupuestales
├─ travel-agencies/    # Agencias de viaje externas
├─ destinations/       # Ciudades y destinos disponibles
├─ requests/           # Solicitudes de viaje
├─ revisions/          # Flujos de aprobación y revisiones
├─ reservations/       # Reservaciones (hoteles, vuelos)
├─ vouchers/           # Vales / comprobantes
├─ request-logs/       # Historial de acciones sobre solicitudes
├─ user-logs/          # Historial de actividad de usuarios
├─ utils/              # Helpers, filtros, pipes
├─ app.module.ts       # Módulo raíz
└─ main.ts             # Punto de entrada
```

---
# 🚀 **Guía de Inicialización**

## 🛠️ Instalación del Entorno de Desarrollo
### Requisitos

- Node.js (usamos `nvm` para manejar versiones)
- `npm` (Node Package Manager)
- `direnv`

## Instalación de herramientas
Instalar **direnv**

- macOS: `brew install direnv`

Agrega el siguiente hook a tu shell:
```bash
# Bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc

# Zsh
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
```

Habilitar **direnv** para este repositorio (desde `Monarca_Backend/monarca`):
```bash
direnv allow
```
> Al entrar al repositorio, corre `direnv allow` si es la primera vez despues de la descarga.

Instalar **nvm** y **Node.js** (solo si no están instalados previamente)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

source ~/.bashrc # o ~/.zshrc según tu shell
```

## 📥 Instalación del Proyecto

Dentro de la carpeta `Monarca_Backend/monarca` corre el siguiente comando para descargar las dependencias necesarias:

```bash
npm install
```

### Levantar en local

Para iniciar el proyecto en modo desarrollo, corre:

```bash
npm run start:dev
```

Por defecto la API escucha en **http://127.0.0.1:3000**. Si usas el repositorio **Monarca_Frontend**, define `VITE_API_URL=http://127.0.0.1:3000` en el `.env` del front (o copia `.env.example`); si no, en modo desarrollo el `apiService` ya usa esa URL como respaldo.

### Variables de entorno
Crear un archivo `.env` con el contenido especificado en el `.env.example`:

> Son credenciales necesarias que la base de datos utiliza

## 🐳 Inicio y gestión de los servicios Docker (PostgreSQL)

**Construir la imagen Docker (solo una vez si no existe):**

Desde la terminal, navega al directorio `Monarca_Backend/DB` y ejecuta el siguiente comando:

```bash
docker build -t monarca-v1 .
```

> Esto construirá una imagen de Docker llamada monarca-v1, la cual debería aparecer en la sección de Images en Docker Desktop.

---
**Levantar los servicios con Docker Compose:**

Desde el root del proyecto `Monarca_Backend`, ejecuta:

```bash
docker compose up -d
```

> Esto iniciará los contenedores definidos en el archivo docker-compose.yaml y generará automáticamente una carpeta llamada `postgres` dentro de `Monarca_Backend/BD`, la cual contendrá los datos de la base de datos

Alternativa: también se puede iniciar el contenedor desde Docker Desktop, desde la pestaña Containers y haciendo clic en Start sobre el contenedor correspondiente.

---
**Detener los contenedores**

Para detener los contenedores desde la terminal ejecuta:

```bash
# Detiene todos los contenedores
docker compose stop

# Alternativa: detener un contenedor específico por su nombre
docker stop <nombre_del_contenedor> # monarca_database
```
> Esto detiene los contenedores, pero no los elimina ni borra los datos.

También se puede apagar desde Docker Desktop haciendo clic en Stop en la interfaz.

---
**Reiniciar los contenedores detenidos**

Para volver a inicializar los contenedores ya creados desde la terminal ejecuta:

```bash
# Inicializa todos los contenedores
docker compose start

# Alternativa: inicializar un contenedor específico por su nombre
docker start <nombre_del_contenedor> # monarca_database
```
> Reiniciará todos los contenedores previamente creados por Docker Compose.

También se puede realizar desde Docker Desktop con el botón Start.


## Opciones para el acceso hacia la base de datos

### Opción A: Usando pgAdmin

Desde la aplicacion de pgAdmin, configura un nuevo servidor con los siguientes parametros:
   - **Nombre del servidor:** `MonarcaDB` - (puede ser cualquier otro nombre)
   - **Host:** `localhost`
   - **Puerto:** `25000` - (verificar el puerto en `compose.yaml` si este no funciona)
   - **Usuario:** `postgres` - (por defecto, a menos que se indique lo contrario)
   - **Contraseña:** `test123` - (verificar `POSTGRES_PASSWORD` en `compose.yaml` si este no funciona)

### Opción B: Solo desde la Terminal (sin pgAdmin)

**Acceder directamente a la base de datos desde la terminal de docker:**

```bash
# docker exec -it <nombre del contenedor> psql -U <usuario DB> -d <nombre de la DB>

docker exec -it monarca_database psql -U postgres -d Monarca
```
> Este comando te da acceso directo a la consola interactiva de PostgreSQL dentro del contenedor de Docker, conectado a la base de datos Monarca como el usuario postgres.


## Insertar Datos
Dentro de la terminal en la carpeta `Monarca_Backend/monarca` corre el siguiente comando:

```bash
npm run db:seed
```

> Este comando inserta los dummy data asignados en la carpeta de seed en la base de datos


## 🔁 Reinicializar la Base de Datos



### Opción A: Reinicio sin eliminar el contenedor

1. **Ejecutar la eliminación del contenido actual:**

```bash
# Si se necesita eliminar todos los datos
npm run db:drop

# si solo se requiere vaciar las tablas
npm run db:truncate
```
2. **Volver a insertar los datos de prueba (dummy data):**

```bash
npm run db:seed
```
> Estos comandos deben ejecutarse desde la carpeta `Monarca_Backend/monarca`.

### Opción B: Reinicio completo (contenedor y base de datos)

1. **Eliminar la carpeta de datos:**

Elimina manualmente o desde la terminal la carpeta postgres ubicada en Monarca_Backend/BD

```bash
rm -rf Monarca_Backend/BD/postgres
```

2. **Levantar nuevamente los contenedores:**

Desde el root de Monarca_Backend, ejecuta nuevamente

```bash
docker compose up -d
```
> Esto recreará la base de datos desde cero, incluyendo una nueva carpeta postgres.

3. **Ejecutar los datos de prueba (dummy data):**

Desde la carpeta de `Monarca_Backend/monarca`, ejecuta:

```bash
npm run db:seed
```
Inserta nuevamente el dummy data



## 🧪 Ejecutar Pruebas End-to-End

Para ejecutar las pruebas end-to-end, navega a la carpeta `Monarca_Backend/monarca` y corre el siguiente comando:

```bash
npm run test:e2e
```



## 📑 Documentación de los endpoints con OpenAPI

La documentación de los endpoints está disponible en Swagger/OpenAPI.

Para acceder, simplemente visita la URL base donde corre el backend y añade `/api` al final. Por ejemplo:

http://localhost:3000/api

### 📦 Ejemplo de Endpoint: Crear Usuario:

```ts
// src/users/dto/create-user.dto.ts

/**
 * DTO para la creación de un nuevo usuario
 */

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Correo electrónico del usuario' })
  email: string;

  @ApiProperty({ example: 'John', description: 'Nombre del usuario' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Apellido del usuario' })
  lastName: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  password: string;
}

