# Duffel Frontend Quickstart (Search-Only)

## Objetivo
Consumir Duffel como metabuscador (tipo Google Flights):
- crear busqueda de ofertas
- listar ofertas
- consultar detalle de una oferta

Sin compra, pago ni emision.

---

## Variables de entorno requeridas (Backend)

Minimas:
- `DUFFEL_API_KEY=<tu_api_key_de_duffel>`
- `DUFFEL_TIMEOUT_MS=130000` (opcional)
- `NODE_ENV=development` (recomendado para pruebas)

Solo si van a usar webhook:
- `DUFFEL_WEBHOOK_SECRET=<secret_de_duffel>`

Otras necesarias para correr Monarca (DB/JWT/CORS) deben estar configuradas como en el proyecto.

---

## Variables de entorno sugeridas (Frontend)

- `VITE_API_BASE_URL=http://localhost:3000`
- `VITE_USE_CREDENTIALS=true`

Importante:
- Deben enviar cookies en todas las requests protegidas (`withCredentials: true` en Axios o `credentials: 'include'` en fetch).
- La autenticacion en backend depende de la cookie `sessionInfo`.

---

## Endpoints que frontend debe usar

Base: `/travel-integrations/duffel`

1. Login (obligatorio antes de Duffel)
- `POST /login`

Body:
```json
{
  "email": "travelagent1@monarca.com",
  "password": "password"
}
```

2. Obtener solicitudes asignadas a la agencia (para tomar `requestDestinationId`)
- `GET /requests/to-reserve`

De aqui deben tomar `requests_destinations[0].id` de alguna solicitud valida.

3. Crear offer request en Duffel
- `POST /travel-integrations/duffel/offer-requests`

Body ejemplo:
```json
{
  "requestDestinationId": "REEMPLAZAR_CON_UUID_REAL",
  "data": {
    "slices": [
      {
        "origin": "MEX",
        "destination": "JFK",
        "departure_date": "2026-05-10"
      }
    ],
    "passengers": [
      { "type": "adult" }
    ],
    "cabin_class": "economy"
  }
}
```

Respuesta esperada (normalizada):
```json
{
  "offer_request_id": "orq_xxx",
  "created_at": "2026-04-18T...Z",
  "live_mode": false
}
```

4. Listar ofertas
- `GET /travel-integrations/duffel/offers?offerRequestId=orq_xxx&limit=20&sort=total_amount&maxConnections=1`

Respuesta esperada (normalizada):
```json
{
  "offer_request_id": "orq_xxx",
  "pagination": {
    "after": null,
    "before": null,
    "limit": 20
  },
  "offers": [
    {
      "offer_id": "off_xxx",
      "price": {
        "total_amount": "123.45",
        "total_currency": "USD"
      },
      "total_connections": 0,
      "slices": []
    }
  ]
}
```

5. Detalle de oferta
- `GET /travel-integrations/duffel/offers/off_xxx?returnAvailableServices=true`

Respuesta esperada (normalizada):
```json
{
  "offer": {
    "offer_id": "off_xxx",
    "offer_request_id": "orq_xxx",
    "price": {
      "total_amount": "123.45",
      "total_currency": "USD"
    }
  }
}
```

---

## Datos de prueba (seed)

Credenciales utiles:
- Travel Agent:
  - email: `travelagent1@monarca.com`
  - password: `password`
  - idTravelAgency: `24169971-6d7f-4bf7-982c-dad1aebac579`

- Company Admin (opcional para pruebas de otros modulos):
  - email: `companyadmin@monarca.com`
  - password: `password`

Nota:
- En algunos ambientes, `seeds/requests.json` y `seeds/requests-destinations.json` pueden estar vacios.
- Si `GET /requests/to-reserve` regresa lista vacia, necesitan crear/ajustar una request en estado `Pending Reservations` con la agencia del travel agent.

SQL de apoyo para ubicar un `requestDestinationId` valido:
```sql
SELECT rd.id AS request_destination_id,
       r.id AS request_id,
       r.status,
       r.id_travel_agency
FROM requests_destinations rd
JOIN requests r ON r.id = rd.id_request
WHERE r.status = 'Pending Reservations'
  AND r.id_travel_agency = '24169971-6d7f-4bf7-982c-dad1aebac579'
LIMIT 10;
```

---

## Errores comunes y solucion rapida

1. `401 Unauthorized` en Duffel
- Falta login
- No se esta enviando cookie (`withCredentials`/`credentials: include`)
- Usuario no tiene `id_travel_agency`

2. `409 Conflict` al crear offer request
- La solicitud no esta en `Pending Reservations`

3. `500` al llamar Duffel
- Revisar `DUFFEL_API_KEY`
- Revisar conectividad externa

4. Cookie no se guarda en local
- El login usa cookie `secure: true`; en entornos HTTP sin HTTPS puede bloquearse.
- Para pruebas locales puras, consideren correr backend/frontend en HTTPS o ajustar temporalmente politica de cookie para dev.

---

## Ejemplo Axios (frontend)

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

export async function loginTravelAgent() {
  return api.post('/login', {
    email: 'travelagent1@monarca.com',
    password: 'password',
  });
}

export async function getToReserve() {
  return api.get('/requests/to-reserve');
}

export async function createOfferRequest(requestDestinationId: string) {
  return api.post('/travel-integrations/duffel/offer-requests', {
    requestDestinationId,
    data: {
      slices: [{ origin: 'MEX', destination: 'JFK', departure_date: '2026-05-10' }],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
    },
  });
}

export async function listOffers(offerRequestId: string) {
  return api.get('/travel-integrations/duffel/offers', {
    params: { offerRequestId, limit: 20, sort: 'total_amount', maxConnections: 1 },
  });
}

export async function getOfferById(offerId: string) {
  return api.get(`/travel-integrations/duffel/offers/${offerId}`, {
    params: { returnAvailableServices: true },
  });
}
```
