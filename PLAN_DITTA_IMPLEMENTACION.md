# Pre-Planning - 18 puntos (Monarca)

Fecha: 2026-02-26
Repos: `Monarca_Backend` + `Monarca_Frontend`
Objetivo: tener los 18 puntos listos para prep planning con dependencias claras y estimaciones full-time (1 persona)

---

## Punto 1 - Sistema de autorizacion configurable (niveles de autorizacion, por montos, por nacional/internacional, duracion, sustitutos de autorizadores)

- Necesidades/Retos tecnicos:
  - Definicion de Grupos/Roles custom (ilimitados). El sistema actual en `src/roles/` y `src/guards/permissions.guard.ts` soporta permisos basicos, pero no permite crear roles dinamicos con permisos granulares ni configurar niveles de autorizacion por monto o tipo de viaje.
  - Definicion de Permisos granulares: `Can Write New Flight`, `Can Edit Flight`, `Can Read Flight`, `Can Delete Flight`, `Can approve Budget Change`, `Can approve cheap flight change`, `Can approve expensive flight change`, etc. El sistema debe relacionar por medio de la base de datos cada uno de estos permisos y cada vista/endpoint revisa no al grupo/rol sino la presencia de ese permiso.
  - Se debe poder poner un tiempo de expiracion para el permiso (ej. un sustituto temporal de autorizador mientras alguien esta de vacaciones).
  - Vista para administrar roles y los permisos amarrados a cada rol.
  - Proceso/API que pueda recibir esta configuracion por medio de un XML. Definir formato del XML.
  - Logica de sustitutos: cuando un autorizador no esta disponible, se asigna automaticamente a su sustituto configurado.
- Delivery:
  - Backend: Refactorizar el modulo de Roles/Permisos para soportar permisos granulares con expiracion. Endpoint CRUD de roles con asignacion dinamica de permisos. Endpoint para importar configuracion via XML. Logica de sustitutos de autorizadores.
  - Frontend: Vista de administracion de roles/permisos. Formulario para crear/editar roles con selector de permisos. Panel de configuracion de sustitutos.
- Nivel prioridad: Alta — Es la base fundacional del sistema. P5 (politicas de reembolso), P6 (autorizacion multi-nivel) y P14 (autorizacion por correo) dependen directamente de que existan permisos granulares configurables. Sin este punto, no se puede implementar ningun flujo de aprobacion real.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Redisenar esquema de BD para permisos granulares: tabla `permissions` con `id`, `name`, `description`, `module`, `action`. Tabla pivot `roles_permissions` con `role_id`, `permission_id`, `expires_at`. Migracion TypeORM. (1.0 dia)
  - ST2: Refactorizar `PermissionsGuard` en `src/guards/permissions.guard.ts` para que valide la presencia del permiso especifico (no solo el rol) y respete la expiracion temporal. (1.0 dia)
  - ST3: Crear endpoints CRUD para gestion de roles y permisos: `POST /roles`, `PATCH /roles/:id/permissions`, `GET /roles/:id/permissions`. Crear endpoint `POST /roles/import-xml` con validacion del formato XML definido. (1.5 dias)
  - ST4: Implementar logica de sustitutos: tabla `authorization_delegates` con `delegator_id`, `delegate_id`, `valid_from`, `valid_until`. Middleware que redirige aprobaciones al sustituto cuando el autorizador original no esta disponible. (1.0 dia)
  - ST5: Vista frontend de administracion de roles con selector de permisos (checkboxes por modulo). Panel de sustitutos. (1.0 dia)
  - ST6: Pruebas: verificar que un permiso expirado se rechaza, que un sustituto puede aprobar, que la importacion XML crea roles correctamente. (0.5 dias)
  - Total: 6.0 dias
- Que dependencias tiene esta tarea:
  - Ninguna critica. Trabaja sobre el modulo de `roles/` y `guards/` ya existente.
- De que otras tareas es dependencia esta:
  - P5 (Politicas de reembolso): las reglas de aprobacion de reembolso dependen de que existan permisos configurables.
  - P6 (Autorizacion previa vs posterior): los niveles de autorizacion por monto/destino/moneda requieren este sistema de permisos granulares.
  - P14 (Autorizacion por correo): el correo debe respetar los permisos del aprobador.
- Criterios de aceptacion:
  - Se pueden crear roles custom con permisos granulares desde la UI sin tocar codigo.
  - Un permiso con fecha de expiracion deja de funcionar automaticamente despues de la fecha.
  - Un sustituto asignado puede aprobar solicitudes destinadas al autorizador original durante el periodo configurado.
  - La importacion de un XML con la configuracion de roles/permisos crea correctamente las entidades en BD.
  - Cada endpoint valida el permiso especifico y no solo el rol generico.

---

## Punto 2 - Integrar con sistema de contabilidad externo (Ditta)

- Necesidades/Retos tecnicos:
  - Definir la estructura del JSON de salida que Ditta espera recibir. Ditta necesita definir los datos contables a extraer (cuentas mayores, centros de costo, IDs de acreedor, indicadores de impuestos, etc.).
  - El JSON debe incluir todos los datos de un lote de gastos: solicitudes aprobadas, vouchers con desglose fiscal, tipo de cambio aplicado, centro de costo, y datos del empleado (ID contable externo).
  - Proceso de export de JSON que se ejecute periodicamente o bajo demanda.
  - Opcional: desarrollar API (endpoint REST) que Ditta pueda consultar para obtener el JSON directamente.
  - Control de lotes: cada exportacion debe generar un `batch_id` para rastrear que datos ya se enviaron y evitar duplicados.
- Delivery:
  - Backend: `AccountingExportService` con metodo `generateBatch()` que recopila los datos contables y genera el JSON. Endpoint `GET /accounting/export?from=&to=` que devuelve el JSON en el formato de Ditta. Endpoint `GET /accounting/batches` para consultar lotes anteriores.
  - Frontend: Pantalla de exportacion contable donde el SOI selecciona rango de fechas y genera/descarga el lote.
- Nivel prioridad: Alta — Es el entregable principal para el cliente (Ditta). La integracion contable es el objetivo de negocio central del proyecto: sin la exportacion de datos fiscales, Monarca no cumple su proposito como sistema de gestion de gastos de viaje para Ditta.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Reunir con Ditta el diccionario de datos y definir el contrato JSON exacto (campos, tipos, formato de fechas, codigos de impuestos). Documentar el esquema. (0.5 dias)
  - ST2: Crear `AccountingExportModule` con `AccountingExportService`. Implementar la query que junta datos de `requests`, `vouchers`, `users`, `cost-centers` con los campos contables (agregados en P3). Generar JSON conforme al contrato. (1.5 dias)
  - ST3: Crear entidad `AccountingBatch` con `id UUID`, `generated_at`, `date_from`, `date_to`, `record_count`, `status` (`GENERATED`, `SENT`, `CONFIRMED`). Cada voucher incluido se marca con el `batch_id`. (0.5 dias)
  - ST4: Endpoints REST: `POST /accounting/export` (genera lote nuevo), `GET /accounting/batches` (lista lotes), `GET /accounting/batches/:id` (descarga JSON del lote). Proteger con permisos de SOI/Admin. (0.5 dias)
  - ST5: Vista frontend para generar y descargar exportaciones contables. (0.5 dias)
  - ST6: Pruebas: verificar que el JSON generado cumple el contrato de Ditta, que no hay datos duplicados entre lotes, que los montos cuadran. (0.5 dias)
  - Total: 4.0 dias
- Que dependencias tiene esta tarea:
  - P3 (Adaptar tablas contables): no se puede exportar un JSON contable si la BD no tiene donde almacenar los codigos que Ditta necesita.
  - P17 (Tipos de cambio): el JSON de exportacion necesita incluir el tipo de cambio oficial usado para cada gasto en moneda extranjera.
  - P18 (Centro de costos): cada gasto debe tener asignado su centro de costo contable.
  - Consultoria externa: disponibilidad del equipo de Ditta para entregar su diccionario de datos.
- De que otras tareas es dependencia esta:
  - Es el punto final de la cadena contable. Consume datos de P3, P10, P17, P18.
- Criterios de aceptacion:
  - El JSON exportado contiene todos los campos requeridos por Ditta sin valores nulos en campos obligatorios.
  - Cada lote tiene un `batch_id` unico y los vouchers incluidos quedan marcados para no re-exportarse.
  - El endpoint es accesible solo para usuarios con rol SOI o Administrador.
  - Los montos en el JSON cuadran con los datos de la BD (verificable con query directa).

---

## Punto 3 - Adaptar las tablas existentes para anadir los datos de contabilidad

- Necesidades/Retos tecnicos:
  - Identificacion de Campos ERP (Ditta): las entidades como `User` (`src/users/entities/user.entity.ts`) o `CostCenter` tienen nombres descriptivos, pero carecen de las Llaves Primarias Externas que el sistema contable usa. Ejemplos: "Cuenta Mayor", "ID de Acreedor SAP", "Indicador de Impuestos".
  - Modificacion de Entidades (TypeORM): se deben alterar los archivos `entity.ts` para incluir estos campos sin romper las relaciones existentes.
  - Normalizacion de Montos y Tasas: Ditta requiere que el IVA no solo sea un codigo "V7", sino que en la BD se desglose el Monto Base y el Monto del Impuesto como valores numericos (`DECIMAL`) para evitar errores de redondeo en el JSON de exportacion.
  - Preservacion de Historial: al anadir columnas obligatorias a tablas con datos (como los generados por `seed.service.ts`), se requiere crear scripts de migracion que asignen valores por defecto para no corromper la BD actual.
- Delivery:
  - Backend: Migraciones de BD para anadir columnas contables. Entidades actualizadas (`User`, `Voucher`, `CostCenter`, `TravelAgency`). Data Import Service para cargar masivamente los IDs contables desde CSV/Excel proporcionado por Ditta.
  - Frontend: Actualizacion de DTOs y formularios para que el Administrador o SOI puedan asignar codigos contables a nuevos usuarios o centros de costo. Validaciones visuales para asegurar que los campos contables cumplan con el formato de Ditta.
