# Refund Policies Frontend Context

## Objetivo
Este documento permite que cualquier frontend (humano o IA) consuma el modulo de politicas de reembolso sin conocer el backend interno.

El backend ya implementa:
- Politicas de reembolso por compania (obligatorio `id_company` en cada politica)
- Acceso por rol:
  - `SuperAdmin`: puede ver y administrar politicas de todas las companias
  - `CompanyAdmin`: solo puede ver y administrar politicas de su propia compania
- Listado agrupado por compania para dashboard

## Base de API
- Base URL: la de tu entorno (ejemplo local: `http://localhost:3000`)
- Prefijo de endpoints: `/refund-policies`

## Autenticacion
Todos los endpoints requieren sesion autenticada.

En este backend se usa cookie de sesion (`sessionInfo`) validada por guards.
Si tu frontend usa fetch/axios, envia credenciales:
- fetch: `credentials: 'include'`
- axios: `withCredentials: true`

## Reglas de negocio clave
1. No existen politicas globales.
2. Toda politica pertenece a una compania (`id_company`).
3. `SuperAdmin` puede operar en cualquier compania.
4. `CompanyAdmin` solo en su compania (resuelta desde su department).
5. Si en `PATCH` envias `rules`, se reemplazan todas las reglas actuales.
6. Si en `PATCH` envias `rules: []`, se borran todas las reglas de esa politica.
7. Si en `PATCH` no envias `rules`, las reglas actuales se conservan.

## Modelo de datos (respuesta)

### CompanyGroupResponse[] (GET /refund-policies)
```json
[
  {
    "company": {
      "id": "uuid",
      "key": "MONARCA",
      "name": "Monarca Default Company"
    },
    "policies": [
      {
        "id": "uuid",
        "id_company": "uuid",
        "name": "Politica de Comprobantes",
        "description": "Reglas sobre archivos y montos por clase de gasto",
        "is_active": true,
        "created_at": "2026-04-19T18:00:00.000Z",
        "company": {
          "id": "uuid",
          "key": "MONARCA",
          "name": "Monarca Default Company"
        },
        "rules": [
          {
            "id": "uuid",
            "id_policy": "uuid",
            "expense_class": "ALIF",
            "operator": "MISSING_XML",
            "threshold_value": null,
            "threshold_unit": null,
            "consequence": "POLICY_VIOLATION",
            "is_active": true
          }
        ]
      }
    ]
  }
]
```

### Policy (GET /refund-policies/:id, POST, PATCH)
La respuesta de una politica incluye:
- campos base de politica
- objeto `company`
- arreglo `rules`

## Endpoints

### 1) Listar politicas agrupadas por compania
`GET /refund-policies`

Comportamiento por rol:
- SuperAdmin: recibe todas las companias agrupadas
- CompanyAdmin: recibe solo su compania (en un solo grupo)

### 2) Obtener una politica
`GET /refund-policies/:id`

- Devuelve una politica con `company` y `rules`
- Si CompanyAdmin intenta abrir politica de otra compania: `403`

### 3) Crear politica
`POST /refund-policies`

Body:
```json
{
  "name": "Politica de Reembolso Hotel",
  "description": "Reglas para hospedaje",
  "is_active": true,
  "id_company": "9f4e4bfa-8e0d-4f2b-a3f1-4ef0d2db4a11",
  "rules": [
    {
      "expense_class": "HTLP",
      "operator": "MISSING_XML",
      "threshold_value": null,
      "threshold_unit": null,
      "consequence": "POLICY_VIOLATION",
      "is_active": true
    }
  ]
}
```

Reglas por rol:
- SuperAdmin: `id_company` es obligatorio
- CompanyAdmin: puede omitir `id_company`; backend usa su compania automaticamente
- CompanyAdmin: si manda `id_company` de otra compania, devuelve `403`

### 4) Actualizar politica
`PATCH /refund-policies/:id`

