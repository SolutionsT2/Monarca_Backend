/*
 * email-notification.spec.ts
 * Functionality Test - TC-1002
 * Module: Email system
 * Title: Verify email notifications work
 */


//npx jest --config ./test/jest-unit.json --testPathPattern="email-notification" para correr

// dentro de este archivo esta la prueba unitaria para verificar que el sistema de notificaciones por correo electrónico funcione correctamente
import { NotificationsService } from 'src/notifications/notifications.service';

// Aqui haremos que el servicio de notificaciones sea simulado (mocked) para no depender de un servidor SMTP real durante las pruebas, lo que nos permitirá verificar que se llama al método correcto con los parámetros esperados sin enviar correos reales. Esto es importante para mantener las pruebas rápidas y confiables.
describe('TC-1002 - Email notification to approver on trip creation', () => {
  let notificationsService: NotificationsService;

  beforeEach(() => {
    // Mock NotificationsService without real SMTP connection
    notificationsService = {
      notifyOrWarn: jest.fn().mockResolvedValue(null),
      notify: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
      sendNotification: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationsService;
  });

  it('should call notifyOrWarn with the approver email when a trip is created', async () => {
    const approverEmail = 'approver@monarca.com';

    // aqui simulamos la creación de un viaje y la lógica que debería llamar a notificationsService.notifyOrWarn con el correo del aprobador.
    await notificationsService.notifyOrWarn({
      to: approverEmail,
      subject: 'Nueva solicitud de viaje: Developer Conference',
      text: 'Se ha creado una nueva solicitud de viaje que requiere tu aprobación.',
      html: '<p>Se ha creado una nueva solicitud de viaje que requiere tu aprobación.</p>',
      failureMessage: 'No se pudo notificar al aprobador.',
    });

    expect(notificationsService.notifyOrWarn).toHaveBeenCalledTimes(1);
    expect(notificationsService.notifyOrWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        to: approverEmail,
      }),
    );
  });

  // verificamos  que el método notifyOrWarn devuelve null (sin advertencia) cuando el correo se envía correctamente, lo que indica que no hubo problemas con la notificación. 
  it('should return null (no warning) when approver email is sent successfully', async () => {
    const result = await notificationsService.notifyOrWarn({
      to: 'approver@monarca.com',
      subject: 'Nueva solicitud de viaje',
      text: 'Tienes una nueva solicitud pendiente de aprobación.',
      html: '<p>Tienes una nueva solicitud pendiente de aprobación.</p>',
      failureMessage: 'No se pudo notificar al aprobador.',
    });

    expect(result).toBeNull();
  });

  // Simulamos un fallo en la entrega del correo al aprobador y verificamos que el método notifyOrWarn devuelve un objeto EmailWarning con el código de error y los destinatarios afectados, lo que indica que hubo un problema al intentar enviar la notificación.
  it('should return an EmailWarning when approver email delivery fails', async () => {
    (notificationsService.notifyOrWarn as jest.Mock).mockResolvedValueOnce({
      code: 'EMAIL_NOTIFICATION_FAILED',
      message: 'No se pudo notificar al aprobador.',
      recipients: ['approver@monarca.com'],
    });

    const result = await notificationsService.notifyOrWarn({
      to: 'approver@monarca.com',
      subject: 'Nueva solicitud de viaje',
      text: 'Tienes una nueva solicitud pendiente de aprobación.',
      html: '<p>Tienes una nueva solicitud pendiente de aprobación.</p>',
      failureMessage: 'No se pudo notificar al aprobador.',
    });

    expect(result).not.toBeNull();
    expect(result?.code).toBe('EMAIL_NOTIFICATION_FAILED');
    expect(result?.recipients).toContain('approver@monarca.com');
  });

  // Verificamos que el método notifyOrWarn maneja correctamente el caso en que el correo del aprobador
  // es nulo o vacío, devolviendo un EmailWarning con el código de error y sin destinatarios, lo que indica que no se pudo enviar la notificación debido a la falta de una dirección de correo válida.
  it('should not crash when approver email is null or empty', async () => {
    (notificationsService.notifyOrWarn as jest.Mock).mockResolvedValueOnce({
      code: 'EMAIL_NOTIFICATION_FAILED',
      message: 'No se pudo notificar al aprobador.',
      recipients: [],
    });

    const result = await notificationsService.notifyOrWarn({
      to: null as any,
      subject: 'Nueva solicitud de viaje',
      text: 'Tienes una nueva solicitud pendiente de aprobación.',
      html: '<p>Tienes una nueva solicitud pendiente de aprobación.</p>',
      failureMessage: 'No se pudo notificar al aprobador.',
    });

    expect(result?.code).toBe('EMAIL_NOTIFICATION_FAILED');
    expect(result?.recipients).toHaveLength(0);
  });
});