- Nivel prioridad: Alta — Es el cimiento tecnico para P2 (integracion Ditta). Sin las columnas contables en la BD (external_creditor_id, gl_account_code, base_amount, tax_amount), es imposible generar el JSON de exportacion. Tambien alimenta a P10 (extraccion XML) que necesita donde guardar los datos fiscales extraidos.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Analisis de esquema Ditta: cruzar el esquema actual de Monarca contra los requerimientos de Ditta para detectar campos faltantes. (0.5 dias)
  - ST2: Refactorizacion de Entidades: modificar `User` (anadir `external_creditor_id`), `CostCenter` (anadir `gl_account_code`), y `Voucher` (anadir `base_amount`, `tax_amount`, `accounting_date`). Modificar `Request` (anadir `accounting_batch_id`). (1.0 dia)
  - ST3: Crear y ejecutar migraciones TypeORM para actualizar la BD PostgreSQL sin perdida de datos. Asignar valores por defecto a registros existentes. (0.5 dias)
  - ST4: Actualizar `seed.service.ts` y los archivos `.json` en `seeds/` para incluir datos contables realistas en el entorno de desarrollo. (0.5 dias)
  - ST5: Crear un comando de consola o endpoint para subir un CSV con el mapeo de "Empleado ID" vs "Codigo Contable Ditta" (`DataImportService`). (1.0 dia)
  - ST6: Modificar formularios de administracion en el frontend para permitir la edicion de los nuevos campos contables. Implementar decoradores de `class-validator` en los DTOs para asegurar que los codigos contables sean validos. (1.0 dia)
  - ST7: Pruebas: verificar migracion sin perdida de datos, consistencia numerica (`base_amount + tax_amount == total_amount`), acceso restringido a campos contables. (0.5 dias)
  - Total: 5.0 dias
- Campos clave a incorporar:
  - Tabla `users`: `external_creditor_id` (string) - ID del empleado en la nomina contable.
  - Tabla `cost_centers`: `gl_account_code` (string) - Cuenta contable mayor.
  - Tabla `vouchers`: `base_amount` (decimal), `tax_amount` (decimal), `accounting_date` (date).
  - Tabla `requests`: `accounting_batch_id` (uuid) - ID del lote de exportacion.
- Que dependencias tiene esta tarea:
  - Consultoria Externa: disponibilidad del equipo de Ditta para entregar su diccionario de datos.
  - Modulo de Centros de Costo (`src/cost-centers/`): debe estar funcional para permitir la extension de sus atributos.
- De que otras tareas es dependencia esta:
  - P2 (Integracion contable): es el cimiento. No se puede exportar JSON contable sin estos campos.
  - P10 (Extraccion XML): los datos extraidos de la factura se mapean a `base_amount` y `tax_amount`.
- Criterios de aceptacion:
  - Migracion Exitosa: la BD se actualiza sin borrar los viajes o usuarios creados previamente.
  - Consistencia Numerica: en la tabla `vouchers`, la suma de `base_amount + tax_amount` debe coincidir exactamente con el `total_amount` original.
  - Acceso Restringido: los campos contables externos (`external_creditor_id`) solo son editables por usuarios con rol de Administrador o SOI.
  - Soporte Multi-moneda: los campos de monto deben soportar precision decimal para evitar discrepancias en centavos durante la conciliacion.

---

## Punto 4 - Hacer la aplicacion responsiva en moviles

- Necesidades/Retos tecnicos:
  - Estado actual: ~40% responsivo. El uso de clases como `grid-cols-1 sm:grid-cols-2` en los formularios (`TravelRequestForm.tsx`) permite que los campos se apilen en moviles. Los botones de Flowbite heredan comportamientos basicos.
  - Lo que falta: el Sidebar es fijo (`w-[200px]`), lo que tapa el contenido en moviles. Las Tablas Dinamicas (`DynamicTable`) tienen demasiadas columnas para un celular, provocando scroll horizontal infinito. El Mosaico del Dashboard se ve desalineado en pantallas verticales.
  - Navegacion Movil (Menu Hamburguesa): el Sidebar debe transformarse en un "Drawer" (menu lateral oculto) que aparezca solo al tocar un icono en el Header.
  - Estrategia de Tablas (Card-View vs Overflow): las tablas con mas de 4 columnas no caben en moviles. Se debe implementar scroll horizontal controlado o transformacion a tarjetas verticales via CSS Media Queries.
  - Visualizacion de PDFs (Swiper): el visor de comprobantes debe ajustar su altura y controles tactiles.
  - Optimizacion de Inputs: asegurar tamano minimo de toque (44px) recomendado por Apple y Google.
- Delivery:
  - Frontend: Actualizacion de `Sidebar.tsx` para ser condicional (oculto en `sm:` y visible en `lg:`). Nuevo componente `MobileNav` con icono de hamburguesa. Refactor de `DynamicTable.tsx` para soportar visualizacion tipo "lista" en pantallas pequenas. Ajuste de estilos globales en `App.css` para padding y margenes moviles.
- Nivel prioridad: Media-Baja — No bloquea la funcionalidad core del sistema y el frontend ya es ~40% responsivo. Sin embargo, es requisito para P14 (autorizacion por correo) cuya landing page se abre desde el celular. Se puede trabajar en paralelo sin bloquear otras tareas.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Header y Hamburger Menu: implementar boton de menu y logica de estado (abierto/cerrado) en el Header para moviles. (0.5 dias)
  - ST2: Sidebar Responsivo: usar clases de Tailwind para ocultar el Sidebar y mostrarlo como overlay en moviles. (0.5 dias)
  - ST3: Refactor de Tablas: modificar `DynamicTable.tsx` para ocultar columnas menos importantes en movil o usar stacking. (1.0 dia)
  - ST4: Adaptacion de Mosaicos: ajustar `Dashboard.tsx` para que pase de `grid-cols-4` a `grid-cols-1` o `grid-cols-2` en moviles. (0.5 dias)
  - ST5: Ajuste de Formularios: revisar que todos los formularios de creacion de viaje no tengan desbordamientos y los botones sean faciles de presionar. (0.5 dias)
  - ST6: Visor de Comprobantes: optimizar el Swiper y el FilePreviewer para que el PDF ocupe el 100% del ancho del dispositivo. (0.5 dias)
  - ST7: Optimizacion de Layout Global: ajustar paddings de la clase principal en `Layout.tsx` para ganar espacio en pantallas pequenas. (0.5 dias)
  - ST8: QA en Dispositivos Reales: pruebas en iOS y Android (o simuladores de Chrome) para corregir comportamientos extranos de Safari/Chrome movil. (0.5 dias)
  - Total: 4.5 dias
- Que dependencias tiene esta tarea:
  - Framework CSS (Tailwind): ya integrado.
  - Libreria de Componentes (Flowbite): util para el componente de Drawer/Navbar movil.
- De que otras tareas es dependencia esta:
  - P14 (Autorizacion por correo): el landing page de aprobacion DEBE ser 100% responsivo ya que se abrira desde el celular del jefe.
- Criterios de aceptacion:
  - Legibilidad de Datos: en las tablas, si no caben todas las columnas, se debe mostrar un scroll horizontal claro o los datos mas importantes (Estatus, Monto).
  - Funcionalidad Tactil: todos los botones y selectores responden correctamente al toque (sin "double tap" accidental).
  - Cero Desbordamiento: no debe existir scroll horizontal en el cuerpo principal de la pagina (`body`), solo en elementos especificos si es necesario.

---

## Punto 5 - Ajustar politicas de reembolso

- Necesidades/Retos tecnicos:
  - Hay un rol en particular (ver P1) que puede crear y aprobar un reembolso con condiciones.
  - Reglas de politica de reembolso:
    - Rol de la persona que viajo.
    - Monto maximo/minimo por tipo de gasto.
    - Tiempo maximo/minimo desde el evento (deadline de comprobacion, ver P16).
    - Validado contra factura (CFDI vigente, ver P9).
    - Validacion con insumo pre-definido (catalogo de gastos permitidos).
  - Cuando una condicion falla, se manda un mensaje al tramitador para que revise el detalle. Se puede definir un rol que haga override a alguna regla.
  - Las reglas deben ser configurables sin redeployar (via BD o archivo de configuracion).
  - Ver con Ditta si hay mas reglas que definir.
- Delivery:
  - Backend: `PolicyEngine` que evalua un conjunto de reglas configurables contra cada voucher/reembolso. Tabla `reimbursement_policies` con reglas parametrizables. Endpoint para que el admin CRUD las politicas.
  - Frontend: Vista de configuracion de politicas. Alertas visibles cuando un voucher viola alguna politica.
- Nivel prioridad: Alta — Requisito de negocio directo de Ditta: las politicas de reembolso determinan si un gasto es valido o no antes de la exportacion contable. Sin este motor de reglas, el proceso de comprobacion carece de validacion automatizada y depende 100% de revision manual humana.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Disenar esquema de reglas: tabla `reimbursement_policies` con `id`, `name`, `rule_type` (AMOUNT_LIMIT, TIME_LIMIT, ROLE_CHECK, INVOICE_REQUIRED, CATEGORY_MATCH), `params` (JSONB con montos, tiempos, roles), `is_active`, `override_role_id`. (1.0 dia)
  - ST2: Crear `PolicyEngineService` con metodo `evaluate(voucherId, userId): PolicyResult[]` que carga las reglas activas y las ejecuta contra los datos del voucher y el usuario. (1.5 dias)
  - ST3: Integrar con el flujo de comprobacion: al crear/editar un voucher, ejecutar el `PolicyEngine`. Si hay violaciones, notificar al tramitador (usando `NotificationsService`) y marcar el voucher con estado `POLICY_VIOLATION`. (1.0 dia)
  - ST4: Endpoints CRUD para administrar politicas. Vista frontend de configuracion. (1.0 dia)
  - ST5: Pruebas: voucher que excede monto maximo, voucher fuera de plazo, voucher sin factura valida, override de regla por rol autorizado. (0.5 dias)
  - Total: 5.0 dias
- Que dependencias tiene esta tarea:
  - P1 (Autorizacion configurable): las reglas de aprobacion dependen del sistema de permisos granulares.
  - P9 (Validacion CFDI): la regla de "validado contra factura" requiere que el CFDI haya sido validado.
  - P16 (Limite de tiempo): la regla de tiempo maximo se complementa con el sistema de deadlines.
