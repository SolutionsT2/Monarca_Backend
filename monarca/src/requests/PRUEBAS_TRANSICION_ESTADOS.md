# Pruebas de Transición de Estados — Entidad `Request` (Viaje)

> **Tipo de prueba:** Caja negra — Pruebas de transición de estados  
> **Referencia:** Sreeraman (2021) — *State Transition Testing*  
> **Objetivo:** Validar que la entidad **Viaje** (`Request`) siga la secuencia lógica permitida por las reglas de negocio, garantizando que un viaje pueda transitar de _Pendiente de Revisión_ a _Aprobado/Registrado_ sin posibilidad de revertir dichas transiciones una vez confirmadas.

---

## 1. Diagrama de Transición de Estados

```
[Pending Review] ──❶ approve()──────────────────► [Pending Reservations]
       │                                                     │
       │ deny()                              finishedReservations()
       ▼                                                     ▼
   [Denied]                              [Pending Accounting Approval]
       
[Pending Review] ──❷ cancel()──────────────────► [Cancelled]
[Changes Needed] ──  cancel()──────────────────► [Cancelled]

[Pending Accounting Approval] ──❸ SOIApproval()──► [In Progress]

[In Progress] ──❹ finishedUploadingVouchers()──► [Pending Vouchers Approval]

[Pending Vouchers Approval] ──❺ finishedApprovingVouchers()──► [Pending Refund Approval]

[Pending Refund Approval] ──❻ finishedRegisteringRequest()──► [Completed] ✅
```

> ⚠️ **IMPORTANTE:** Ninguna transición puede revertirse una vez ejecutada. Cada estado es una puerta unidireccional validada por `ConflictException` en el servicio.

---

## 2. Dónde Está Implementada Cada Validación en el Código

Todos los métodos viven en:
- **Servicio:** `src/requests/requests.status.service.ts`
- **Controlador:** `src/requests/requests.status.controller.ts`
- **Actualización de estado base:** `src/requests/requests.service.ts` → método `updateStatus()`

---

## 3. Tabla de Casos de Prueba

### ❶ Transición: `Pending Review` → `Pending Reservations` (Aprobación del Viaje)

**Endpoint:** `PATCH /requests/approve/:id`  
**Método:** `RequestsStatusService.approve()`  
**Archivo:** `requests.status.service.ts` — líneas 30–92

| # | Caso | Estado Inicial | Acción | Estado Final Esperado | Código que lo valida |
|---|------|---------------|--------|----------------------|----------------------|
| 1.1 | ✅ Aprobación exitosa | `Pending Review` | Admin asignado aprueba con `id_travel_agency` válido | `Pending Reservations` | `updateStatus(id, 'Pending Reservations')` |
| 1.2 | ❌ Estado incorrecto | `Pending Reservations` | Admin intenta aprobar de nuevo | Error `409 Conflict` | `if (request.status !== 'Pending Review') throw ConflictException` |
| 1.3 | ❌ Usuario no autorizado | `Pending Review` | Usuario que NO es el admin asignado intenta aprobar | Error `401 Unauthorized` | `if (request.id_admin !== id_user) throw UnauthorizedException` |
| 1.4 | ❌ Agencia inválida | `Pending Review` | Admin aprueba con `id_travel_agency` inexistente | Error `400 Bad Request` | `travelAgenciesChecks.Exists(id_travel_agency)` |
| 1.5 | ❌ Reversión bloqueada | `Pending Reservations` | Intento de mover de vuelta a `Pending Review` | Error `409 Conflict` | No existe endpoint; `ConflictException` bloquea en cualquier método |

```typescript
// requests.status.service.ts — líneas 48–54
if (request.id_admin !== id_user)
  throw new UnauthorizedException('Unable to approve request.');

if (request.status !== 'Pending Review')
  throw new ConflictException(
    'Unable to approve because of the requests current status.',
  );
```

---

### ❷ Transición: `Pending Review` / `Changes Needed` → `Cancelled`

**Endpoint:** `PATCH /requests/cancel/:id`  
**Método:** `RequestsStatusService.cancel()`  
**Archivo:** `requests.status.service.ts` — líneas 125–157