Body parcial permitido:
```json
{
  "name": "Politica Actualizada",
  "description": "Nuevo texto",
  "is_active": true,
  "id_company": "uuid-opcional-segun-rol",
  "rules": [
    {
      "expense_class": "ALIF",
      "operator": "LT",
      "threshold_value": 500,
      "threshold_unit": "MXN",
      "consequence": "POLICY_VIOLATION",
      "is_active": true
    }
  ]
}
```

Notas:
- Si se envia `rules`, se reemplaza el set completo de reglas
- CompanyAdmin no puede mover politica a otra compania (`403`)

### 5) Eliminar politica
`DELETE /refund-policies/:id`

Respuesta:
```json
{
  "status": true,
  "message": "Policy <id> removed"
}
```

## Errores esperados
- `400 Bad Request`
  - UUID invalido en parametro `:id`
  - SuperAdmin intenta crear sin `id_company`
- `401 Unauthorized`
  - Sesion invalida o ausente
- `403 Forbidden`
  - Rol no permitido
  - CompanyAdmin intentando operar politicas de otra compania
- `404 Not Found`
  - Politica no encontrada
  - Compania no encontrada al crear/editar

## Validaciones de DTO (frontend)

### CreateRefundPolicyDto
- `name`: string requerido
- `description`: string opcional
- `is_active`: boolean opcional
- `id_company`: UUID opcional (pero requerido en runtime para SuperAdmin)
- `rules`: arreglo opcional de reglas

### CreateRefundPolicyRuleDto
- `expense_class`: string requerido
- `operator`: string requerido
- `threshold_value`: number | null opcional
- `threshold_unit`: string | null opcional
- `consequence`: string opcional (default backend: `POLICY_VIOLATION`)
- `is_active`: boolean opcional (default backend: `true`)

## Recomendaciones UI para dashboard
1. Consumir `GET /refund-policies` al cargar pantalla.
2. Renderizar por acordeones/grupos de compania:
   - Header: `company.name` + `company.key`
   - Body: tabla/lista de politicas
3. Para editar reglas, mostrar editor de lista completa (porque PATCH reemplaza reglas).
4. En vista CompanyAdmin, ocultar selector de compania.
5. En vista SuperAdmin, mostrar selector de compania al crear politica.
6. En cualquier mutacion (POST/PATCH/DELETE), refrescar `GET /refund-policies`.

## Tipos sugeridos para frontend (TypeScript)
```ts
export type RefundPolicyRule = {
  id?: string;
  id_policy?: string;
  expense_class: string;
  operator: string;
  threshold_value?: number | null;
  threshold_unit?: string | null;
  consequence?: string;
  is_active?: boolean;
};

export type RefundPolicy = {
  id: string;
  id_company: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  company?: {
    id: string;
    key: string;
    name: string;
  };
  rules: RefundPolicyRule[];
};

export type RefundPoliciesByCompany = {
  company: {
    id: string;
    key: string;
    name: string;
  };
  policies: RefundPolicy[];
};
```

## Prompt listo para IA frontend
Copia y pega este bloque en tu agente de frontend:

```text
Implementa un dashboard de politicas de reembolso consumiendo el endpoint /refund-policies.

Contrato:
- GET /refund-policies devuelve Array<{ company, policies }>
- GET /refund-policies/:id devuelve una politica
- POST /refund-policies crea politica (SuperAdmin debe enviar id_company)
- PATCH /refund-policies/:id actualiza politica (si envia rules, reemplaza todas)
- DELETE /refund-policies/:id elimina politica

Reglas de rol:
- SuperAdmin: ve y administra todas las companias
- CompanyAdmin: solo su compania

Requisitos UI:
- Vista agrupada por compania
- CRUD de politicas
- Editor de reglas dinamico (lista)
- Manejo de errores 400/401/403/404
- Refetch tras mutaciones
- Fetch con credentials include
```

## Estado de version
- Documento alineado a backend actual de abril 2026.