- De que otras tareas es dependencia esta:
  - P7 (Multidestino): las politicas de monto dependen del numero total de dias del viaje, que se calcula sumando los dias de cada destino.
- Criterios de aceptacion:
  - Un reembolso que excede el monto maximo configurado genera una alerta al tramitador y queda en estado `POLICY_VIOLATION`.
  - Un rol con permiso de override puede aprobar un reembolso que violo una regla, y la razon queda registrada.
  - Las reglas se pueden activar/desactivar desde la UI sin redeployar.
  - El resultado de la evaluacion de politicas se persiste con detalle de cada regla evaluada.

---

## Punto 6 - Autorizacion de viaje previa puede ser diferente de la posterior. Tambien con nivel segun los gastos/destinos/monedas

- Necesidades/Retos tecnicos:
  - Actualmente el flujo de aprobacion en `src/requests/` trata la autorizacion como un paso unico. En la practica, la autorizacion previa al viaje (pre-aprobacion del presupuesto estimado) y la autorizacion posterior (aprobacion de la comprobacion real de gastos) pueden requerir diferentes niveles de aprobacion.
  - Niveles de autorizacion por monto: un viaje de $5,000 MXN lo aprueba un gerente, uno de $50,000 lo aprueba un director, uno de $200,000+ lo aprueba VP.
  - Niveles por destino: un viaje nacional lo aprueba el jefe directo, un viaje internacional requiere un nivel adicional.
  - Niveles por moneda: gastos en moneda extranjera pueden requerir aprobacion adicional por el riesgo cambiario.
  - Se necesita una tabla de matrices de autorizacion configurable que el admin pueda modificar.
- Delivery:
  - Backend: `AuthorizationMatrixService` que determina el flujo de aprobacion (quien, cuantos niveles, en que orden) basado en el monto, destino y moneda de la solicitud. Tabla `authorization_matrix` con reglas configurables.
  - Frontend: Vista de configuracion de la matriz de autorizacion. Visualizacion del flujo de aprobacion en la solicitud.
- Nivel prioridad: Alta — Requerimiento explicito del cliente: los viajes de alto monto requieren aprobacion de niveles superiores, y la autorizacion post-viaje (comprobacion real) puede diferir de la pre-viaje (estimado). Actualmente el flujo trata toda aprobacion como un paso unico, lo cual no refleja la operacion real de la empresa.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Disenar tabla `authorization_matrix` con `id`, `phase` (PRE_TRAVEL, POST_TRAVEL), `condition_type` (AMOUNT_RANGE, DESTINATION_TYPE, CURRENCY), `condition_params` (JSONB), `required_role_id`, `approval_order`. Migracion. (1.0 dia)
  - ST2: Crear `AuthorizationMatrixService` con metodo `getApprovalChain(request): ApprovalStep[]` que evalua las condiciones de la solicitud y devuelve la cadena de aprobadores requeridos. (1.0 dia)
  - ST3: Modificar `RequestsService` y el flujo de estados para soportar multiples niveles de aprobacion secuenciales (nivel 1 aprueba, pasa a nivel 2, etc.). (1.5 dias)
  - ST4: Separar flujo pre-viaje y post-viaje: la aprobacion previa usa el presupuesto estimado, la posterior usa los gastos reales comprobados. (1.0 dia)
  - ST5: Vista frontend de configuracion de la matriz. Visualizacion del progreso de aprobacion multi-nivel en la solicitud. (1.0 dia)
  - ST6: Pruebas: viaje barato aprobado en 1 nivel, viaje caro requiere 2 niveles, viaje internacional agrega nivel extra, fase post-viaje usa reglas diferentes. (0.5 dias)
  - Total: 6.0 dias
- Que dependencias tiene esta tarea:
  - P1 (Autorizacion configurable): el sistema de permisos granulares permite definir quien puede aprobar en cada nivel.
- De que otras tareas es dependencia esta:
  - P14 (Autorizacion por correo): el correo de autorizacion debe indicar en que nivel de aprobacion esta la solicitud.
  - P13 (Notificaciones): cada cambio de nivel genera una notificacion al siguiente aprobador.
- Criterios de aceptacion:
  - Un viaje de $5,000 MXN nacional se aprueba con un solo nivel (jefe directo).
  - Un viaje de $80,000 MXN internacional requiere 2 niveles (gerente + director) y el sistema lo enruta automaticamente.
  - La fase post-viaje puede tener reglas diferentes a la pre-viaje.
  - Las reglas de la matriz se pueden modificar desde la UI sin redeployar.

---

## Punto 7 - Anadir viaje multidestino

- Necesidades/Retos tecnicos:
  - Existe la capacidad tecnica de enviar un arreglo de destinos (la entidad `RequestsDestination` en `src/requests/entities/requests-destination.entity.ts` ya existe).
  - El reto: actualmente el sistema no valida la coherencia del viaje. Un usuario podria poner que el Destino 2 ocurre antes que el Destino 1, o que sale de la Ciudad A y llega a la Ciudad B, pero su siguiente destino no inicia en B.
  - Validacion Cronologica (FE/BE): implementar logica que asegure que `Fecha_Salida_Destino_N < Fecha_Llegada_Destino_N+1`.
  - Continuidad de Ruta: validar que el destino de llegada del tramo anterior sea el origen (implicito) del siguiente tramo.
  - Calculo Automatico de "Last Destination": en lugar de que el usuario lo marque manualmente, el sistema debe identificar el ultimo registro del array para marcarlo como el punto de retorno.
  - Impacto en Reservaciones: modificar el modulo de `Reservations` para que el Agente de Viajes visualice el itinerario completo como una cadena.
- Delivery:
  - Backend: `ValidationPipe` personalizado en `RequestsModule` para verificar la cronologia de los arreglos de destinos. Ajuste en `requests.service.ts` para calcular el `advance_money` total sugerido basado en la suma de dias de todos los destinos.
  - Frontend: Mejora en `TravelRequestForm.tsx` para bloquear fechas imposibles en el calendario (`minDate` basado en el destino anterior). Resumen dinamico del itinerario (ej: "Ruta: CDMX -> NY -> Madrid -> CDMX").
- Nivel prioridad: Media-Alta — La entidad `RequestsDestination` ya existe en la BD, pero no se valida la coherencia del viaje. Es prerrequisito para P5 (calculo de viaticos por dias totales), P8 (busqueda de vuelos por ruta), P16 (deadline desde ultimo destino) y P17 (multiples monedas). No es Alta porque el sistema ya funciona con destinos individuales.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Logica de Validacion Cronologica: crear un helper que recorra el array de destinos y dispare un error si las fechas se traslapan o son regresivas. (0.5 dias)
  - ST2: Refactor de `RequestsService`: asegurar que al crear/editar, el `destination_order` se asigne automaticamente basado en la posicion del array. (0.5 dias)
  - ST3: UI: Calendarios Encadenados. En React, hacer que al seleccionar la fecha de salida del Destino 1, se actualice automaticamente el `minDate` del Destino 2. (1.0 dia)
  - ST4: Visualizacion de Itinerario: crear un componente de "Mapa de Ruta" que muestre la secuencia logica del viaje en la vista de detalles. (0.5 dias)
  - ST5: Gestion de "Return Trip": logica para asegurar que el sistema contemple el regreso al origen inicial (`id_origin_city`) tras el ultimo destino. (0.5 dias)
  - ST6: Pruebas: viaje con 3 destinos en orden cronologico correcto, intento de fechas invertidas (error), edicion de viaje existente con reordenamiento, calculo correcto de `stay_days` total. (0.5 dias)
  - Total: 3.5 dias
- Que dependencias tiene esta tarea:
  - Modulo de Destinos (`src/destinations/`): la tabla de ciudades debe estar poblada y validada.
  - Libreria de Manejo de Fechas (dayjs / date-fns): integracion solida en el Frontend para calculos de `minDate` y `maxDate`.
  - Esquema de BD (`RequestsDestination` entity): debe permitir actualizaciones en cascada.
- De que otras tareas es dependencia esta:
  - P5 (Politicas de reembolso): las reglas de montos maximos (viaticos) dependen del numero total de dias del viaje.
  - P8 (Integracion agencias): no se pueden buscar vuelos en APIs externas si el sistema no entrega una secuencia logica de ciudades.
  - P17 (Tipos de cambio): en un viaje multidestino, el usuario puede pasar por paises con diferentes monedas.
  - P16 (Limites de tiempo): el contador para bloquear al usuario se activa a partir de la fecha de llegada del ultimo destino.
- Criterios de aceptacion:
  - Validacion de Cronologia: el formulario arroja error si la `fecha_llegada` del Destino 2 es anterior a la `fecha_salida` del Destino 1.
  - Orden Automatico: el campo `destination_order` se asigna por el sistema segun la posicion en el formulario.
  - Cierre de Ruta: el sistema marca automaticamente el ultimo elemento del arreglo como `is_last_destination: true`.
  - Calculo de Estancia: el total de `stay_days` de toda la solicitud es la suma exacta de los dias de cada parada, y se actualiza dinamicamente en la UI.
  - Persistencia en Edicion: al editar un viaje multidestino existente, el sistema permite reordenar las paradas y re-valida la cronologia antes de guardar.

---

## Punto 8 - Investigar si se puede integracion con servicios de agencias de viaje en linea

- Necesidades/Retos tecnicos:
  - Acceso a Inventario Global (GDS): para que Monarca reserve automaticamente, necesita conectarse a un Sistema de Distribucion Global o a un agregador de APIs (OTAs). Los principales candidatos son Amadeus, Sabre o Expedia Partner Solutions (EPS).
  - Gestion de Credenciales y Costos: estas APIs no son gratuitas. Requieren modelo "Pay-per-use" o acuerdos comerciales. El reto es determinar si la empresa posee las licencias necesarias o si usara version SandBox.
  - Mapeo de Datos Complejos: el JSON que devuelve una aerolinea/hotel es masivo. Se requiere un transformador de datos (Adapter Pattern) que convierta esa respuesta al esquema de `Reservation` de Monarca.
  - Seguridad y PCI-DSS: si se pretende realizar el pago desde Monarca, se debe cumplir con normativas bancarias. Recomendacion: solo consulta y confirmacion, no transacciones financieras directas en esta etapa.
