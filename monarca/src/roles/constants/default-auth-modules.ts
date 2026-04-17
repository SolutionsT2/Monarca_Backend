/**
 * File: default-auth-modules.ts
 * Description: Seed data for permission modules (mock catalog aligned with product spec).
 */

export const DEFAULT_AUTH_MODULES: ReadonlyArray<{ id: string; name: string }> =
  [
    { id: 'mod_travel', name: 'Solicitudes de Viaje' },
    { id: 'mod_refunds', name: 'Reembolsos' },
    { id: 'mod_bookings', name: 'Reservaciones' },
  ];

/*
Modification History:
- 2026-03-27 | Efren | Initial list for roles admin API.
*/
