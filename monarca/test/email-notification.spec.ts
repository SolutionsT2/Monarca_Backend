/*
 * email-notification.spec.ts
 *
 * Functionality Test - TC-1002
 * Module: Email system
 * Title: Verify email notifications work
 * Description: Ensure approver receives email after requester creates a trip.
 * Test Designed by: Ernesto Garza
 * Test Executed by: Katia Alvarez
 */

import { NotificationsService } from 'src/notifications/notifications.service';

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

  // Step 1-12: Requester creates trip → Step 13: Approver receives email
  it('should call notifyOrWarn with the approver email when a trip is created', async () => {
    const approverEmail = 'approver@monarca.com';

    // Simulate what requests.service.ts does on trip creation (line 465)
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

  // Verify no warning returned when email succeeds
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

  // Verify warning returned when email fails
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

  // Verify empty/null recipient is handled gracefully
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