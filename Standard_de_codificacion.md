# Estándar de codificación — Monarca (Backend)

Documento derivado de la actividad *Definición de estándares de codificación* (ITESM Campus Santa Fe, Planeación de sistemas de software). Aplica al repositorio **Monarca_Backend** (API NestJS, base de datos y seeds).

---

## 1. Normativas generales

| Regla | Detalle |
|--------|---------|
| **Idioma** | Todo el código y los comentarios deben escribirse en **inglés**. |
| **Funciones nuevas** | Deben incluir una descripción de su propósito **antes** de la declaración. |
| **Estructura del archivo** | **Parte superior:** descripción del archivo. **Parte inferior:** historial de modificaciones (comentado). |
| **Tamaño máximo** | Los archivos no deben superar **1000 líneas**; si se supera, dividir en otro archivo. |

---

## 2. Convención de nombres

### 2.1 Variables (`let`, `const`, `var`)

- **`const`**: cuando el valor no se reasigna.
- **`let`**: cuando el valor puede cambiar dentro del mismo scope.
- **`var`**: permitido; tener en cuenta alcance funcional y hoisting.

**Variables, hooks, objetos/JSON, funciones y métodos → `camelCase`**

| Tipo | Ejemplos |
|------|-----------|
| Variables | `myVar`, `userAge`, `isAccountActive` |
| Hooks (frontend) | `useInventory.ts`, `useDestinations.ts`, `useGetRequest.ts` |
| Objetos / JSON | `myObject`, `myJSON`, `appService` |
| Funciones y métodos | `myFunction()`, `getOne()`, `Class.methodOne()` |

### 2.2 Clases, tipos, interfaces, decoradores → `PascalCase`

| Tipo | Ejemplos |
|------|-----------|
| Clases / servicios Nest | `MyClass`, `AppService`, `LoginService` |
| Páginas (frontend) | `Dashboard.tsx`, `Bookings.tsx`, `Login.tsx` |
| Tipos | `MyType`, `Point` |
| Interfaces | `MyInterface`, `Person` |
| Decoradores | `@Injectable()`, `@Get()`, `@Roles()` |

### 2.3 Constantes y entorno → `ALL_CAPS` (SCREAMING_SNAKE)

- Constantes en código: `COLORS`, `WIDTH`.
- Variables en `.env` y su uso: `process.env.POSTGRES_USER`, etc.

### 2.4 Carpetas y archivos del backend (no componentes UI)

- **Carpetas:** `snake_case`, nombre que refleje dominio o módulo. Ejemplos: `travel_requests`, `request_logs`, `user_logs`, `src/utils`.
- Singular o plural según represente el recurso del dominio.
- **Archivos TypeScript (Nest):** **dot notation** `<feature>.<type>.ts` o **kebab-case** con sufijo de tipo:
  - `<feature>`: dominio/módulo (kebab-case o lowercase).
  - `<type>`: `module`, `service`, `controller`, `entity`, `dto`, `guard`, etc.
- Ejemplos: `user-logs.module.ts`, `request.service.ts`, `login.controller.ts`.

### 2.5 Base de datos

- **Identificadores en `snake_case`.**
- **Tablas:** nombre en **plural**.
- **Tablas de relación (N:N):** nombre compuesto en `snake_case` que refleje ambas entidades.
- **Columnas:** **singular**, descriptivas, sin palabras reservadas de SQL.
- Evitar caracteres especiales, espacios y mayúsculas en nombres SQL.

Ejemplos:

```sql
-- Tablas
user_roles, approved_trips

-- Columnas
id, name, email, phone_number
```

---

## 3. TypeScript (NestJS / backend)

### 3.1 Documentación con JSDoc / TSDoc

Usar para **funciones exportadas**, **métodos públicos** y **clases** cuando aporten contrato claro a otros módulos o al equipo.

```typescript
/**
 * Creates a new user in the system.
 * @param username User's name.
 * @param email User's email address.
 * @returns A new user object.
 */
export function createUser(username: string, email: string) {
  return {
    id: Date.now(),
    username,
    email,
  };
}
```

### 3.2 Comentarios breves

Para decisiones de implementación, no para repetir el nombre de la función o la variable:

```typescript
// Cache for 60s to avoid repeated expensive lookups.
const cacheTtlMs = 60_000;
```

### 3.3 Comentarios en SQL

- Una línea: `--`
- Bloque: `/* ... */`

---

## 4. Historial de modificaciones (obligatorio)

Al **final** de cada archivo, en bloque comentado. Cada entrada: **fecha**, **nombre**, **descripción del cambio** (en el idioma que use el equipo en el historial; el código sigue en inglés).

**Agregar entrada solo si cambia:** comportamiento, estructura de datos o API pública (**no** por formateo solamente).

```text
/*
Modification History:
- 2026-02-05 | Diego Vergara | Initial file creation.
- 2026-02-07 | Santiago Arista | Added email validation.
- 2026-02-09 | Ernesto Garza | Refactored createUser return structure.
*/
```

---

## 5. Git: ramas y merges

### 5.1 Ramas principales

| Rama | Propósito |
|------|-----------|
| `main` | Código listo para producción. |
| `develop` | Última versión estable en desarrollo. |

### 5.2 Ramas personales

- Partir siempre de **`develop`**.
- Formato sugerido: `{commitTag}{nombre}{Equipo}{scope}`  
  Ejemplos: `featSantiagoBackAPIsAuth`, `fixErnestoFrontendLoginForm`, `refactorDiegoBackDatabaseOptimization`.
