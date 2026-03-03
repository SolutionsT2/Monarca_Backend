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

  it('/travel-agencies (POST) should create a travel agency', async () => {
    const dto = { name: 'Agencia E2E' };
    const res = await request(app.getHttpServer())
      .post('/travel-agencies')
      .send(dto)
      .expect(201);

    expect(res.body).toHaveProperty('id');

    const data = res.body as TravelAgencyDto;

    expect(data.name).toBe(dto.name);

    await request(app.getHttpServer())
      .delete(`/travel-agencies/${data.id}`)
      .expect(200);
  });

  it('/travel-agencies (GET) should return all travel agencies', async () => {
    const res = await request(app.getHttpServer())
      .get('/travel-agencies')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/travel-agencies/:id (GET) should return one by ID', async () => {
    // 1) Creamos primero para obtener su ID dinámico
    const createRes = await request(app.getHttpServer())
      .post('/travel-agencies')
      .send({ name: 'Para GET' })
      .expect(201);

    const data = createRes.body as TravelAgencyDto;

    // 2) Ahora lo buscamos por ese mismo ID
    const res = await request(app.getHttpServer())
      .get(`/travel-agencies/${data.id}`)
      .expect(200);

    const retrieved_data = res.body as TravelAgencyDto;
    expect(retrieved_data.id).toBe(data.id);

    await request(app.getHttpServer())
      .delete(`/travel-agencies/${data.id}`)
      .expect(200);
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added modification history.
 */