- Resultado de la investigacion (opciones tecnicas):
  - **Amadeus for Developers**: vuelos, hoteles y autos. Excelente documentacion para NestJS/Node.js. Capa gratuita de prueba. Dificultad: Media.
  - **Expedia Partner Solutions**: hoteles. Inventario mas grande de hospedaje. Dificultad: Alta.
  - **Skyscanner API**: comparacion de precios. Ideal para fase de "Pre-Aprobacion" con costos de mercado. Dificultad: Baja.
  - **Booking API**: hoteles. Robusto, pero terminos de uso estrictos para sistemas internos. Dificultad: Media.
- Delivery:
  - Backend: `OtaIntegrationModule` con servicios especializados por proveedor (ej. `AmadeusService`). Webhooks para recibir notificaciones de cambios de estado (retrasos/cancelaciones). Cache Layer con Redis para no consultar la API cada vez que el usuario refresca la pagina.
  - Frontend: Buscador integrado en "Crear Solicitud" para buscar vuelos reales. Auto-complete de Reservas: al ingresar un ID de reserva OTA, Monarca trae automaticamente fechas, hotel y costos.
- Nivel prioridad: Media — Es una mejora de eficiencia para el Agente de Viajes, no un requisito funcional critico. El sistema ya permite ingresar reservaciones manualmente. Depende de APIs externas con costos y licenciamiento pendiente. No bloquea ninguna otra tarea.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Configuracion de API keys: registro en portales de desarrolladores (Amadeus/Skyscanner) y configuracion de variables de entorno. (0.5 dias)
  - ST2: Desarrollo de clientes HTTP: crear clientes Axios dentro de NestJS con manejo de reintentos (retry logic) y timeouts. (1.0 dia)
  - ST3: Mapeo de entidades: crear interfaces TypeScript que reflejen los modelos de las OTAs y funciones de conversion a nuestro modelo `Reservation`. (1.0 dia)
  - ST4: Implementacion de buscador: crear componentes de busqueda con autocompletado de ciudades y fechas usando los datos de la API. (1.0 dia)
  - ST5: Sincronizacion de reservas: funcion de "Importar por ID" donde el usuario pega un codigo de confirmacion y el sistema llena los campos automaticamente. (0.5 dias)
  - ST6: Manejo de errores externos: logica para cuando la API externa esta caida o el token ha expirado. (0.5 dias)
  - ST7: Documentacion de costos: reporte final sobre el costo por consulta para la toma de decisiones de la directiva. (0.5 dias)
  - ST8: Pruebas con mocks de API: uso de Nock o Jest para simular respuestas de la API sin gastar creditos reales. (0.5 dias)
  - Total: 5.5 dias
- Que dependencias tiene esta tarea:
  - P3 (Esquema contable): no podemos traer datos externos si no sabemos en que campos contables guardarlos.
  - Modulo de Destinos (`src/destinations/`): las ciudades de la API externa deben coincidir o mapearse con nuestra tabla `destinations`.
- De que otras tareas es dependencia esta:
  - Es una mejora de eficiencia para el Agente de Viajes. No bloquea otras tareas.
- Criterios de aceptacion:
  - Precision de Datos: la informacion traida de la API (vuelo, hora, costo) es identica a la que el proveedor muestra en su sitio oficial.
  - Seguridad de API Keys: ninguna credencial esta expuesta en el codigo del Frontend; todo pasa por el proxy del Backend.
  - Resiliencia: si la integracion falla, el sistema permite siempre el ingreso manual como metodo de respaldo (fallback).

---

## Punto 9 - Validacion de CFDI, usando API del SAT

- Necesidades/Retos tecnicos:
  - El SAT ofrece un servicio web (SOAP) para consultar el estado de un CFDI dado su UUID, RFC emisor, RFC receptor y total. Los estados posibles son: `Vigente`, `Cancelado`, `No Encontrado`.
  - El servicio del SAT es conocido por ser intermitente y lento (puede tardar 5-15 segundos). La validacion debe ejecutarse de forma asincrona para no bloquear al usuario.
  - Se necesita un cliente (`SatValidationClient`) que arme la peticion SOAP con los datos del CFDI (obtenidos en P10), la envie al SAT, y mapee la respuesta a un estado estandarizado.
  - Si el SAT no responde, la validacion debe quedar en estado `FAILED` con el error y ser reintentable. No debe impedir que el usuario siga usando el voucher (el estatus de validacion es informativo).
  - La respuesta del SAT incluye: `Estado` (Vigente/Cancelado), `EsCancelable` (Cancelable/No Cancelable), `EstatusCancelacion`.
  - Se debe implementar retry con backoff exponencial y circuit breaker para manejar la intermitencia del SAT.
- Delivery:
  - Backend: `SatValidationService` que recibe los datos del CFDI, consulta al SAT, y devuelve el estado. Integracion con el flujo de upload de vouchers para que al subir un XML que pasa el parseo (P10), automaticamente se dispare la validacion SAT. Tabla `cfdi_validations` para persistir cada resultado de validacion (auditoria inmutable).
  - Frontend: Indicador visual del estado de validacion SAT en la vista de vouchers (Vigente/Cancelado/Pendiente/Error).
- Nivel prioridad: Alta — Requisito legal y fiscal: en Mexico, un gasto comprobado con una factura cancelada ante el SAT no es deducible. Validar el estatus del CFDI es obligatorio para que la exportacion contable (P2) tenga integridad fiscal. Tambien alimenta las politicas de reembolso (P5) con la regla "factura vigente".
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Crear `SatValidationService` con metodo `validate(uuid, rfcEmisor, rfcReceptor, total): Promise<SatValidationResult>`. Implementar la llamada SOAP al endpoint del SAT con el cuerpo correcto. Mapear la respuesta a un DTO limpio `{ estado, esCancelable, estatusCancelacion }`. (1.5 dias)
  - ST2: Implementar retry con backoff (3 intentos, 2s-4s-8s) y timeout configurable (default 15s). Si el SAT no responde, marcar como `PENDING_RETRY`. (0.5 dias)
  - ST3: Crear entidad `CfdiValidation` con: `id UUID`, `voucher_id UUID FK`, `cfdi_uuid`, `rfc_emisor`, `rfc_receptor`, `total`, `sat_status`, `validated_at`, `validated_by`. La tabla es append-only (auditoria inmutable). Crear endpoint `GET /vouchers/:id/validations` para consultar historial. (1.0 dia)
  - ST4: Integrar con el flujo de upload: cuando `CfdiParserService` (P10) extrae datos exitosamente, se dispara automaticamente la validacion SAT de forma asincrona. (0.5 dias)
  - ST5: Pruebas con mocks: SAT responde `Vigente`, `Cancelado`, `No Encontrado`, timeout (queda reintentable). Vista frontend con indicador de estado. (1.0 dia)
  - Total: 4.5 dias
- Que dependencias tiene esta tarea:
  - P10 (Extraccion XML): los datos del CFDI (UUID, RFCs, total) vienen del parser de XML.
- De que otras tareas es dependencia esta:
  - P5 (Politicas de reembolso): la regla de "validado contra factura" requiere saber si el CFDI esta vigente.
  - P2 (Integracion contable): el JSON de exportacion puede incluir el estado de validacion SAT.
- Criterios de aceptacion:
  - Un CFDI vigente produce resultado `{ estado: 'VIGENTE' }` registrado en la tabla de validaciones.
  - Un CFDI cancelado produce `{ estado: 'CANCELADO' }` y el voucher muestra advertencia visible.
  - Si el SAT no responde en 15 segundos, la validacion queda como `PENDING_RETRY` y se reintenta automaticamente.
  - El flujo de creacion de voucher NO se bloquea esperando la respuesta del SAT.
  - El historial de validaciones es inmutable (solo se agregan registros nuevos).

---

## Punto 10 - Extraccion de los datos de la factura del XML para insertarlos en el registro de comprobacion

- Necesidades/Retos tecnicos:
  - Soporte de Versiones CFDI: el parser debe interpretar tanto CFDI 3.3 como 4.0, identificando correctamente los nodos de `Comprobante`, `Emisor` y `TimbreFiscalDigital`.
  - Manejo de Namespaces XML: los archivos del SAT usan multiples esquemas y namespaces (prefijos como `cfdi:`, `tfd:`, `xsi:`). Se requiere una libreria robusta como `fast-xml-parser` en NestJS para convertir el XML en un objeto JSON manejable.
  - Extraccion de Campos Criticos:
    - `UUID`: para asegurar que la factura sea unica en la BD.
    - `Monto Total e Impuestos`: desglosar IVA, Retenciones e IEPS si existen.
    - `Fecha de Emision`: para validar automaticamente la politica de tiempo (P5).
    - `RFC y Razon Social del Proveedor`: para categorizar automaticamente el gasto.
  - Mapeo de Conceptos: implementar logica para "adivinar" la categoria del gasto (ej. si el concepto dice "Hospedaje", marcar como clase HOTP - Hotel Pagado).
  - Carga asincrona en UI: al momento de que el usuario sube el archivo, el sistema debe disparar la extraccion y "auto-llenar" los campos en la tabla.
- Delivery:
  - Backend: `XmlParserService` (o `CfdiParserService`) especializado en lectura de buffers XML. Endpoint `POST /vouchers/extract-data` que recibe el archivo y devuelve un JSON con los campos extraidos para que el usuario los confirme antes de guardar.
  - Frontend: Auto-fill en `Vouchers.tsx` para que tras subir el archivo, los campos `amount`, `date` y `tax_type` se completen solos. Feedback visual resaltando los campos extraidos automaticamente.