- Integrar a `develop` **al menos dos veces por semana** (según acuerdo del equipo).
- Los merges a `main`/`develop` según el documento original los autorizan los **líderes de área** (ver sección 7).

### 5.3 De rama personal a `develop`

1. Actualizar con `develop`: `git fetch origin` y `git rebase origin/develop` (o merge, según política del equipo).
2. Abrir **Pull Request** hacia `develop`.
3. Solicitar revisión al responsable del área.
4. Tras aprobación, mergear.

### 5.4 De `develop` a `main`

1. Confirmar que la funcionalidad en `develop` está probada.
2. Solo líderes autorizados para merge (según tabla de Code Owners).
3. Recomendado: rama de release (ej. `release/v1.0.0`) antes de mergear a `main`.
4. Mensaje de merge claro.

---

## 6. Conventional Commits

Formato:

```text
type(optional scope): short description
```

| Tipo | Uso |
|------|-----|
| `feat` | Nuevas funcionalidades |
| `fix` | Corrección de bugs |
| `docs` | Documentación |
| `style` | Formato (sin cambiar lógica) |
| `refactor` | Reestructuración sin cambiar comportamiento observable |
| `test` | Pruebas |
| `chore` | Mantenimiento |
| `perf` | Rendimiento |

Ejemplos:

```text
feat(auth): add login with Google
fix(api): fix error 500 in users
refactor(auth): simplify token validation
docs(readme): update installation instructions
```

---

## 7. Code Owners (revisión de PRs)

| Área | Responsable |
|------|-------------|
| APIs Backend | Santiago Arista Viramontes |
| Frontend | Ernesto Garza Berrueto |
| Base de datos (backend) | Diego Vergara Hernández |

Los Code Owners revisan PRs hacia `develop` en su área antes de integrar a `main` donde aplique.

---

## 8. Requisitos de Pull Request

- La rama parte de **`develop`**.
- La funcionalidad está probada.
- El código cumple formato y estándares acordados.
- Los commits siguen **Conventional Commits**.
- Documentación actualizada cuando el cambio lo requiera.

---

## 9. Arquitectura y rutas del backend (referencia)

Resumen alineado al documento del proyecto:

| Componente | Función | Interacción típica |
|------------|---------|--------------------|
| **NestJS** | Lógica de negocio y API | Cliente web, PostgreSQL, SMTP, Swagger |
| **PostgreSQL** | Persistencia | NestJS |
| **Docker Compose** | Postgres local | Desarrollo |
| **GitHub Actions (CI)** | Pipeline / pruebas | Repositorio |

### 9.1 Estructura Monarca_Backend

| Ruta | Descripción |
|------|-------------|
| `Monarca_Backend/` | Raíz del backend (API, DB, seeds). |
| `Monarca_Backend/DB/` | Recursos y configuración de PostgreSQL. |
| `Monarca_Backend/monarca/` | Código fuente Nest y configuración. |
| `Monarca_Backend/monarca/src/` | Módulos, controladores, servicios. |
| `Monarca_Backend/monarca/test/` | Pruebas del backend. |
| `Monarca_Backend/monarca/seeds/` | Datos semilla. |
| `Monarca_Backend/monarca/seeds/dev/` | Semillas entorno dev. |
| `Monarca_Backend/monarca/uploads/` | Archivos subidos. |
| `Monarca_Backend/monarca/certs/` | Certificados locales. |
| `Monarca_Backend/monarca/dist/` | Build compilado (si aplica). |

### 9.2 Módulos bajo `monarca/src/` (ejemplos del estándar)

| Ruta | Dominio |
|------|---------|
| `auth/` | Autenticación y autorización |
| `guards/` | Guards y acceso |
| `jwt/` | JWT |
| `notifications/` | Notificaciones |
| `utils/` | Utilidades |
| `users/` | Usuarios |
| `roles/` | Roles y permisos |
| `requests/` | Solicitudes |
| `reservations/` | Reservas |
| `revisions/` | Revisiones |
| `request-logs/` | Logs de solicitudes |
| `user-logs/` | Logs de usuarios |
| `cost-centers/` | Centros de costo |
| `departments/` | Departamentos |
| `destinations/` | Destinos |
| `travel-agencies/` | Agencias de viaje |
| `vouchers/` | Comprobantes / vouchers |

*Ajustar la tabla si el árbol real del repo cambia; el criterio de nombres (`snake_case` en carpetas, `*.service.ts`, etc.) se mantiene.*

---

## 10. Anexos

### 10.1 Variables y funciones (correcto vs incorrecto)

```typescript
// Correct: camelCase
let userAge: number = 21;
let isAccountActive: boolean = true;

function calculateTotalPrice(price: number, taxRate: number): number {
  return price + price * taxRate;
}

const totalPrice = calculateTotalPrice(100, 0.16);

// Incorrect
let user_age = 21; // snake_case for a variable
function CalculatePrice() {} // PascalCase for a function
```

### 10.2 Ejemplo SQL (tabla)

```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id INT REFERENCES categories(id),
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Créditos del documento origen

**Instituto Tecnológico y de Estudios Superiores de Monterrey**, Campus Santa Fe — Planeación de sistemas de software (Gpo 101). Profesor: Gilberto Echeverría Furió. Fecha de la entrega referenciada: 9 de febrero de 2026.  
Alumnos: Diego Flores Becerril, Efrén Chávez Camacho, José Ángel De La Cruz Alonso, Ernesto Garza Berrueto, Katia Abigail Álvarez Contreras, Santiago Arista Viramontes, Diego Vergara Hernández, Juan de Dios Gastélum Flores, Mateo Arminio Castro, Fabrizio Barrios Blanco.
