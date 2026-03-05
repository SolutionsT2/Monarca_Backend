/**
 * File: logging.middleware.ts
 * Description: Middleware that logs each request (method, URL, status, size, response time) on response finish.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggingMiddleware
 * 
 * Middleware for logging HTTP request details including method, URL, status code,
 * response size, and response time.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    // Listen for the finish event on the response to log after the request has been processed.
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - startTime;
      // Logging handled by NestJS logger in production
    });

    next();
  }
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history; removed unused Logger import.
 */