- Nivel prioridad: Alta — Es el punto de entrada de datos fiscales al sistema. Sin la extraccion automatica del XML, todos los datos (UUID, montos, impuestos, RFC) se capturan manualmente, lo que genera errores humanos y duplica esfuerzo. Alimenta directamente a P9 (validacion SAT), P3 (campos contables) y P2 (exportacion Ditta).
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Instalar `fast-xml-parser`. Crear `CfdiParserService` con metodo `parse(xmlBuffer: Buffer): CfdiData`. Configurar para procesar archivos sin guardarlos fisicamente primero. Manejar namespaces correctamente. (1.0 dia)
  - ST2: Logica de extraccion de UUID: acceder al nodo `Complemento -> TimbreFiscalDigital` para obtener el folio fiscal unico. (0.5 dias)
  - ST3: Mapeo de impuestos y totales: logica para sumar traslados y restar retenciones para obtener el `net_amount` exacto. Alimentar los campos `base_amount` y `tax_amount` de P3. (0.5 dias)
  - ST4: Diccionario de categorias: crear un mapeo basado en palabras clave (ej: "Gas" -> Clase GAS, "Hospedaje" -> Clase HOTP) para pre-clasificar el gasto. (0.5 dias)
  - ST5: Endpoint de pre-procesamiento: crear controlador que permita al Frontend obtener los datos del XML antes de la confirmacion final. (0.5 dias)
  - ST6: Integracion auto-fill en Frontend: modificar `Vouchers.tsx` para inyectar los datos del API en el estado del formulario. (0.5 dias)
  - ST7: Manejo de errores de lectura: validar casos donde el XML esta corrupto o no es un formato CFDI valido. (0.5 dias)
  - Total: 4.0 dias
- Que dependencias tiene esta tarea:
  - P3 (Tablas contables): los datos extraidos (base_amount, tax_amount) necesitan las columnas contables.
  - P11 (Almacenamiento bucket): el parser debe leer el archivo desde el bucket o stream de subida.
  - Modulo de Vouchers (`src/vouchers/`): es donde ocurre la interaccion.
- De que otras tareas es dependencia esta:
  - P9 (Validacion SAT): necesita los campos extraidos (UUID, RFCs, total) para consultar al SAT.
  - P5 (Politicas): los datos extraidos (fecha/monto) se pasan al motor de politicas para validacion.
  - P2 (Integracion contable): los datos fiscales extraidos alimentan el JSON de exportacion.
- Criterios de aceptacion:
  - Cero Captura Manual: el usuario no debe escribir el monto ni la fecha si el XML es legible.
  - Validacion de UUID Duplicado: si el parser extrae un UUID que ya existe en la BD, arroja error "Esta factura ya ha sido utilizada en otro viaje".
  - Soporte Multi-moneda: extraer el atributo `Moneda` (MXN, USD) y alertar si hay discrepancia con la solicitud original.
  - Confirmacion del Usuario: los datos auto-llenados deben poder ser editados por el usuario en caso de que necesite ajustar la clasificacion del gasto.

---

## Punto 11 - Almacenamiento de las facturas (PDF y XML) en un bucket

- Necesidades/Retos tecnicos:
  - Seguridad de Acceso (Private Buckets): los comprobantes fiscales contienen informacion sensible. El bucket debe ser privado. Se deben implementar Signed URLs (URLs con tiempo de expiracion) para que solo los usuarios autorizados vean los archivos por tiempo limitado.
  - Cambio de Estrategia en Multer: actualmente el sistema escribe a disco local (`uploads/vouchers/`, `uploads/reservations/`). Se debe cambiar a `memoryStorage` para recibir el archivo en RAM y "streamearlo" inmediatamente al bucket, evitando dejar rastros en el servidor local.
  - Gestion de Metadatos y Prefijos: organizar los archivos mediante prefijos (carpetas virtuales): `empresa-02/solicitudes/{request_id}/vouchers/{uuid}.xml`.
  - Resiliencia y Reintentos: implementar logica de manejo de errores para casos donde la conexion con la nube falle, asegurando que la transaccion en la BD no se complete si el archivo no se subio exitosamente.
  - Costo y Retencion: definir politicas de ciclo de vida (LifeCycle Policies) para mover archivos viejos a almacenamiento mas barato (como AWS Glacier) despues de 5 anos (tiempo legal de retencion fiscal).
- Delivery:
  - Backend: `FilesModule` centralizado que encapsule el SDK del proveedor de nube (ej. AWS SDK). Refactor de `UploadPdfInterceptor` en `src/utils/interceptor.middleware.ts` para que ya no use `dest: uploadPath` y maneje el buffer hacia el bucket. Actualizacion de `VouchersService` para guardar la "Key" del objeto en lugar de una ruta local.
  - Infraestructura: configuracion de permisos IAM y creacion del bucket en AWS/GCP/Azure.
- Nivel prioridad: Media-Alta — Actualmente los archivos se guardan en disco local del servidor (`uploads/`), lo cual no es escalable ni seguro para produccion. Es prerrequisito para P10 (el parser lee del bucket/stream) y para P2 (los enlaces de auditoria del JSON de exportacion). No es Alta porque el almacenamiento local sigue funcionando temporalmente.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Configuracion de cloud: crear el bucket, definir CORS y crear llaves de acceso (Access Key/Secret Key) con permisos minimos. (0.5 dias)
  - ST2: Implementacion de `FilesService`: crear el servicio en NestJS usando el SDK del proveedor para subir, descargar y borrar objetos. (1.0 dia)
  - ST3: Logica de Signed URLs: implementar metodo en el BE para generar links temporales (ej: que duren 15 min) al consultar un voucher. (0.5 dias)
  - ST4: Migracion de datos existentes: script para mover los archivos de la carpeta `uploads/` actual hacia el nuevo bucket y actualizar los links en la BD. (1.0 dia)
  - ST5: Manejo de excepciones cloud: implementar errores personalizados para casos de "Bucket no disponible" o "Limite de cuota excedido". (0.5 dias)
  - ST6: Optimizacion de visualizacion: asegurar que el Frontend pueda renderizar PDFs directamente desde la URL firmada. (0.5 dias)
  - ST7: Pruebas de carga y seguridad: validar que el bucket es inaccesible sin el token y que soporta subidas de archivos de 5MB+ simultaneas. (0.5 dias)
  - Total: 4.5 dias
- Que dependencias tiene esta tarea:
  - Modulo de Vouchers (`src/vouchers/`): es el principal consumidor de este servicio.
  - Variables de Entorno (`.env`): se deben agregar `AWS_S3_BUCKET_NAME`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
- De que otras tareas es dependencia esta:
  - P10 (Extraccion XML): el parser debe leer el archivo desde el bucket o el stream de subida.
  - P2 (Integracion contable): el JSON de salida debe llevar los enlaces permanentes o de auditoria generados por el bucket.
- Criterios de aceptacion:
  - Persistencia Externa: los archivos PDF y XML ya no se guardan en el servidor local.
  - Seguridad: al intentar acceder a la URL del archivo sin una firma valida, el navegador recibe "Access Denied".
  - Consistencia de Nombres: los nombres de los archivos en el bucket son UUIDs para evitar que dos usuarios suban un archivo con el mismo nombre y se sobrescriban.
  - Rendimiento: la generacion de la Signed URL es instantanea y no anade latencia perceptible al usuario.

---

## Punto 12 - Desarrollar sistema para consultar datos de empleados desde un ERP

- Necesidades/Retos tecnicos:
  - Investigar si es posible conectar Monarca con un ERP existente (Odoo, SAP u otro) para consultar datos de empleados: nombre, departamento, centro de costo, jerarquia de aprobadores, puesto.
  - Actualmente los usuarios se crean manualmente en Monarca (`src/users/`) y los datos se mantienen aislados del ERP de la empresa. Si un empleado cambia de departamento en el ERP, no se refleja automaticamente en Monarca.
  - Evaluar opciones: API REST de Odoo, SAP RFC/BAPI, o un servicio intermedio (middleware ESB).
  - Determinar si la integracion seria en tiempo real (consulta al ERP cada vez que se necesita) o por sincronizacion periodica (batch cada N horas).
  - Considerar el tema de la jerarquia: el ERP sabe quien es el jefe de quien, dato crucial para el flujo de aprobaciones (P1, P6).
  - **Nota**: este punto es mas de investigacion/POC que de implementacion completa. La decision final depende de que ERP use Ditta.
- Delivery:
  - Documento de investigacion con: ERPs evaluados, viabilidad tecnica de cada uno, recomendacion, y un prototipo (POC) si es viable.
  - Backend (si se decide implementar): `ErpSyncModule` con servicio que consulte o sincronice datos de empleados desde el ERP elegido.
- Nivel prioridad: Baja — Es un punto de investigacion/POC, no de implementacion inmediata. La decision depende de que ERP utiliza Ditta (informacion aun no proporcionada). No bloquea ninguna tarea critica; los datos de empleados se pueden seguir gestionando manualmente en Monarca mientras se investiga.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Investigar las APIs disponibles de Odoo (REST/JSON-RPC) y SAP (OData/RFC). Documentar endpoints relevantes para datos de empleados y jerarquia. (1.0 dia)
  - ST2: Crear POC con Odoo (tiene API abierta y version gratuita): conectar desde NestJS, consultar lista de empleados, mapear a la entidad `User` de Monarca. (1.5 dias)
  - ST3: Evaluar sincronizacion: disenar un job periodico (`@nestjs/schedule`) que compare empleados del ERP con los de Monarca y detecte altas/bajas/cambios. (0.5 dias)
  - ST4: Documentar recomendacion final con pros/contras de cada opcion y costos estimados. (0.5 dias)
  - Total: 3.5 dias
- Que dependencias tiene esta tarea:
  - Definicion de Ditta sobre que ERP utilizan actualmente.
  - Acceso a credenciales y ambiente de pruebas del ERP.
- De que otras tareas es dependencia esta:
  - P1 (Autorizacion): si la jerarquia viene del ERP, la cadena de aprobadores se autoconfigura.
  - P18 (Centro de costos): si el ERP es la fuente de verdad de centros de costo, la sincronizacion automatica mantiene Monarca actualizado.
- Criterios de aceptacion:
  - Existe un documento de investigacion con al menos 2 ERPs evaluados.
  - Si se desarrolla POC: se demuestra la consulta exitosa de al menos 1 empleado desde el ERP a Monarca.
  - La recomendacion incluye estimacion de costos (licencias, esfuerzo de implementacion).

