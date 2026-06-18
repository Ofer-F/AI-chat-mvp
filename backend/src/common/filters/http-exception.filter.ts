import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const code = HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR';
    const { message, details } = this.extract(exception);

    const body: ErrorResponseBody = {
      error: { code, message, ...(details === undefined ? {} : { details }) },
    };

    response.status(status).json(body);
  }

  private extract(exception: unknown): { message: string; details?: unknown } {
    if (!(exception instanceof HttpException)) {
      return { message: 'Internal server error' };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { message: payload };
    }

    const record = payload as { message?: string | string[] };
    const rawMessage = record.message;

    if (Array.isArray(rawMessage)) {
      return {
        message: rawMessage[0] ?? exception.message,
        details: rawMessage,
      };
    }

    return { message: rawMessage ?? exception.message };
  }
}
