/*
 * notifications.controller.ts
 *
 * Defines the HTTP controller responsible for handling
 * notification-related endpoints within the application.
 * Routes under this controller are prefixed with '/notifications'.
 */

/**
 * Controller responsible for managing notification endpoints.
 */

import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

type SendNotificationDto = {
	to: string;
	subject: string;
	text: string;
	html?: string;
};

@Controller('notifications')
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Post('send')
	async send(@Body() body: SendNotificationDto) {
		await this.notificationsService.sendNotification(
			body.to,
			body.subject,
			body.text,
			body.html,
		);

		return { message: 'Correo enviado correctamente.' };
	}
}



/*
Modification History:

- 2026-02-26 | Diego Vergara | Added controller documentation and file header description.
*/