---

## Punto 13 - Envio de correos / mensajes para notificar el progreso en el proceso

- Necesidades/Retos tecnicos:
  - Arquitectura Basada en Eventos (Event-Driven): actualmente en `src/notifications/`, el codigo llama al servicio de notificaciones de forma manual. El reto es implementar un Event Emitter (propio de NestJS) para que cada vez que un registro cambie de estado, se dispare un evento de notificacion sin bloquear la ejecucion principal.
  - Motor de Plantillas Dinamico: pasar de leer archivos HTML planos a usar un motor como Handlebars. Esto permite inyectar variables complejas (nombre del viajero, destino, monto del anticipo, comentarios del aprobador) de forma segura y profesional.
  - Procesamiento en Segundo Plano (Queue Management): el envio de correos puede ser lento o fallar. Implementar una cola de mensajes (usando Bull/Redis) para que las notificaciones se envien de fondo y no afecten la velocidad de respuesta.
  - Notificaciones Multi-canal (opcional futuro): preparar la interfaz para que hoy envie correos (SMTP) pero manana pueda conectar con WhatsApp o Slack (ver P15).
  - Tracking de Notificaciones: registrar en BD si un correo fue enviado exitosamente o fallo, para que el administrador pueda reintentar envios criticos.
- Eventos clave a notificar:
  - A un Solicitante: "Tu viaje ha sido pre-aprobado", "Se requieren cambios en tu comprobacion", "Tu reembolso ha sido depositado".
  - A un Aprobador: "Tienes 3 solicitudes pendientes de firma", "Recordatorio: Un viaje internacional expira pronto".
  - Al Agente de Viajes: "Solicitud lista para reservacion (Vuelo/Hotel)".
  - Al SOI: "Nuevo lote de gastos listo para registro contable".
- Delivery:
  - Backend: `NotificationsModule` refactorizado con soporte para Queue/Bull. Implementacion de `OnEvent` decorators para desacoplar el envio de la logica de negocio. Set completo de plantillas HTML responsivas. Entidad `user_notifications` para guardar historial.
  - Frontend: Seccion de "Ajustes de Notificacion" en el perfil de usuario (activar/desactivar alertas por correo). Componente de "campana de notificaciones" en el Header que muestre las ultimas 5 notificaciones.
- Nivel prioridad: Media-Alta — Es prerrequisito directo de P14 (autorizacion por correo) y P15 (WhatsApp/Telegram). Tambien lo necesitan P5 (notificar violaciones de politica) y P6 (notificar cambio de nivel de aprobacion). No es Alta porque el sistema ya tiene un modulo basico de notificaciones en `src/notifications/`, aunque necesita refactor significativo.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Configuracion de infraestructura: configurar Bull con Redis en `docker-compose.yaml` y el modulo de colas en NestJS. (0.5 dias)
  - ST2: Refactor de plantillas: migrar los archivos `.html` actuales a plantillas dinamicas con Handlebars que acepten objetos JSON. (1.0 dia)
  - ST3: Implementacion de eventos: sustituir llamadas directas en `RequestsStatusService` por `this.eventEmitter.emit('request.approved', data)`. Hacer lo mismo para vouchers y reservaciones. (1.0 dia)
  - ST4: Logica de reintentos: configurar la cola para que si un correo falla, se reintente 3 veces antes de marcarlo como "error". (0.5 dias)
  - ST5: Entidad de notificaciones: crear tabla `user_notifications` para guardar historial de mensajes enviados a cada usuario con estado (sent/failed/read). (0.5 dias)
  - ST6: Centro de notificaciones frontend: crear el componente de "campana" en el Header que muestre las ultimas notificaciones. (0.5 dias)
  - ST7: Preferencias de usuario: formulario para que el usuario decida que eventos le notifican (ej. solo rechazos). (0.5 dias)
  - ST8: Pruebas de integracion: validar envio masivo y visualizacion correcta en diferentes clientes de correo (Outlook, Gmail). (0.5 dias)
  - Total: 5.0 dias
- Que dependencias tiene esta tarea:
  - Modulo de Auth (`src/auth/`): se necesita el email del usuario para saber a donde enviar.
  - Variables de Entorno: credenciales del servidor SMTP (o servicio como SendGrid/AWS SES).
- De que otras tareas es dependencia esta:
  - P14 (Autorizacion por correo): el correo es el canal principal para la aprobacion simplificada.
  - P15 (WhatsApp/Telegram): comparte la interfaz de notificaciones multi-canal.
  - P5 (Politicas de reembolso): las violaciones de politica se notifican al tramitador.
  - P6 (Autorizacion multi-nivel): cada cambio de nivel genera notificacion al siguiente aprobador.
- Criterios de aceptacion:
  - No Bloqueo: el sistema permite aprobar un viaje aunque el servidor de correos este caido (el correo se queda en cola).
  - Personalizacion: los correos incluyen el nombre del usuario y el ID del viaje en el asunto.
  - Visualizacion: el historial de notificaciones en el Frontend se marca como "leido" cuando el usuario hace clic.
  - Consistencia: el estado que indica el correo coincide exactamente con el estado actual en la BD.

---

## Punto 14 - Autorizacion simplemente con responder un correo

- Necesidades/Retos tecnicos:
  - Los aprobadores (Directores, Gerentes) suelen estar en movimiento y no siempre pueden entrar a la aplicacion web. Se necesita que puedan aprobar o rechazar una solicitud directamente desde el correo de notificacion (P13).
  - Opcion A (botones con link): incluir en el correo botones "Aprobar" y "Rechazar" que apunten a un endpoint del backend con un token unico de un solo uso. El token codifica: `requestId`, `userId`, `action`, `expiresAt`. Al hacer clic, el backend procesa la accion sin necesidad de login.
  - Opcion B (respuesta por texto): parsear la respuesta del correo (configurar Inbound Email con SendGrid/Mailgun). Si el aprobador responde "APROBADO", se ejecuta la accion. Mas complejo y menos seguro.
  - Recomendacion: Opcion A (botones con link) por su simplicidad, seguridad y compatibilidad con clientes de correo. La landing page de aprobacion debe ser responsiva (P4) ya que se abrira desde el celular.
  - Seguridad: el token debe ser JWT firmado, de un solo uso (se invalida despues de la primera accion), con expiracion configurable (ej. 72 horas), y vinculado a una solicitud y usuario especificos.
- Delivery:
  - Backend: `EmailApprovalService` que genera tokens seguros y los incluye en las plantillas de correo de P13. Endpoint `GET /approvals/email/:token` que valida el token, ejecuta la accion y muestra una pagina de confirmacion. Tabla `email_approval_tokens` para tracking y prevencion de reuso.
  - Frontend: Landing page minima y responsiva que muestre el resumen de la solicitud y confirme que la accion se ejecuto.
- Nivel prioridad: Media-Alta — Mejora critica de usabilidad para aprobadores (Directores/Gerentes) que no pueden entrar a la app web frecuentemente. Reduce el tiempo de aprobacion de dias a segundos. Depende de P13 (notificaciones) y P4 (responsivo). No es Alta porque la aprobacion via la app web sigue siendo funcional como alternativa.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Disenar tabla `email_approval_tokens` con `id`, `token_hash`, `request_id`, `user_id`, `action` (APPROVE/REJECT), `expires_at`, `used_at`, `created_at`. Crear servicio de generacion de tokens JWT firmados con payload encriptado. (1.0 dia)
  - ST2: Crear endpoint `GET /approvals/email/:token` que: (a) valida el token (firma, expiracion, no usado), (b) ejecuta la accion de aprobacion/rechazo via `RequestsService`, (c) marca el token como usado, (d) retorna HTML de confirmacion. (1.0 dia)
  - ST3: Modificar las plantillas de correo de P13 para incluir botones "Aprobar" y "Rechazar" con los links tokenizados. (0.5 dias)
  - ST4: Crear landing page responsiva de confirmacion (con summary de la solicitud aprobada/rechazada). (0.5 dias)
  - ST5: Pruebas: token valido ejecuta accion correctamente, token expirado es rechazado, token ya usado es rechazado, token con firma invalida es rechazado. (0.5 dias)
  - Total: 3.5 dias
- Que dependencias tiene esta tarea:
  - P13 (Notificaciones): el correo con los botones de aprobacion se envia a traves del sistema de notificaciones.
  - P4 (Responsivo): la landing page debe ser 100% responsiva para uso movil.
  - P1 (Autorizacion): debe respetar los permisos del usuario que recibe el token.
  - P6 (Multi-nivel): el correo debe indicar en que nivel de aprobacion esta.
- De que otras tareas es dependencia esta:
  - Agiliza significativamente el proceso de aprobacion. No bloquea otras tareas.
- Criterios de aceptacion:
  - Un aprobador puede aprobar un viaje haciendo clic en el boton "Aprobar" del correo sin tener que iniciar sesion en la app.
  - El token es de un solo uso: si el aprobador hace clic dos veces, la segunda vez ve un mensaje "Esta solicitud ya fue procesada".
  - Un token expirado (despues de 72 horas) muestra mensaje "El enlace ha expirado. Por favor ingrese a la aplicacion".
  - La solicitud cambia de estado correctamente en la BD y se dispara la notificacion correspondiente.

---

## Punto 15 - Integrar con WhatsApp / Telegram

- Necesidades/Retos tecnicos:
  - WhatsApp Business API: requiere cuenta verificada, proveedor de mensajeria (Twilio, Meta Cloud API), y aprobacion de plantillas de mensaje por parte de Meta. Los mensajes proactivos (notificaciones) requieren plantillas pre-aprobadas. Tiene costo por mensaje.
  - Telegram Bot API: gratuita, sin aprobacion de plantillas, facil de implementar. Menos utilizada en ambientes corporativos en Mexico.
  - El sistema debe reutilizar la interfaz multi-canal de P13: el `NotificationsService` ya tiene la logica de negocio, solo se agrega un nuevo "provider" de mensajeria.
  - El usuario debe poder elegir su canal preferido (correo, WhatsApp, Telegram, o todos) desde su perfil.
  - Para WhatsApp se necesita que el usuario registre y verifique su numero de telefono en su perfil de Monarca.
  - Considerar rate limits y costos: WhatsApp cobra por conversacion, no por mensaje. Optimizar para enviar lo minimo necesario.
