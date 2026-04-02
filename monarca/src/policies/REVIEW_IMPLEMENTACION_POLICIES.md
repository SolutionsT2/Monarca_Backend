# Revision interna - Implementacion Policies

Fecha: 2026-04-02
Modulo: Policy Engine
Objetivo: validar politicas de comprobacion con datos reales de BD y bloquear tanto en create voucher como en submit cuando existan violaciones bloqueantes.

## 1) Estado actual implementado

### 1.1 Motor canonico activo
El flujo usa el modulo con BD real:

- src/policy-engine/policy-engine.module.ts
- src/policy-engine/policy-engine.service.ts
- src/policy-engine/entities/policy.entity.ts
- src/policy-engine/entities/policy-rule.entity.ts
- src/policy-engine/entities/policy-violation.entity.ts

El modulo in-memory en src/policies queda solo como referencia temporal/deprecada.

### 1.2 Flujo de submit (finished-uploading-vouchers)
En RequestsStatusService se usa evaluateRequestSubmission del policy-engine DB.

Comportamiento:
1. Evalua reglas por request y por voucher.
2. Si hay bloqueantes: responde 422 con policy_summary y no cambia estado.
3. Si no hay bloqueantes: continua notificacion y cambia a Pending Vouchers Approval.

Regla adicional de negocio ya implementada:
1. Si la solicitud tiene anticipo (advance_money > 0) y no hay vouchers, bloquea submit con 422.
2. Si no hubo anticipo, puede continuar sin vouchers (segun flujo actual).

### 1.3 Flujo de creacion de voucher
VouchersService.create valida inmediatamente con el policy-engine.

Comportamiento actual:
1. Guarda temporalmente el voucher.
2. Evalua reglas de voucher.
3. Si falla: elimina el voucher y responde 422 con policy_summary.
4. Si pasa: conserva el voucher y responde exito.

Resultado: se evita el escenario donde un voucher invalido queda persistido y solo falla hasta submit.

### 1.4 Auditoria de violaciones
Se persisten violaciones en policy_violations cuando una evaluacion bloqueante falla.
Tambien se actualiza policy_status por voucher (APPROVED o POLICY_VIOLATION).

### 1.5 Endpoint de consulta por request
Se mantiene endpoint de consulta por solicitud:

- GET /requests/:id/policy-violations

Salida:
- request_id
- total
- violations[]
  - id, id_voucher, id_policy_rule, detail, created_at
  - voucher: class, amount, currency, date
  - rule: expense_class, operator, threshold_value, threshold_unit, consequence

### 1.6 Politica general de tiempo de comprobante por ventana de viaje
Nueva regla implementada:
- operator: VOUCHER_DATE_WITHIN_TRIP_WINDOW
- expense_class: TODAS

Comportamiento:
1. Calcula ventana del viaje usando requests_destinations:
   - inicio = menor arrival_date
   - fin = mayor departure_date
2. Valida cada voucher.date contra esa ventana.
3. Si algun voucher cae fuera de rango, bloquea submit con 422.

Cubre:
- viaje de un solo destino
- viaje multidestino

### 1.7 Contrato FE-BE de clase de gasto
Se mantiene contrato por codigos canonicos:

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

Backend normaliza aliases legacy para evitar mismatch de nomenclatura.

## 2) Seed y datos de politicas

Seeds involucrados:
- seeds/policies.json
- seeds/policy-rules.json
- seeds/policy-violations.json

Integracion del seed:
- seed.service.ts
- src/app.module.ts (repos forFeature)

Reglas semilla activas:
1. Cobertura por clase con MISSING_XML para los 14 codigos canonicos.
2. Topes de monto temporales:
   - ALIF + LT 50 MXN
   - resto de clases + LT 5000 MXN
3. TODAS + DAYS_EXCEEDED 28
4. TODAS + VOUCHER_DATE_WITHIN_TRIP_WINDOW
5. TODAS + TOTAL_LTE_ADVANCE

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

Notas para FE:
1. Mostrar violations[].message de forma visible.
2. En reglas de tiempo de viaje, usar violations[].evaluated_value para dar contexto (trip_start_date, trip_end_date, out_of_window_voucher_ids).
3. No depender de logs de consola del backend para UX.

## 4) Logging operativo

El backend ya imprime alertas detalladas en consola cuando hay violaciones:
1. resumen de validacion fallida
2. detalle por violacion
3. contexto de operador, severidad, consequence y evaluated_value

## 5) Seeder y convenciones de nombres

Contexto:
1. BD usa snake_case.
2. Entidades TS pueden usar camelCase con mapeo @Column({ name: ... }).

Ajuste aplicado:
1. En SeedService para User se normaliza input snake_case/camelCase y se crea entidad con repo.create(...), evitando cast inseguro.
2. Esto permite mantener users.json en snake_case sin romper tipado TS.

## 6) Riesgos conocidos y decisiones

1. Siguen coexistiendo dos carpetas (policy-engine canonico y src/policies deprecado).
2. Hay ruido de lint/format (CRLF/LF) no funcional.
3. Se recomienda migrar a migraciones formales de TypeORM para ambientes controlados.

## 7) Siguientes pasos (priorizados)

1. Frontend: render consistente de 422 en create y submit, incluyendo regla de ventana de viaje.
2. Agregar pruebas de integracion:
   - create voucher bloqueado
   - submit bloqueado por anticipo sin vouchers
   - submit bloqueado por fecha fuera de ventana
   - submit exitoso
3. Conectar vista FE a GET /requests/:id/policy-violations.
4. Cleanup final de src/policies cuando QA valide equivalencia completa.
5. Migrar catalogo de clases de gasto a BD (eliminar dependencia hardcoded).
