# Duffel Integration Plan

Documento vivo para dar seguimiento a la integración de Duffel en Monarca.
La idea es mantener aquí lo que ya se hizo, lo que sigue y qué le corresponde a cada área.

## Objetivo

Integrar Duffel como proveedor inicial de reservas de viaje dentro del flujo de agencias, sin romper el estado actual de solicitudes.

La implementación se está llevando en la fase de `Pending Reservations`, cuando la agencia ya trabaja la reserva y completa la operación.

## Estado actual

- Se creó la base de integración en `travel-integrations`.
- Se agregó el SDK de Duffel al subproyecto correcto.
- Se extendió el modelo de reservas para guardar metadatos del proveedor.
- Se agregó trazabilidad de Duffel en `request destinations`.
- Se validó que la reserva Duffel solo se cree cuando la solicitud está en `Pending Reservations`.
- Se conectó la creación de orden de Duffel con la persistencia de la reserva interna.
- Se agregó manejo de webhook de Duffel para actualizar reservas por referencia externa.
- Se dejó la configuración base de entorno en `.env.example`.

## Lo que sigue

1. Normalizar mejor la respuesta del proveedor para no exponer su estructura cruda en el dominio.
2. Agregar manejo de errores más fino por tipo/código de Duffel.
3. Registrar el webhook real en el dashboard de Duffel y guardar su secret en ambiente seguro.

## Responsabilidades por área

### Backend

Lo que sí me corresponde en este trabajo:

- Definir el flujo de negocio y las validaciones.
- Crear controllers, services y DTOs.
- Integrar Duffel mediante un adaptador interno.
- Guardar la trazabilidad mínima necesaria en las entidades.
- Proteger rutas con auth y permisos.
- Mantener el estado de solicitudes alineado con el proceso real.
- Exponer contratos claros para frontend y para futuros webhooks.

Lo que no me corresponde como backend en este punto:

- Diseñar ni ejecutar trabajo directo de base de datos a nivel operativo.
- Administrar backups, tuning o mantenimiento de infraestructura de BD.
- Hacer cambios manuales fuera del flujo normal de la app si eso depende de otra área.

### Base de Datos

Responsabilidades esperadas de esa área:

- Aplicar y revisar migrations.
- Validar índices, tipos y constraints.
- Confirmar que los nuevos campos de reservas y request destinations sean compatibles con el modelo real.
- Revisar impacto de rendimiento y almacenamiento para metadatos JSON.

### Frontend

Responsabilidades esperadas de esa área:

- Mostrar el flujo de búsqueda y selección de vuelo para la agencia.
- Capturar los datos de pasajeros y reserva que se necesitan para crear la orden.
- Consumir los endpoints de Duffel integrados en backend.
- Mostrar estados de reserva, errores y confirmaciones de forma clara.

### QA / Testing

Responsabilidades esperadas de esa área:

- Probar el flujo completo de búsqueda, selección y reserva.
- Validar que una solicitud fuera de `Pending Reservations` no pueda reservarse.
- Verificar manejo de errores de proveedor y timeouts.
- Confirmar que la trazabilidad guardada en backend sea correcta.

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
6. Backend crea la orden y guarda la reserva interna.
7. Más adelante, si hace falta, se sincroniza el estado por webhook.

## Decisiones ya tomadas

- Duffel se usa en la fase de agencia, no en la captura inicial del solicitante.
- La integración debe vivir aislada del dominio principal.
- El modelo interno de reservas debe guardar solo lo necesario del proveedor.
- Webhooks quedan para una fase posterior, no para bloquear el MVP.

## Pendientes abiertos

- Definir el contrato exacto de persistencia de la orden de Duffel.
- Revisar si conviene agregar una entidad dedicada para booking externo o seguir con `Reservation`.
- Determinar el punto exacto donde frontend enviará los datos finales de pasajeros.
- Preparar el plan de webhooks y reconciliación de estados.
