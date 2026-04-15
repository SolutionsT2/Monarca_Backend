# Duffel Integration Plan

Documento vivo para dar seguimiento a la integración de Duffel en Monarca.
La idea es mantener aquí lo que ya se hizo, lo que sigue y qué le corresponde a cada área.

## Objetivo

Integrar Duffel como proveedor de consulta de vuelos dentro del flujo de agencias, sin compra directa, sin pagos y sin redirección a sitios externos.

La implementación del MVP se enfoca en mostrar opciones de vuelo disponibles según los criterios de búsqueda enviados desde frontend.

## Estado actual

- Se creó la base de integración en `travel-integrations`.
- Se agregó el SDK de Duffel al subproyecto correcto.
- Se agregó trazabilidad de Duffel en `request destinations`.
- Se dejaron disponibles los endpoints de búsqueda de ofertas (offer request, listado y detalle).
- Se dejó la configuración base de entorno en `.env.example`.

## Lo que sigue

1. Normalizar mejor la respuesta del proveedor para no exponer su estructura cruda en el dominio.
2. Agregar manejo de errores más fino por tipo/código de Duffel.
3. Definir un contrato estable para frontend (campos mínimos para tarjetas/listados de vuelos).

## Responsabilidades por área

### Backend

Lo que sí me corresponde en este trabajo:

- Definir el flujo de negocio y las validaciones.
- Crear controllers, services y DTOs.
- Integrar Duffel mediante un adaptador interno.
- Proteger rutas con auth y permisos.
- Mantener el estado de solicitudes alineado con el proceso real.
- Exponer contratos claros para frontend para consulta y visualización de vuelos.

Lo que no me corresponde como backend en este punto:

- Diseñar ni ejecutar trabajo directo de base de datos a nivel operativo.
- Administrar backups, tuning o mantenimiento de infraestructura de BD.
- Hacer cambios manuales fuera del flujo normal de la app si eso depende de otra área.

### Base de Datos

Responsabilidades esperadas de esa área:

- Validar que no se requieran cambios de esquema para el MVP de consulta.
- Revisar impacto de logging o almacenamiento temporal si se agrega caché de resultados.

### Frontend

Responsabilidades esperadas de esa área:

- Mostrar el flujo de búsqueda y visualización de vuelo para la agencia.
- Enviar filtros/criterios de búsqueda en el formato esperado por backend.
- Consumir los endpoints de Duffel integrados en backend.
- Mostrar resultados, paginación, estados de carga y errores de forma clara.

### QA / Testing

Responsabilidades esperadas de esa área:

- Probar el flujo completo de búsqueda y visualización de ofertas.
- Validar que una solicitud fuera de `Pending Reservations` no pueda usar la consulta, si esa regla sigue activa.
- Verificar manejo de errores de proveedor y timeouts.
- Confirmar que la respuesta entregada a frontend sea consistente y suficiente para UI.

### DevOps / Infra

Responsabilidades esperadas de esa área:

- Configurar variables de entorno seguras.
- Revisar secretos y despliegue por ambiente.
- Asegurar timeouts y logging adecuados para llamadas externas.
- Preparar monitoreo básico para integraciones de terceros.

## Flujo propuesto

1. La solicitud se crea y pasa por su flujo normal.
2. La agencia entra a `Pending Reservations`.
3. Backend crea un offer request en Duffel.
4. Backend lista las ofertas disponibles.
5. La agencia selecciona una oferta.
6. Backend devuelve detalle actualizado de la oferta seleccionada.
7. Frontend muestra resultados y permite continuar con el proceso interno fuera de Duffel.

## Decisiones ya tomadas

- Duffel se usa en la fase de agencia, no en la captura inicial del solicitante.
- La integración debe vivir aislada del dominio principal.
- El MVP actual queda en modo `search-only`.
- La compra, pago y webhooks pasan a una fase posterior.
- No habrá redirección de usuario a páginas de proveedores en esta fase.

## Pendientes abiertos

- Definir contrato de respuesta normalizada para frontend (precio, aerolínea, horarios, duración, escalas, moneda).
- Confirmar reglas de negocio para acceso a consulta por estatus de solicitud.
- Definir límites de paginación y estrategia de reintento frente a timeouts.
- Diseñar la fase 2 (compra/pago/webhooks) como iniciativa separada.
