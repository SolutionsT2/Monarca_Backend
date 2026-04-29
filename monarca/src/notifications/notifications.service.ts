/*
 * notifications.service.ts
 *
 * Provides email notification functionality using Nodemailer.
 * Handles email transport configuration and message dispatching,
 * including optional HTML rendering and safe content handling.
 */

import {
  Injectable,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type EmailWarning = {
  code: 'EMAIL_NOTIFICATION_FAILED';
  message: string;
  recipients: string[];
};

export type NotifyOrWarnArgs = {
  to: string;
  subject: string;
  text: string;
  html: string;
  failureMessage: string;
};

/**
 * Service responsible for handling email notifications
 * and communication with the configured SMTP provider.
 */
@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  // Initializes SMTP transporter using environment variables.
  constructor() {
    const transportOptions: any = {
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '1025', 10),
      secure: (process.env.EMAIL_SECURE || 'false') === 'true',
    };

    // Only set auth when credentials are provided (MailHog doesn't need auth).
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      transportOptions.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      };
    }

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  /**
   * Sends an email using the configured SMTP transporter.
   *
   * @param to Recipient email address.
   * @param subject Email subject line.
   * @param text Plain text content of the email.
   * @param html Optional HTML content.
   * @returns Promise containing the Nodemailer response.
   */
  async sendMail(to: string, subject: string, text: string, html?: string) {
    const fromAddress = process.env.EMAIL_USER
      ? `"Sistema Monarca" <${process.env.EMAIL_USER}>`
      : '"Sistema Monarca" <noreply@monarca.dev>';
    const mailOptions: nodemailer.SendMailOptions = {
      from: fromAddress,
      to,
      subject,
      text,
      html,
    };
    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Wrapper method for sending notifications.
   * Delegates email sending to the internal sendMail method.
   *
   * @param to Recipient email address.
   * @param subject Notification subject.
   * @param text Plain text content.
   * @param html Optional HTML content.
   */
  async sendNotification(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ) {
    return this.sendMail(to, subject, text, html);
  }

  /**
   * Sends a notification while ensuring safe HTML rendering.
   * Escapes plain text content to prevent HTML injection
   * and generates a minimal HTML email structure.
   *
   * @param to Recipient email address.
   * @param subject Notification subject.
   * @param message Plain text message content.
   * @param html Optional raw HTML body.
   */
  async notify(to: string, subject: string, message: string, html?: string) {
    // Escapes plain text to prevent HTML injection.
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Generates a minimal HTML structure for email rendering.
    const htmlComplete = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(subject)}</title>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    try {
      return await this.sendMail(to, subject, message, htmlComplete);
    } catch (err) {
      const logger = new Logger('NotificationsService');
      logger.warn(
        `Failed to send notification to ${to} (subject: ${subject}): ${err?.message || err}`,
      );
      // Do not rethrow: failures to send emails should not make the whole request fail
      return null;
    }
  }

  /**
   * Sends an email notification and returns a warning when the delivery fails.
   * This allows business operations to continue while reporting notification
   * failures to API consumers.
   *
   * @param args Email notification data and warning message.
   * @returns A warning object when the email fails, otherwise null.
   */
  async notifyOrWarn({
    to,
    subject,
    text,
    html,
    failureMessage,
  }: NotifyOrWarnArgs): Promise<EmailWarning | null> {
    try {
      const result = await this.notify(to, subject, text, html);

      if (result === null) {
        return {
          code: 'EMAIL_NOTIFICATION_FAILED',
          message: failureMessage,
          recipients: [to],
        };
      }

      return null;
    } catch (error) {
      const logger = new Logger('NotificationsService');
      logger.warn(`${failureMessage}: ${error?.message || error}`);

      return {
        code: 'EMAIL_NOTIFICATION_FAILED',
        message: failureMessage,
        recipients: [to],
      };
    }
  }
}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added full documentation, JSDoc comments, and standardized comment language to English.
- 2026-04-29 | Juan de Dios Gastélum Flores | Added reusable email warning helper for non-blocking notification failures.
*/