| # | Caso | Estado Inicial | Acción | Estado Final Esperado | Código que lo valida |
|---|------|---------------|--------|----------------------|----------------------|
| 2.1 | ✅ Cancelación desde Pending Review | `Pending Review` | Usuario dueño cancela | `Cancelled` | `updateStatus(id, 'Cancelled')` |
| 2.2 | ✅ Cancelación desde Changes Needed | `Changes Needed` | Usuario dueño cancela | `Cancelled` | `updateStatus(id, 'Cancelled')` |
| 2.3 | ❌ Estado no cancelable | `Pending Reservations` | Usuario intenta cancelar | Error `409 Conflict` | `if (status !== 'Pending Review' && status !== 'Changes Needed')` |
| 2.4 | ❌ Usuario no es el dueño | `Pending Review` | Otro usuario intenta cancelar | Error `401 Unauthorized` | `if (request.id_user !== id_user) throw UnauthorizedException` |

```typescript
// requests.status.service.ts — líneas 137–143
if (
  request.status !== 'Pending Review' &&
  request.status !== 'Changes Needed'
)
  throw new ConflictException(
    'Unable to cancel because of the requests current status.',
  );
```

---

### ❸ Transición: `Pending Accounting Approval` → `In Progress` (Aprobación SOI)

**Endpoint:** `PATCH /requests/SOI-approve/:id`  
**Método:** `RequestsStatusService.SOIApproval()`  
**Archivo:** `requests.status.service.ts` — líneas 202–234

| # | Caso | Estado Inicial | Acción | Estado Final Esperado | Código que lo valida |
|---|------|---------------|--------|----------------------|----------------------|
| 3.1 | ✅ Aprobación contable exitosa | `Pending Accounting Approval` | SOI asignado aprueba | `In Progress` | `updateStatus(id, 'In Progress')` |
| 3.2 | ❌ Estado incorrecto | `In Progress` | SOI intenta aprobar de nuevo | Error `409 Conflict` | `if (request.status !== 'Pending Accounting Approval') throw ConflictException` |
| 3.3 | ❌ Usuario no es SOI asignado | `Pending Accounting Approval` | Otro usuario intenta aprobar | Error `401 Unauthorized` | `if (request.id_SOI !== id_user) throw UnauthorizedException` |
| 3.4 | ❌ Reversión bloqueada | `In Progress` | Intento de regresar a `Pending Accounting Approval` | Error `409 Conflict` | No existe endpoint de reversión |

```typescript
// requests.status.service.ts — líneas 212–218
if (request.id_SOI !== id_user)
  throw new UnauthorizedException('Unable to approve request.');

if (request.status !== 'Pending Accounting Approval')
  throw new ConflictException(
    'Unable to change status because of the requests current status.',
  );
```

---

### ❹ Transición: `In Progress` → `Pending Vouchers Approval`

**Endpoint:** `PATCH /requests/finished-uploading-vouchers/:id`  
**Método:** `RequestsStatusService.finishedUploadingVouchers()`  
**Archivo:** `requests.status.service.ts` — líneas 236–269

| # | Caso | Estado Inicial | Acción | Estado Final Esperado | Código que lo valida |
|---|------|---------------|--------|----------------------|----------------------|
| 4.1 | ✅ Subida de comprobantes completada | `In Progress` | Usuario dueño confirma subida | `Pending Vouchers Approval` | `updateStatus(id, 'Pending Vouchers Approval')` |
| 4.2 | ❌ Estado incorrecto | `Pending Vouchers Approval` | Usuario intenta confirmar de nuevo | Error `409 Conflict` | `if (request.status !== 'In Progress') throw ConflictException` |
| 4.3 | ❌ Usuario no es el dueño | `In Progress` | Otro usuario intenta confirmar | Error `401 Unauthorized` | `if (request.id_user !== id_user) throw UnauthorizedException` |

---

### ❺ Transición: `Pending Vouchers Approval` → `Pending Refund Approval`

**Endpoint:** `PATCH /requests/finished-approving-vouchers/:id`  
**Método:** `RequestsStatusService.finishedApprovingVouchers()`  
**Archivo:** `requests.status.service.ts` — líneas 272–314

| # | Caso | Estado Inicial | Acción | Estado Final Esperado | Código que lo valida |
|---|------|---------------|--------|----------------------|----------------------|
| 5.1 | ✅ Aprobación de comprobantes exitosa | `Pending Vouchers Approval` | Admin asignado aprueba | `Pending Refund Approval` | `updateStatus(id, 'Pending Refund Approval')` |
| 5.2 | ❌ Estado incorrecto | `Pending Refund Approval` | Admin intenta aprobar de nuevo | Error `409 Conflict` | `if (request.status !== 'Pending Vouchers Approval') throw ConflictException` |
| 5.3 | ❌ Usuario no es el admin asignado | `Pending Vouchers Approval` | Otro usuario intenta aprobar | Error `401 Unauthorized` | `if (request.id_admin !== id_user) throw UnauthorizedException` |

---

