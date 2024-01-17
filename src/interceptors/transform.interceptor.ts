import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = _context.switchToHttp().getRequest();
    const response = _context.switchToHttp().getResponse();


    const isValidateEndpoint = request.url.includes('/wxchat/getMsg');
    if (isValidateEndpoint) {
      return next.handle()
    }else{
      return next.handle().pipe(
        map((data: any) => {
          return {
            data: instanceToPlain(data),
            code: 0,
            message: '请求成功',
          };
        })
      );
    }

    
  }
}
