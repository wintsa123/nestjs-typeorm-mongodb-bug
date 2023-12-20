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
import { generateCacheKey } from '@src/utils';

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
        console.log('有body')

        console.log(request.method)
        redisKey = await this.redisCacheKey(
          request.method,
          request.url,
          request.body,

        )
        console.log(redisKey, 'body')

      }else{
        this.redisCacheKey(request.method, request.url);
      }

      console.log(redisKey, 'redisKey')
      const redisData = await this.redisService.get(redisKey);
      if (redisData) {
        console.log(redisData, 'redis直接返回');
        return of(redisData);
      } else {
        console.log('走后端');
        return next.handle().pipe(
          map((data) => {
            this.redisService.set(redisKey, data, redisEXSecond);
            return data;
          })
        );
      }
    } else {
      console.log('不走缓存');
      return next.handle();
    }
  }

  /**
   * @Author: 水痕
   * @Date: 2022-08-12 22:23:43
   * @LastEditors: 水痕
   * @Description: 自定义redis的key
   * @param {string} method 请求方式
   * @param {string} url url地址
   * @param {string} identity 身份
   * @return {*}
   */
  private redisCacheKey(method: string, url: string): string;
  private redisCacheKey(method: string, url: string, body: any): string;
  private redisCacheKey(method: string, url: string, body?: any): string {
    console.log(method, 'method')

    if (method == 'GET') {
      return `${method}:${url}`;
    } if (method == 'POST') {
      console.log(body, 'body')
      if (body !== undefined  &&body !== null) {
        const hash = generateCacheKey(body)
        console.log(hash, 'hash')
        return `${method}:${hash}`;
      } else {
        return `${method}:${url}`;

      }

    } else {
      return `${method}:${url}`;
    }
  }
}

