# Revision interna - Implementacion Policies

Fecha: 2026-03-30
Modulo: Policy Engine
Objetivo: validar politicas de comprobacion con datos reales de BD y bloquear desde la creacion de voucher cuando haya violaciones bloqueantes.

## 1) Estado actual implementado

### 1.1 Motor canónico activo
El flujo ya usa el modulo con BD real:

- src/policy-engine/policy-engine.module.ts
- src/policy-engine/policy-engine.service.ts
- src/policy-engine/entities/policy.entity.ts
- src/policy-engine/entities/policy-rule.entity.ts
- src/policy-engine/entities/policy-violation.entity.ts

El modulo in-memory en src/policies se mantiene solo como referencia temporal/deprecada.

### 1.2 Flujo de submit (finished-uploading-vouchers)
En RequestsStatusService se usa evaluateRequestSubmission del policy-engine DB.

Comportamiento:
1. Evalua reglas por request y por voucher.
2. Si hay bloqueantes: responde 422 con policy_summary y no cambia estado.
3. Si no hay bloqueantes: continua notificacion y cambia a Pending Vouchers Approval.

### 1.3 Flujo de creacion de voucher
VouchersService.create ahora valida inmediatamente con el policy-engine.

Comportamiento actual:
1. Guarda temporalmente el voucher.
2. Evalua reglas de voucher.
3. Si falla: elimina el voucher y responde 422 con policy_summary.
4. Si pasa: conserva el voucher y responde exito.

Resultado: se evita el escenario de negocio donde un voucher invalido queda persistido y solo falla hasta submit.

### 1.4 Auditoria de violaciones
Se persisten violaciones en policy_violations cuando una evaluacion bloqueante falla.
Tambien se actualiza policy_status por voucher (APPROVED o POLICY_VIOLATION).

### 1.5 Endpoint de consulta por request
Se agrego endpoint para consultar violaciones por solicitud:

- GET /requests/:id/policy-violations

Comportamiento:
1. Reutiliza validacion de acceso de RequestsService.findOne (owner/admin/SOI/TA asignada).
2. Consulta policy_violations por vouchers del request.
3. Devuelve total y detalle de violaciones con datos de voucher y regla.

Salida:
- request_id
- total
- violations[]
   - id, id_voucher, id_policy_rule, detail, created_at
   - voucher: class, amount, currency, date
   - rule: expense_class, operator, threshold_value, threshold_unit, consequence

### 1.6 Contrato FE-BE de clase de gasto
Se mantiene el contrato por codigos canónicos:

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

El backend normaliza aliases legacy para evitar mismatch de nomenclatura.
Nota: hoy este catalogo sigue en codigo (src/vouchers/types/voucher-spend.types.ts y validacion en src/vouchers/dto/create-voucher-dto.ts), no en BD.

## 2) Seed y datos de politicas

Se agrego seed para tablas de policies:

- seeds/policies.json
- seeds/policy-rules.json
- seeds/policy-violations.json

El seed ya se integra en:

- seed.service.ts
- src/app.module.ts (repos forFeature)

Reglas semilla incluidas:
1. Cobertura por clase (14 codigos canónicos) con MISSING_XML:
   - ALIF, CAPA, CPF, FIDP, GAS, HTLP, LAUN, NDPR, NDVA, REAU, TCCF, TSCF, TRAA, AIRP
2. Topes de monto temporales (fase 2):
   - ALIF + LT 50 MXN
   - CAPA, CPF, FIDP, GAS, HTLP, LAUN, NDPR, NDVA, REAU, TCCF, TSCF, TRAA, AIRP + LT 5000 MXN
3. TODAS + DAYS_EXCEEDED 28
4. TODAS + TOTAL_LTE_ADVANCE (anticipo)
5. Logging detallado en consola cuando hay violaciones para identificar regla, severidad, consecuencia y valor evaluado.

## 3) Contrato de error para frontend

Cuando bloquea, la API responde 422 con:

- statusCode
- message
- policy_summary

policy_summary contiene:

- total_rules
- passed
- failed
- blocking_violations
- can_submit
- violations[]

Esto aplica tanto para submit como para create voucher cuando hay violacion bloqueante.

## 4) Riesgos conocidos y decisiones

1. Todavia existen dos carpetas de policies en repo.
   - Decision: policy-engine es fuente canónica.
   - src/policies queda deprecado hasta limpieza final.
2. Las pruebas unitarias actuales del proyecto fallan por configuracion/imports de test no relacionados al motor de policies.
3. Hay ruido de lint por EOL (CRLF/LF) en algunos archivos; no afecta logica de negocio.

## 5) Siguientes pasos (priorizados)

1. Ajustar frontend para manejar 422 tambien en create voucher (no solo en submit), mostrando policy_summary de forma consistente.
2. Unificar mensajes UX para evitar alertas optimistas de exito antes de confirmar respuesta del backend.
3. Conectar frontend a GET /requests/:id/policy-violations para vista de auditoria/historial.
4. Decidir y ejecutar cleanup final de src/policies (in-memory) una vez validado en QA.
5. Agregar pruebas de integracion para:
   - create voucher bloqueado
   - submit bloqueado
   - submit exitoso
6. Migrar a migraciones formales de TypeORM (evitar dependencia en synchronize true para ambientes controlados).
7. Migrar catalogo de clases de gasto a BD (tabla de catalogo + seed), para eliminar dependencia de lista hardcoded en backend.
8. Mantener la politica de anticipo como regla request-level con nombre claro: "El total comprobado no debe exceder el anticipo recibido o autorizado".

## 6) Checklist de validacion rapida

Backend:
- create voucher invalido responde 422 y no persiste en vouchers
- submit invalido responde 422 y request permanece In Progress
- submit valido cambia a Pending Vouchers Approval

Frontend:
- renderiza policy_summary.violations en create y submit
- no muestra exito si la API responde 422

DB:
- tablas policies, policy_rules y policy_violations pobladas
- reglas activas coherentes con codigos de gasto del frontend
