# Duffel Search-Only Testing Guide

This guide explains how to test the Duffel search-only flow in Monarca.

## Automated Tests (Implemented)

Run focused tests for travel-integrations:

```bash
npm test -- travel-integrations
```

Covered by tests:
- Response normalization for:
  - create offer request
  - list offers
  - get offer detail
- Controller search-only behavior:
  - list filters (`limit`, `sort`, `maxConnections`)
  - detail option (`returnAvailableServices`)
  - auth/business guards related outcomes

Files:
- `src/travel-integrations/utils/duffel-offers.normalizer.spec.ts`
- `src/travel-integrations/controllers/duffel.controller.spec.ts`

## E2E Reality Check

A real e2e run (`test/login.e2e-spec.ts`) executes but currently fails in this environment due to credentials/seed mismatch (`Email or password incorrect`).

This indicates:
- The test harness works.
- Data setup (seed/login fixture) must be aligned before full e2e suite can pass.

## Manual API Validation (Postman)

Collection file:
- `test/duffel-search-only.postman_collection.json`

Flow in collection:
1. Login
2. Create Duffel Offer Request
3. List Duffel Offers
4. Get Duffel Offer Detail

Required variable update before running:
- `requestDestinationId` must be a valid existing request destination linked to the logged-in travel agency and in `Pending Reservations` status.

## Suggested Test Scenarios (Duffel Test Mode)

Use these routes to verify key search behaviors:
- No flights: `PVD` -> `RAI`
- Connecting flights: `LHR` -> `DXB`
- Timeout: `STN` -> `LHR`

## Success Criteria

For search-only integration, tests should confirm:
- No order/payment endpoints are required in flow.
- API responses are normalized and stable for frontend.
- Pagination/filter parameters are accepted and forwarded.
- Errors are surfaced consistently by backend.
