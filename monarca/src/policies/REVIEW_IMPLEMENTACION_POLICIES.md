# Revision interna - Implementacion Policies MVP

Fecha: 2026-03-27
Modulo: Policies
Objetivo del MVP: validar politicas de comprobacion antes de avanzar el flujo a Pending Vouchers Approval.

## 1) Que ya se implemento

### 1.1 Modulo y arquitectura base
Se creo una arquitectura desacoplada por capas dentro de src/policies:

- policies.module.ts
- types/policy.types.ts
- services/policy-repository.interface.ts
- repositories/in-memory-policy.repository.ts
- services/policy-engine.service.ts
- dtos/policy-evaluation-response.dto.ts

Motivo:
- Separar logica de evaluacion de la fuente de datos.
- Permitir empezar sin BD final.
- Cambiar despues a TypeORM sin reescribir el motor.

### 1.2 Reglas MVP activas en memoria
Se cargaron 4 reglas iniciales en InMemoryPolicyRepository:

1. ALL_TOTAL_LTE_ADVANCE
   - Tipo: TOTAL_VOUCHERS_LIMIT
   - Nivel: REQUEST
   - Regla: suma de vouchers no debe exceder anticipo.

2. TRAINING_REQUIRES_XML
   - Tipo: FILE_REQUIRED
   - Nivel: VOUCHER
   - Clase: CAPA
   - Regla: requiere XML.

3. FOOD_MAX_50
   - Tipo: AMOUNT_LIMIT
   - Nivel: VOUCHER
   - Clase: ALIF
   - Regla: monto maximo 50 MXN.

4. ALL_TIME_LIMIT_4W
   - Tipo: TIME_LIMIT
   - Nivel: REQUEST
   - Regla: limite 4 semanas.

### 1.3 Motor de evaluacion
PolicyEngineService ya:
- Evalua reglas por request.
- Evalua reglas por voucher.
- Construye resumen:
  - total_rules
  - passed
  - failed
  - blocking_violations
  - can_submit
  - violations

### 1.4 Integracion real al flujo de requests
Se integro en RequestsStatusService, metodo finishedUploadingVouchers:

- Antes de notificar y cambiar estado, se corre evaluateRequestSubmission.
- Si can_submit = false:
  - responde 422
  - no cambia estado
  - devuelve policy_summary
- Si can_submit = true:
  - sigue flujo actual normal
  - notifica admin
  - cambia a Pending Vouchers Approval

### 1.5 Wiring de modulo
RequestsModule ya importa PoliciesModule para inyeccion del motor.

### 1.6 Contrato FE-BE normalizado (clase de gasto)
Se normalizo el contrato de clase de gasto para usar codigos canónicos del frontend:

- ALIF
- CAPA
- CPF
- FIDP
- GAS
- HTLP
- LAUN
- NDPR
- NDVA
- REAU
- TCCF
- TSCF
- TRAA
- AIRP

Cambios aplicados:
- DTO de vouchers valida class contra ese catalogo con IsIn + transform.
- Backend normaliza aliases legacy (por ejemplo ALIMENTACION -> ALIF, CAPACITACION -> CAPA).
- Rules de policies MVP se alinearon a codigos (ALIF, CAPA).
- El filtro de politicas usa la clase normalizada para evitar mismatch por nomenclatura.

## 2) Contrato de salida actual para Frontend (cuando falla)

HTTP status: 422

Body (estructura):

statusCode: 422
message: Policy validation failed. Resolve violations before submit.
policy_summary:
  total_rules: number
  passed: number
  failed: number
  blocking_violations: number
  can_submit: boolean
  violations: array

Campos por elemento de violations:
- policy_id
- policy_code
- passed
- message
- severity
- consequence
- can_override
- evaluated_value

## 3) Trabajo pendiente por area

### 3.1 Equipo DB
Objetivo: reemplazar repositorio en memoria por persistencia real.

Pendientes DB:
1. Crear tablas finales (segun diseno acordado):
   - policies
   - policy_rules
   - policy_violations o policy_evaluations
2. Definir llaves e indices:
   - indice por policy code
   - indice por request id / voucher id en violaciones
   - timestamps para auditoria
3. Definir campos minimos para reglas:
   - applies_on
   - rule_type
   - params (jsonb)
   - consequence
   - severity
   - is_active
   - allow_override
4. Entregar migracion y semilla inicial de reglas.

Pendientes BE-DB integration:
1. Crear entities TypeORM para policies.
2. Cambiar provider IPolicyRepository:
   - de InMemoryPolicyRepository
   - a TypeOrmPolicyRepository
3. Persistir cada evaluacion en tabla de violaciones/evaluaciones.

### 3.2 Equipo Frontend
Objetivo: mostrar errores de politicas al enviar comprobacion.

Pendientes FE:
1. Enviar siempre class como code del catalogo (ALIF, CAPA, etc.), no label.
1. Conectar boton Enviar Solicitud al endpoint ya existente de submit de comprobacion.
2. Manejar respuesta 422:
   - leer policy_summary
   - renderizar lista de violations
3. Bloquear UX de avance cuando can_submit = false.
4. Mostrar mensaje por regla:
   - usar field message
   - opcional: agrupar por severity
5. Confirmar flujo exitoso cuando no hay violaciones.

No requerido en esta iteracion:
- CRUD visual de reglas de politicas (se deja para fase final).
- Override por UI (iteracion 2).

## 4) Checklist de validacion cruzada

### BE
- submit con datos validos avanza a Pending Vouchers Approval
- submit con violaciones responde 422 y no cambia estado

### FE
- pantalla muestra violaciones devueltas por policy_summary
- usuario entiende por que no puede enviar

### DB
- migraciones aplican sin romper flujo actual
- datos semilla de reglas equivalentes a las 4 del MVP

## 5) Proximo hito recomendado

Hito 2:
- conectar TypeOrmPolicyRepository
- persistir evaluaciones en tabla
- agregar endpoint de consulta de violaciones por request
- preparar base para override con auditoria
