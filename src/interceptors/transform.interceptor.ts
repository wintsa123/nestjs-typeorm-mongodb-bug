import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = _context.switchToHttp().getRequest();
    const response = _context.switchToHttp().getResponse();

    response.statusCode = 200; // 将状态码设置为 200

    const isValidateEndpoint = request.url.includes('/wxchat/getMsg');
    request.state=200
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
