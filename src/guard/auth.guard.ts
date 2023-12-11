import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '@src/plugin/redis/redis.service';
import { getUrlQuery } from '@src/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token =
      context.switchToRpc().getData().headers
      // .origin='https://oa.zwgczx.com'
console.log(token)
    if (token) {
      // 如果传递了token的话就要从redis中查询是否有该token
      return true;
    } else {
      throw new HttpException(
        JSON.stringify({ code: 10024, message: '你还没登录,请先登录' }),
        HttpStatus.OK
      );
    }

  }
}
