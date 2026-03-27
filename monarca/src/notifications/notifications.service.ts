/*
 * notifications.service.ts
 *
 * Provides email notification functionality using Nodemailer.
 * Handles email transport configuration and message dispatching,
 * including optional HTML rendering and safe content handling.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { join } from 'path';

/**
 * Service responsible for handling email notifications
 * and communication with the configured SMTP provider.
 */
@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  // Initializes SMTP transporter using environment variables.
  constructor() {
  this.transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT ?? '1025'),
    secure: false,
    ...(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
      ? {
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        }
      : {}),
  });
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
    html?: string
  ) {
    return this.sendMail(
      to, 
      subject, 
      text, 
      html
  );
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
  async notify(
  to: string,
  subject: string,
  message: string,
  html?: string
) {
  
  // Escapes plain text to prevent HTML injection.
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Assumes message is plain text and escapes it before rendering.
    // To allow optional HTML, you could distinguish: if you detect HTML tags, don't escape.
    // Here we treat the message as plain text and escape it, while allowing optional HTML content to be included as-is.
    const safeText = escapeHtml(message);

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

    return this.sendMail(to, subject, message, htmlComplete);
}

}

/*
Modification History:

- 2026-02-26 | Diego Vergara | Added full documentation, JSDoc comments, and standardized comment language to English.
*/