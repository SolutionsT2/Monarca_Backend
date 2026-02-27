/**
 * E2E tests for reservations API: POST create, GET all, GET by id, PATCH update, DELETE.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';
import {
  CreateReservationDto,
  ReservationDto,
} from 'src/reservations/dto/reservation.dtos';
dotenv.config();

describe('reservations e2e', () => {
  let app: INestApplication;

  /** Bootstrap Nest app with validation pipe before all tests. */
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

  /** Close app after all tests. */
  afterAll(async () => {
    await app.close();
  });

  /** POST /reservations creates a reservation and returns it with id. */
  it('POST /reservations creates a reservation', async () => {
    const dto = {
      title: 'Reserva de taxi aeropuerto',
      comments:
        'Taxi reservado para el usuario María García, llegada estimada a las 08:30 AM',
      link: 'https://taxi-service.com/booking/abc123',
      id_request_destination: '17c8984c-ee37-44cf-8138-9728063b4560',
    };
    const res = await request(app.getHttpServer())
      .post('/reservations')
      .send(dto)
      .expect(201);

    expect(res.body).toHaveProperty('id');

    const data = res.body;

    expect(data.title).toBe(dto.title);
    expect(data.comments).toBe(dto.comments);
    expect(data.link).toBe(dto.link);
    expect(data.id_request_destination).toBe(dto.id_request_destination);
    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);
  });

  /** GET /reservations returns all reservations as an array. */
  it('GET /reservations returns all reservations', async () => {
    const res = await request(app.getHttpServer())
      .get('/reservations')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  /** GET /reservations/:id returns one reservation by id (create first to get dynamic id). */
  it('GET /reservations/:id returns one reservation by id', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/reservations')
      .send({
        title: 'Reserva de taxi',
        comments: 'Taxi reservado para el usuario',
        link: 'https://example.com/reservation/12345',
        id_request_destination: '17c8984c-ee37-44cf-8138-9728063b4560',
      })
      .expect(201);

    const data = createRes.body;

    const res = await request(app.getHttpServer())
      .get(`/reservations/${data.id}`)
      .expect(200);

    const retrievedData = res.body;
    expect(retrievedData.id).toBe(data.id);

    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);
  });

  /** PATCH /reservations/:id updates one or more reservation fields. */
  it('PATCH /reservations/:id updates reservation fields', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/reservations')
      .send({
        title: 'Reserva de taxi',
        comments: 'Taxi reservado para el usuario',
        link: 'https://example.com/reservation/12345',
        id_request_destination: '8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f',
      })
      .expect(201);

    const data = createRes.body;
    const updatedComment =
      'Taxi reservado para el usuario Juan Pérez, llegada estimada a las 09:00 AM';
    const res = await request(app.getHttpServer())
      .patch(`/reservations/${data.id}`)
      .send({ comments: updatedComment })
      .expect(200);

    const updatedReservation = await request(app.getHttpServer())
      .get(`/reservations/${data.id}`)
      .expect(200);

    const retrievedData = updatedReservation.body;
    expect(retrievedData.comments).toBe(updatedComment);

    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);
  });

  /** DELETE /reservations/:id deletes the reservation; GET afterward returns 404. */
  it('DELETE /reservations/:id deletes the reservation', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/reservations')
      .send({
        title: 'Reserva de taxi',
        comments: 'Taxi reservado para el usuario',
        link: 'https://example.com/reservation/12345',
        id_request_destination: '17c8984c-ee37-44cf-8138-9728063b4560',
      })
      .expect(201);

    const data = createRes.body;

    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/reservations/${data.id}`)
      .expect(404);
  });
});
/*
Modification History:
- 2026-02-25 | Standards applied | File description, test descriptions and comments in English, camelCase variables, removed debug log, modification history.
*/

