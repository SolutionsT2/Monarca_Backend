# Duffel Search-Only Changes And Scope

This document describes the latest Duffel integration changes and the delivery scope for the current phase.

## Context

The integration was aligned to a search-only experience for flights.

Goal:
- Show available flights in Monarca based on user criteria.

Non-goals for this phase:
- Purchase flow.
- Payments.
- Redirecting users to provider websites.
- Post-booking operations (changes, cancellations, webhooks).

## What Changed

### 1. Controller scope reduced to offers search endpoints
File:
- `src/travel-integrations/controllers/duffel.controller.ts`

Changes:
- Kept only search endpoints:
  - `POST /travel-integrations/duffel/offer-requests`
  - `GET /travel-integrations/duffel/offers`
  - `GET /travel-integrations/duffel/offers/:offerId`
- Removed order/payment behavior from the active flow.
- Added normalized response mapping before returning data to frontend.

### 2. DTOs expanded for search quality and pagination
File:
- `src/travel-integrations/dto/duffel.dto.ts`

Changes:
- `ListDuffelOffersQueryDto` now supports:
  - `limit` as validated integer (`1..200`)
  - `sort` (`total_amount`, `-total_amount`, `total_duration`, `-total_duration`)
  - `maxConnections`
- Added `GetDuffelOfferByIdQueryDto` with:
  - `returnAvailableServices` (boolean)

### 3. Duffel service supports richer query options
File:
- `src/travel-integrations/services/duffel.service.ts`

Changes:
- `listOffers(...)` now forwards:
  - `after`
  - `limit`
  - `sort`
  - `max_connections`
- `getOfferById(...)` now supports:
  - `return_available_services`

### 4. Response normalization layer added
File:
- `src/travel-integrations/utils/duffel-offers.normalizer.ts`

Changes:
- Added normalized contracts for:
  - offer request response
  - offers list response
  - offer detail response
- Added normalized structures for:
  - prices (`total_amount`, `currency`, taxes)
  - slices and segments
  - operating/marketing carriers
  - total connections
  - pagination (`after`, `before`, `limit`)

### 5. Integration module remains search-only active path
File:
- `src/travel-integrations/travel-integrations.module.ts`

Changes:
- Active module wiring remains focused on search-only endpoint flow.
- Order/payment/webhook flow is not part of the active MVP path.

## Current Scope (In)

Included in this phase:
- Search flights by creating an offer request.
- List offers with pagination and filtering controls.
- Retrieve a fresh offer detail by ID.
- Return normalized payloads for frontend consumption.
- Preserve auth/permissions and request ownership checks.

## Current Scope (Out)

Explicitly excluded from this phase:
- Create orders.
- Create payments.
- Seat maps and ancillaries purchase UX.
- Webhook-based reservation lifecycle updates.
- Order changes, cancellations, and airline credit workflows.
- Partial-offer flow (deprecated in Duffel docs).

## API Contract Summary

### Create Offer Request
- Endpoint: `POST /travel-integrations/duffel/offer-requests`
- Purpose: start a search based on slices/passengers.

### List Offers
- Endpoint: `GET /travel-integrations/duffel/offers`
- Required query:
  - `offerRequestId`
- Optional query:
  - `after`
  - `limit`
  - `sort`
  - `maxConnections`

### Get Offer Detail
- Endpoint: `GET /travel-integrations/duffel/offers/:offerId`
- Optional query:
  - `returnAvailableServices`

## Rationale

Why this scope:
- Matches product objective: discovery-only flight experience.
- Reduces operational and financial risk in MVP.
- Decouples frontend from raw provider payload shape.
- Leaves clean path for a Phase 2 focused on booking/payment.

## Recommended Next Steps

1. Add explicit response DTO classes for Swagger/OpenAPI output.
2. Add tests for:
- normalization behavior
- pagination edge cases
- timeout/rate-limit translation
3. Document phase handoff criteria for enabling booking later (Phase 2).

## Revision Note

Date: 2026-04-15

This document reflects the search-only alignment currently implemented in the Duffel integration layer.
