import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ICurrentUserType } from '@src/decorators';
import { RedisService } from '@src/plugin/redis/redis.service';

import {
  REDIS_CACHE_EX_DIFF_USER_KEY,
  REDIS_CACHE_EX_SECOND_KEY,
  REDIS_CACHE_KEY,
} from '@src/constants';
import { generateCacheKey, redisCacheKey } from '@src/utils';

type IRequest = Request & { user: ICurrentUserType };

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    console.log('缓存拦截器');
    const request: IRequest = context.switchToHttp().getRequest();
    const isCacheApi =
      Reflect.getMetadata(REDIS_CACHE_KEY, context.getHandler()) ||
      Reflect.getMetadata(REDIS_CACHE_KEY, context.getClass());
    const redisEXSecond =
      Reflect.getMetadata(REDIS_CACHE_EX_SECOND_KEY, context.getHandler()) ||
      Reflect.getMetadata(REDIS_CACHE_EX_SECOND_KEY, context.getClass());


    if (isCacheApi) {
      console.log('走缓存');

      let redisKey = ''
      // 如果有授权拦截的且需要区分用户的时候

      if (request.body) {
        redisKey = await redisCacheKey(
          request.method,
          request.url,
          request.body,

        )
      } else {
        redisKey = await redisCacheKey(request.method, request.url);
      }

      console.log(redisKey, 'redisKey')
      const redisData = redisKey.length > 0 && await this.redisService.get(redisKey);
      if (redisData) {
        console.log(redisData, 'redis直接返回');
        return of(redisData);
      } else {
        console.log('走后端');
        return next.handle().pipe(
          map((data) => {
            redisKey.length > 0 && this.redisService.set(redisKey, data, redisEXSecond);
            return data;
          })
        );
      }
    } else {
      console.log('不走缓存');
      return next.handle();
    }
  }





}

