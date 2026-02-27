/*
 * notifications.e2e-spec.ts
 *
 * End-to-end test suite for NotificationsController.
 * Validates the complete HTTP request lifecycle using
 * the real application module configuration.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Includes the full backend application
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/notifications/send (POST) - should send email', async () => {
    const response = await request(app.getHttpServer())
      .post('/notifications/send')
      .send({
        to: 'correo@ejemplo.com',
        subject: 'Prueba E2E',
        text: 'Esto es una prueba end-to-end',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Correo enviado correctamente.');

  });

  afterAll(async () => {
    await app.close();
  });
});



/*
Modification History:

- 2026-02-26 | Diego Vergara | Standardized documentation and translated comments to English.
*/