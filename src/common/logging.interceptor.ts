import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const reqId = Math.floor(Math.random() * 2821109907456).toString(36);
    const reqLog = `[${reqId}] ${request.method} ${request.path} ip=${request.ip}`;
    this.logger.debug(reqLog);

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${reqLog} time=${Date.now() - now}ms`);
      }),
      catchError((err) =>
        throwError(() => {
          this.logger.error(`${reqLog} ${err.message}`);
          return err instanceof HttpException
            ? err
            : new InternalServerErrorException();
        }),
      ),
    );
  }
}
