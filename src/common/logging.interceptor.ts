import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { flobj } from './string';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const reqId = Math.floor(Math.random() * 2821109907456).toString(36);
    const ip =
      request.header('X-Real-IP') ||
      request.header('X-Forwarded-For') ||
      request.ip;

    this.logger.verbose(
      `[Request:${reqId}] ${flobj({
        method: request.method,
        path: request.path,
        ip,
      })}`,
    );

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        this.logger.verbose(
          `[Response:${reqId}] ${flobj({
            time: Date.now() - now,
            code: response.statusCode,
          })}`,
        );
      }),
      catchError((err) =>
        throwError(() => {
          const response = context.switchToHttp().getResponse<Response>();
          this.logger.error(
            `[Response:${reqId}] ${flobj({
              error: err.message,
              time: Date.now() - now,
              code: response.statusCode,
            })}`,
          );
          return err instanceof HttpException
            ? err
            : new InternalServerErrorException();
        }),
      ),
    );
  }
}
