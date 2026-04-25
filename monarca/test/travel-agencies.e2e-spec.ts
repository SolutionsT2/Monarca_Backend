/**
 * Travel Agencies E2E Tests
 * Tests for travel agency CRUD operations (Create, Read, Update, Delete)
 * Last updated: 2026-02-26
 * Authors: Monarca Development Team
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';
import { TravelAgencyDto } from 'src/travel-agencies/dto/travel-agency.dtos';
dotenv.config();

// Tests for travel agency endpoints
describe('Travel Agencies e2e', () => {
  let app: INestApplication;

  const createTravelAgency = async (name: string) => {
    const response = await request(app.getHttpServer())
      .post('/travel-agencies')
      .send({ name })
      .expect(201);

    return response.body as TravelAgencyDto;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/travel-agencies (GET) should return all travel agencies', async () => {
    const res = await request(app.getHttpServer())
      .get('/travel-agencies')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/travel-agencies (POST) should create a travel agency', async () => {
    const created = await createTravelAgency('Agencia E2E');

    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Agencia E2E');

    await request(app.getHttpServer())
      .delete(`/travel-agencies/${created.id}`)
      .expect(200);
  });

  it('/travel-agencies (POST) should validate the name field', async () => {
    const res = await request(app.getHttpServer())
      .post('/travel-agencies')
      .send({ name: '', unexpected: true })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });

  it('/travel-agencies/:id (GET) should return one by ID', async () => {
    const created = await createTravelAgency('Para GET');

    const res = await request(app.getHttpServer())
      .get(`/travel-agencies/${created.id}`)
      .expect(200);

    const retrieved_data = res.body as TravelAgencyDto;
    expect(retrieved_data.id).toBe(created.id);
    expect(retrieved_data.name).toBe(created.name);

    await request(app.getHttpServer())
      .delete(`/travel-agencies/${created.id}`)
      .expect(200);
  });

  it('/travel-agencies/:id (PATCH) should update a travel agency', async () => {
    const created = await createTravelAgency('Para PATCH');

    await request(app.getHttpServer())
      .patch(`/travel-agencies/${created.id}`)
      .send({ name: 'Agencia Actualizada' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/travel-agencies/${created.id}`)
      .expect(200);

    expect(res.body.name).toBe('Agencia Actualizada');

    await request(app.getHttpServer())
      .delete(`/travel-agencies/${created.id}`)
      .expect(200);
  });

  it('/travel-agencies/:id (DELETE) should delete a travel agency', async () => {
    const created = await createTravelAgency('Para DELETE');

    await request(app.getHttpServer())
      .delete(`/travel-agencies/${created.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/travel-agencies/${created.id}`)
      .expect(404);
  });

  it('/travel-agencies/:id should reject invalid UUIDs', async () => {
    const res = await request(app.getHttpServer())
      .get('/travel-agencies/not-a-uuid')
      .expect(400);

    expect(res.body.message).toBeDefined();
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added modification history.
 */