- Delivery:
  - Backend: `WhatsAppProvider` y `TelegramProvider` que implementen la interfaz de `NotificationProvider`. Endpoint para registrar numero de WhatsApp o chat ID de Telegram en el perfil del usuario. Webhooks para recibir respuestas (opcional: el usuario responde "SI" en WhatsApp para aprobar).
  - Frontend: Selector de canal de notificacion en perfil de usuario. Input para numero de WhatsApp/Telegram.
- Nivel prioridad: Baja — Es una mejora opcional de experiencia de usuario. El correo electronico ya cubre la necesidad de notificacion. WhatsApp tiene costos por mensaje y requiere aprobacion de plantillas por Meta (proceso lento). Telegram es poco usado en ambientes corporativos en Mexico. Ninguna otra tarea depende de esta.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Crear cuenta de WhatsApp Business API (o Twilio WhatsApp Sandbox para desarrollo). Registrar bot de Telegram con BotFather. Configurar credenciales en variables de entorno. (0.5 dias)
  - ST2: Implementar `WhatsAppProvider` que use la API de Twilio/Meta para enviar mensajes con plantillas pre-aprobadas. (1.0 dia)
  - ST3: Implementar `TelegramProvider` que use la Bot API para enviar mensajes formateados. (0.5 dias)
  - ST4: Agregar columnas `whatsapp_number` y `telegram_chat_id` a la tabla `users`. Crear endpoint para que el usuario registre su numero/chatID. (0.5 dias)
  - ST5: Integrar con `NotificationsService` para que envie por el canal preferido del usuario. (0.5 dias)
  - ST6: Pruebas: enviar notificacion de aprobacion via WhatsApp, via Telegram, canal no configurado hace fallback a email. (0.5 dias)
  - Total: 3.5 dias
- Que dependencias tiene esta tarea:
  - P13 (Notificaciones): la infraestructura de notificaciones multi-canal debe existir.
  - Credenciales de WhatsApp Business API (requiere aprobacion de Meta).
- De que otras tareas es dependencia esta:
  - Es mejora de experiencia de usuario. No bloquea otras tareas.
- Criterios de aceptacion:
  - Un usuario con WhatsApp configurado recibe la notificacion de aprobacion de viaje por WhatsApp.
  - Un usuario con solo Telegram configurado recibe las notificaciones por Telegram.
  - Si el canal de mensajeria falla, el sistema hace fallback a correo electronico.
  - Los mensajes de WhatsApp usan plantillas pre-aprobadas por Meta.

---

## Punto 16 - Limite de tiempo para comprobar gastos de viaje. Configurable

- Necesidades/Retos tecnicos:
  - Despues de que un empleado regresa de un viaje, tiene un plazo limite para subir sus comprobantes (facturas, vouchers). Si no lo hace a tiempo, el sistema debe bloquear o escalar.
  - El plazo debe ser configurable: ej. 5 dias habiles, 10 dias naturales, etc. Puede variar segun el tipo de viaje (nacional vs internacional) o la politica de la empresa.
  - El sistema debe calcular el deadline a partir de la fecha de llegada del ultimo destino (P7: multidestino).
  - Se necesitan recordatorios automaticos: al 50% del plazo ("Te quedan 5 dias"), al 80% ("Te quedan 2 dias"), y al vencimiento ("Tu plazo ha expirado, contacta a tu supervisor").
  - Consecuencias del vencimiento: bloquear la creacion de nuevas solicitudes de viaje hasta que se compruebe, o escalar a un supervisor para decision manual.
  - La logica de plazos debe ejecutarse periodicamente (cron job diario que revise solicitudes pendientes de comprobacion).
- Delivery:
  - Backend: `DeadlineService` que calcula y gestiona los plazos de comprobacion. Tabla `comprobation_deadlines` o columna `comprobation_deadline_at` en `requests`. Scheduler que revise diariamente y envie recordatorios/bloqueos. Configuracion de plazos en tabla `system_config` o variables de entorno.
  - Frontend: Indicador visual del tiempo restante en la vista de la solicitud (barra de progreso o countdown). Alerta prominente cuando quedan pocos dias.
- Nivel prioridad: Media — Es importante para el cumplimiento operativo (asegurar que los empleados comprueben a tiempo), pero no bloquea la operacion diaria del sistema. Complementa a P5 (la regla de "tiempo maximo") y necesita a P7 (fecha del ultimo destino) y P13 (envio de recordatorios). Se puede implementar despues del core fiscal/contable.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Disenar configuracion de plazos: tabla `deadline_policies` con `id`, `trip_type` (NATIONAL, INTERNATIONAL), `deadline_days`, `deadline_type` (BUSINESS_DAYS, CALENDAR_DAYS), `is_active`. Agregar columna `comprobation_deadline_at TIMESTAMPTZ` a la tabla `requests`. (0.5 dias)
  - ST2: Crear `DeadlineService` con metodo `calculateDeadline(request): Date` que tome la fecha de llegada del ultimo destino y aplique la politica correspondiente. Disparar el calculo automaticamente cuando una solicitud pasa a estado "viaje completado". (1.0 dia)
  - ST3: Implementar scheduler (`@nestjs/schedule`, cron diario) que: (a) busque solicitudes con deadline proximo, (b) envie recordatorios via `NotificationsService` (P13), (c) marque como `OVERDUE` las que hayan vencido. (1.0 dia)
  - ST4: Implementar consecuencia de vencimiento: al intentar crear una nueva solicitud, verificar si el usuario tiene alguna comprobacion vencida. Si la tiene, bloquear con mensaje descriptivo. (0.5 dias)
  - ST5: Vista frontend: indicador visual de deadline en la solicitud. Alerta de bloqueo cuando aplique. (0.5 dias)
  - ST6: Pruebas: solicitud con 10 dias de plazo, recordatorio al dia 5, bloqueo al dia 11. Cambio de politica en BD se refleja en nuevas solicitudes. (0.5 dias)
  - Total: 4.0 dias
- Que dependencias tiene esta tarea:
  - P7 (Multidestino): el deadline se calcula a partir de la fecha de llegada del ultimo destino.
  - P13 (Notificaciones): los recordatorios se envian por el sistema de notificaciones.
- De que otras tareas es dependencia esta:
  - P5 (Politicas de reembolso): la regla de "tiempo maximo desde el evento" se complementa con este sistema de deadlines.
- Criterios de aceptacion:
  - Al completarse un viaje, se calcula automaticamente el deadline de comprobacion basado en la politica vigente.
  - El usuario recibe recordatorios automaticos al 50% y 80% del plazo.
  - Un usuario con comprobacion vencida no puede crear nuevas solicitudes de viaje (recibe error descriptivo).
  - Los plazos son configurables por tipo de viaje sin necesidad de redeployar.

---

## Punto 17 - Integrar sistema de Banco de Mexico para consultar tipos de cambio internacionales (Diario Oficial de la Federacion)

- Necesidades/Retos tecnicos:
  - El API del SIE de Banxico (Sistema de Informacion Economica) permite consultar series de datos como el tipo de cambio FIX (peso/dolar). Requiere autenticacion por token (`Bmx-Token` en header). La serie del tipo de cambio FIX es la `SF43718`.
  - La respuesta del API viene en formato JSON propio de Banxico con nodos anidados (`bmx.series[0].datos[0].dato`). Se necesita un mapper que normalice esto a un DTO interno limpio.
  - El API tiene limites de uso y puede estar intermitente. Si no hay dato para un dia especifico (fin de semana, dia festivo), Banxico no devuelve registro para esa fecha.
  - Se necesita una tabla `exchange_rates` como cache persistente para no consultar Banxico cada vez que se necesita el tipo de cambio del mismo dia.
  - Para dias no habiles, la politica de fallback debe ser: usar el ultimo dato habil disponible y marcarlo con un flag `is_fallback: true`.
  - Las credenciales del token deben manejarse via variable de entorno (`BANXICO_TOKEN`).
  - La tabla debe soportar multiples pares de monedas a futuro (USD/MXN, EUR/MXN, etc.) aunque el MVP sea solo USD/MXN.
- Delivery:
  - Backend: `BanxicoClient` que consulta la serie de tipo de cambio por rango de fechas y mapea la respuesta a `ExchangeRateDto`. Entidad TypeORM `ExchangeRate` como cache persistente con fallback para dias no habiles. `ExchangeRateService` con metodo `getRate(date, sourceCurrency, targetCurrency)`.
- Nivel prioridad: Alta — Es requisito contable y legal: los gastos en moneda extranjera deben registrarse con el tipo de cambio oficial publicado por Banxico en el DOF. P2 (exportacion Ditta) lo necesita para convertir gastos USD a MXN. P7 (multidestino) y P5 (politicas de monto) tambien dependen de la conversion cambiaria para su calculo correcto.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Crear `BanxicoClient` que implementa la llamada HTTP al endpoint `https://www.banxico.org.mx/SieAPIRest/service/v1/series/{serie}/datos/{fechaInicio}/{fechaFin}` con el header `Bmx-Token`. Mapear la respuesta anidada a DTO plano `{ fecha, valor, serie, fuente }`. Manejo de errores: token invalido (401), rate limit (429), servicio no disponible (503). (1.0 dia)
  - ST2: Crear entidad `ExchangeRate` con columnas: `id UUID`, `date DATE`, `source_currency VARCHAR(3)`, `target_currency VARCHAR(3)`, `rate DECIMAL(12,6)`, `source VARCHAR(50)`, `is_fallback BOOLEAN`, `fetched_at TIMESTAMPTZ`. Indice unico compuesto en `(date, source_currency, target_currency)`. Migracion. (1.0 dia)
  - ST3: Crear `ExchangeRateService` con metodo `getRate(date, sourceCurrency, targetCurrency)` que: (a) busca en BD, (b) si no existe, busca el ultimo registro antes de esa fecha con `is_fallback: true`, (c) si no hay ninguno, consulta a Banxico y persiste el resultado. (1.0 dia)
  - ST4: Pruebas: consulta exitosa a Banxico, cache hit (no llama Banxico), fecha de sabado (devuelve viernes con fallback), token invalido, timeout. (0.5 dias)
  - Total: 3.5 dias
