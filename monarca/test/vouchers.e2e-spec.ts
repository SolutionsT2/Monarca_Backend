/**
 * Vouchers E2E Tests
 * Tests for voucher CRUD operations (Create, Read, Update, Delete)
 * Last updated: 2026-02-26
 * Authors: Monarca Development Team
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';
import { CreateVoucherDto } from 'src/vouchers/dto/create-voucher-dto';
import { UpdateVoucherDto } from 'src/vouchers/dto/update-voucher-dto';
dotenv.config();

// Tests for voucher endpoints
describe('Vouchers e2e', () => {
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

  it('/vouchers (GET) should return all vouchers', async () => {
    const res = await request(app.getHttpServer()).get('/vouchers').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/vouchers (POST) should register a new voucher', async () => {
    const dto = {
      id_request: 'a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a',
      class: 'HOT hotel',
      amount: 150.0,
      currency: 'YEN',
      date: '2025-04-25T00:00:00.000Z',
      file_url: 'https://storage.example.com/vouchers/voucher-123.pdf',
      status: 'voucher accepted',
    };

    const res = await request(app.getHttpServer())
      .post('/vouchers')
      .send(dto)
      .expect(201);

    expect(res.body).toHaveProperty('id');
  });

  it('/vouchers/:id (GET) should return a voucher by ID', async () => {
    // 1) Creamos primero para obtener su ID dinámico
    const dto = {
      id_request: 'a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a',
      class: 'HOT hotel',
      amount: 150.0,
      currency: 'YEN',
      date: '2025-04-25T00:00:00.000Z',
      file_url: 'https://storage.example.com/vouchers/voucher-123.pdf',
      status: 'voucher accepted',
    };

    const createRes = await request(app.getHttpServer())
      .post('/vouchers')
      .send(dto)
      .expect(201);

    const data = createRes.body;

    // 2) Ahora lo buscamos por ese mismo ID
    const res = await request(app.getHttpServer())
      .get(`/vouchers/${data.id}`)
      .expect(200);

    const retrieved_data = res.body;
    expect(retrieved_data.id).toBe(data.id);

    await request(app.getHttpServer())
      .delete(`/vouchers/${data.id}`)
      .expect(200);
  });

  it('/vouchers/:id (DELETE) should delete a voucher by ID', async () => {
    // 1) Creamos primero para obtener su ID dinámico
    const dto = {
      id_request: 'a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a',
      class: 'HOT hotel',
      amount: 150.0,
      currency: 'YEN',
      date: '2025-04-25T00:00:00.000Z',
      file_url: 'https://storage.example.com/vouchers/voucher-123.pdf',
      status: 'voucher accepted',
    };

    const createRes = await request(app.getHttpServer())
      .post('/vouchers')
      .send(dto)
      .expect(201);

    const data = createRes.body;

    // 2) Ahora lo eliminamos por ese mismo ID
    const res = await request(app.getHttpServer())
      .delete(`/vouchers/${data.id}`)
      .expect(200);
  });

  it('/vouchers/:id (PATCH) should update a voucher by ID', async () => {
    // 1) Creamos primero para obtener su ID dinámico
    const dto = {
      id_request: 'a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a',
      class: 'HOT hotel',
      amount: 150.0,
      currency: 'YEN',
      date: '2025-04-25T00:00:00.000Z',
      file_url: 'https://storage.example.com/vouchers/voucher-123.pdf',
      status: 'voucher accepted',
    };
    const update_dto = {
      id_request: 'a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a',
      class: 'HOT hotel',
      amount: 200.0, // Update the amount
      currency: 'BOL', // Update the currency
    };

    const createRes = await request(app.getHttpServer())
      .post('/vouchers')
      .send(dto)
      .expect(201);

    const data = createRes.body;

    const createPatch = await request(app.getHttpServer())
      .patch(`/vouchers/${data.id}`)
      .send(update_dto)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/vouchers/${data.id}`)
      .expect(200);
  });
});

/**
 * Modification History:
 * - 2026-03-02: Added modification history.
 */