### ❻ Transición: `Pending Refund Approval` → `Completed` (Registro Final)

**Endpoint:** `PATCH /requests/complete-request/:id`  
**Método:** `RequestsStatusService.finsihedRegisteringRequest()`  
**Archivo:** `requests.status.service.ts` — líneas 317–348

| # | Caso | Estado Inicial | Acción | Estado Final Esperado | Código que lo valida |
|---|------|---------------|--------|----------------------|----------------------|
| 6.1 | ✅ Registro final exitoso | `Pending Refund Approval` | SOI asignado completa el registro | `Completed` ✅ | `updateStatus(id, 'Completed')` |
| 6.2 | ❌ Estado incorrecto | `Completed` | SOI intenta completar de nuevo | Error `409 Conflict` | `if (request.status !== 'Pending Refund Approval') throw ConflictException` |
| 6.3 | ❌ Usuario no es el SOI asignado | `Pending Refund Approval` | Otro usuario intenta completar | Error `401 Unauthorized` | `if (request.id_SOI !== id_user) throw UnauthorizedException` |
| 6.4 | ❌ Reversión desde Completed bloqueada | `Completed` | Cualquier usuario intenta revertir | No hay endpoint de reversión | Regla de negocio: estado final irreversible |

```typescript
// requests.status.service.ts — líneas 326–332
if (request.id_SOI !== id_user)
  throw new UnauthorizedException('Unable to change status on request.');

if (request.status !== 'Pending Refund Approval')
  throw new ConflictException(
    'Unable to change status because of the requests current status.',
  );
```

---

## 4. Método Transversal: `updateStatus()`

Todas las transiciones llaman a este método central. Además de cambiar el estado, **genera un log automático** de cada transición.

**Archivo:** `src/requests/requests.service.ts` — líneas 401–423

```typescript
async updateStatus(id: string, newStatus: string): Promise<RequestEntity> {
  const request = await this.requestsRepo.findOne({ where: { id } });

  if (!request) {
    throw new Error('Request not found');
  }
  const previousStatus = request.status;  // ← guarda estado anterior
  request.status = newStatus;

  const updated = await this.requestsRepo.save(request);

  // Log automático de cada transición de estado
  await this.logRequestAction(
    this.dataSource.createEntityManager(),
    updated.id,
    updated.id_user,
    'status_change',
    newStatus,
    { fromStatus: previousStatus },  // ← registra de dónde vino
  );

  return updated;
}
```

> 📋 Cada cambio de estado queda registrado en `RequestLog` con el estado anterior y el nuevo, lo que permite auditoría completa del historial de transiciones.

---

## 5. Aviso para el Usuario Final (UI)

Para cumplir con el requerimiento de **notificar al usuario que la aprobación/registro es irreversible**, se recomienda mostrar el siguiente aviso en el frontend antes de ejecutar las acciones críticas:

| Acción | Aviso sugerido |
|--------|----------------|
| Aprobar viaje (`approve`) | ⚠️ *"Una vez aprobado el viaje, esta acción no podrá revertirse. El viaje pasará a estado de Reservaciones Pendientes."* |
| Aprobación SOI (`SOI-approve`) | ⚠️ *"Al confirmar la aprobación contable, el viaje pasará a estado En Progreso y no podrá revertirse."* |
| Aprobar comprobantes (`finished-approving-vouchers`) | ⚠️ *"Al aprobar los comprobantes, el viaje quedará pendiente de aprobación de reembolso. Esta acción es irreversible."* |
| Registrar como completado (`complete-request`) | ⚠️ *"Al registrar el viaje como completado, el proceso finaliza definitivamente. Esta acción no tiene vuelta atrás."* |

---

## 6. Resumen de Reglas de Negocio Validadas

| Regla | Implementación en Código |
|-------|-------------------------|
| Solo el admin asignado puede aprobar | `request.id_admin !== id_user → UnauthorizedException` |
| Solo el SOI asignado puede aprobar contablemente | `request.id_SOI !== id_user → UnauthorizedException` |
| Solo el dueño puede cancelar | `request.id_user !== id_user → UnauthorizedException` |
| Solo la agencia asignada puede completar reservaciones | `id_travel_agency !== request.id_travel_agency → UnauthorizedException` |
| Cada estado solo acepta una transición hacia adelante | `request.status !== 'EstadoEsperado' → ConflictException` |
| No existe endpoint de reversión para ningún estado aprobado | Diseño de rutas en `requests.status.controller.ts` |
| Toda transición queda auditada | `logRequestAction()` en `requests.service.ts` |

---

*Documento generado para el proyecto **Monarca Backend** — Módulo `requests`.*