- Que dependencias tiene esta tarea:
  - Variables de entorno: `BANXICO_TOKEN` debe estar configurado.
- De que otras tareas es dependencia esta:
  - P2 (Integracion contable): el JSON de exportacion necesita el tipo de cambio oficial para gastos en moneda extranjera.
  - P7 (Multidestino): viajes por multiples paises necesitan tipos de cambio de diferentes fechas.
  - P5 (Politicas de reembolso): las reglas de monto maximo deben considerar la conversion cambiaria.
  - P10 (Extraccion XML): si la factura es en USD, se necesita el tipo de cambio para comparar contra el presupuesto en MXN.
- Criterios de aceptacion:
  - `getRate('2026-03-05', 'USD', 'MXN')` devuelve el dato de cache si existe, sin llamar a Banxico.
  - `getRate('2026-03-02', 'USD', 'MXN')` para un domingo devuelve el dato del viernes con `is_fallback: true`.
  - Si el token es invalido, devuelve error tipado (no un error crudo de Axios).
  - La tabla tiene indice unico que previene duplicados de la misma fecha/moneda.
  - El tipo de cambio almacenado tiene precision de al menos 4 decimales.

---

## Punto 18 - Integrar centro de costos / departamento de cada empleado en la base de datos

- Necesidades/Retos tecnicos:
  - El modulo de centros de costo (`src/cost-centers/`) ya existe en Monarca, pero la relacion entre empleados, departamentos y centros de costo puede no estar completa para los fines contables.
  - Cada empleado debe estar asignado a un departamento (`src/departments/`) y cada departamento a un centro de costo. Esta cadena es necesaria para que los gastos de viaje se carguen automaticamente al centro de costo correcto.
  - Si un empleado cambia de departamento, sus nuevas solicitudes deben usar el nuevo centro de costo, pero las solicitudes anteriores deben mantener el centro de costo original (historial).
  - Se necesita validar que ningun empleado quede sin centro de costo asignado, ya que esto bloquearia la exportacion contable (P2).
  - En el frontend, la asignacion debe ser visible y editable por Administradores. Los formularios de creacion de solicitud deben pre-llenar el centro de costo basado en el departamento del empleado.
- Delivery:
  - Backend: Asegurar que la relacion `User -> Department -> CostCenter` sea obligatoria y este completa. Agregar validaciones en los DTOs para que un usuario sin centro de costo no pueda crear solicitudes. Endpoint para actualizacion masiva de asignaciones.
  - Frontend: Visualizacion de la cadena `Usuario -> Departamento -> Centro de Costo` en el perfil del empleado. Auto-fill del centro de costo en el formulario de solicitud de viaje.
- Nivel prioridad: Alta — Cada gasto de viaje debe cargarse al centro de costo correcto segun el departamento del empleado. Sin esta relacion completa (User -> Department -> CostCenter), la exportacion contable (P2) generaria datos incompletos que Ditta rechazaria. Los modulos ya existen en la BD pero la relacion obligatoria no esta forzada.
- Segmentacion de sub-tareas (1 persona full-time):
  - ST1: Auditar el esquema actual: verificar que las relaciones `User -> Department` y `Department -> CostCenter` existen y son obligatorias en las entidades TypeORM. Agregar las que falten con migraciones. (0.5 dias)
  - ST2: Agregar validacion en `RequestsService.create()`: si el usuario no tiene un departamento/centro de costo asignado, rechazar con error descriptivo "Debe tener un centro de costo asignado para crear solicitudes". (0.5 dias)
  - ST3: Crear endpoint `GET /users/:id/cost-center` que devuelva la cadena completa (usuario -> depto -> centro de costo con codigos contables de P3). Crear endpoint `POST /users/bulk-assign-departments` para asignacion masiva. (0.5 dias)
  - ST4: Modificar el formulario de creacion de solicitud en el frontend para pre-llenar el centro de costo basado en el departamento del usuario logueado. (0.5 dias)
  - ST5: Crear una vista de administracion donde se vea la lista de empleados con su departamento y centro de costo asignado, permitiendo edicion masiva. (0.5 dias)
  - ST6: Pruebas: usuario con centro de costo puede crear solicitud, usuario sin centro de costo recibe error, cambio de departamento se refleja en nuevas solicitudes pero no en las antiguas. (0.5 dias)
  - Total: 3.0 dias
- Que dependencias tiene esta tarea:
  - Modulo de Centros de Costo (`src/cost-centers/`): debe estar funcional.
  - Modulo de Departamentos (`src/departments/`): debe tener la relacion con centros de costo.
  - P3 (Tablas contables): los codigos contables (`gl_account_code`) se agregan en P3.
- De que otras tareas es dependencia esta:
  - P2 (Integracion contable): el JSON de exportacion necesita el centro de costo de cada gasto.
  - P12 (ERP): si la fuente de verdad de centros de costo es el ERP, la sincronizacion mantiene Monarca actualizado.
- Criterios de aceptacion:
  - Todo usuario activo tiene un departamento y centro de costo asignado.
  - Un usuario sin centro de costo asignado no puede crear solicitudes de viaje (recibe HTTP 400 con mensaje descriptivo).
  - Al crear una solicitud, el centro de costo se pre-llena automaticamente basado en el departamento del empleado.
  - Un cambio de departamento no afecta solicitudes anteriores (el historial se preserva).
  - La vista de administracion muestra todos los empleados con su asignacion y permite edicion.

---

## Mapa de dependencias (como se conectan los 18 puntos)

```
Capa de autorizacion y politicas:
  P1 (autorizacion configurable) --> P5 (politicas reembolso)
                                 --> P6 (autorizacion multi-nivel)
                                 --> P14 (autorizacion por correo)

Capa contable:
  P3 (tablas contables) --> P2 (integracion Ditta)
  P18 (centros de costo) --> P2
  P17 (tipos de cambio Banxico) --> P2

Capa de comprobacion fiscal:
  P10 (extraccion XML) --> P9 (validacion SAT)
  P11 (almacenamiento bucket) --> P10
  P10 --> P3 (base_amount, tax_amount)

Capa de notificaciones:
  P13 (correos/notificaciones) --> P14 (autorizacion por correo)
                               --> P15 (WhatsApp/Telegram)

Capa de viajes:
  P7 (multidestino) --> P5 (politicas dependen de dias)
                    --> P8 (agencias necesitan ruta)
                    --> P16 (deadline desde ultimo destino)
                    --> P17 (multiples monedas por destino)

Transversal:
  P4 (responsivo) -- requerido por P14 (landing de aprobacion movil)
  P12 (ERP) -- independiente, investigacion
```

- P1 es fundacional: el sistema de permisos granulares lo necesitan P5, P6 y P14.
- P3 es cimiento de P2: sin los campos contables en BD, no se puede exportar a Ditta.
- P10 alimenta a P9: primero se extraen los datos del XML, luego se validan contra el SAT.
- P13 es prerrequisito de P14 y P15: la infraestructura de notificaciones se extiende a otros canales.
- P7 (multidestino) tiene impacto en P5, P8, P16 y P17 por el calculo de dias, rutas y monedas.
- P4 (responsivo) es critico para P14 porque la aprobacion por correo se abre desde movil.
- P12 (ERP) es investigacion independiente y puede ejecutarse en paralelo.

## Propuesta preliminar para equipo de Base de Datos

Tablas y columnas nuevas que se proponen para validacion con el equipo de BD:

- **Columnas adicionales en `users`**: `external_creditor_id VARCHAR(50)`, `whatsapp_number VARCHAR(20)`, `telegram_chat_id VARCHAR(50)`.
- **Columnas adicionales en `cost_centers`**: `gl_account_code VARCHAR(50)`.
- **Columnas adicionales en `vouchers`**: `base_amount DECIMAL(12,2)`, `tax_amount DECIMAL(12,2)`, `accounting_date DATE`.
- **Columnas adicionales en `requests`**: `accounting_batch_id UUID`, `comprobation_deadline_at TIMESTAMPTZ`.
- **Tabla `authorization_matrix`**: `(id UUID, phase VARCHAR(20), condition_type VARCHAR(30), condition_params JSONB, required_role_id UUID FK, approval_order INTEGER)`.
- **Tabla `email_approval_tokens`**: `(id UUID, token_hash VARCHAR(64), request_id UUID FK, user_id UUID FK, action VARCHAR(10), expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ)`. Indice en `(token_hash)`.
- **Tabla `reimbursement_policies`**: `(id UUID, name VARCHAR(100), rule_type VARCHAR(30), params JSONB, is_active BOOLEAN, override_role_id UUID nullable)`.
- **Tabla `exchange_rates`**: `(id UUID, date DATE, source_currency VARCHAR(3), target_currency VARCHAR(3), rate DECIMAL(12,6), source VARCHAR(50), is_fallback BOOLEAN, fetched_at TIMESTAMPTZ)`. Indice unico en `(date, source_currency, target_currency)`.
- **Tabla `cfdi_validations`**: `(id UUID, voucher_id UUID FK, cfdi_uuid VARCHAR(36), rfc_emisor VARCHAR(13), rfc_receptor VARCHAR(13), total DECIMAL(12,2), moneda VARCHAR(3), sat_status VARCHAR(20), validated_at TIMESTAMPTZ, validated_by UUID)`. Indice en `(voucher_id, validated_at)`. Solo INSERT (auditoria inmutable).
- **Tabla `accounting_batches`**: `(id UUID, generated_at TIMESTAMPTZ, date_from DATE, date_to DATE, record_count INTEGER, status VARCHAR(20))`.
- **Tabla `user_notifications`**: `(id UUID, user_id UUID FK, type VARCHAR(50), channel VARCHAR(20), status VARCHAR(20), sent_at TIMESTAMPTZ, read_at TIMESTAMPTZ, payload JSONB)`.
- **Tabla `deadline_policies`**: `(id UUID, trip_type VARCHAR(20), deadline_days INTEGER, deadline_type VARCHAR(20), is_active BOOLEAN)`.
