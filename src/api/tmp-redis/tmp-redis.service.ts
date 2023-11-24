import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@src/plugin/redis/redis.service';

@Injectable()
export class TmpRedisService {
    private readonly logger = new Logger(TmpRedisService.name);

    constructor(
        private readonly redisService: RedisService,

    ) { }
    /**
     * @Author: wintsa
     * @Date: 2023-11-24 10:15:57
     * @LastEditors: wintsa
     * @Description: 清除所有缓存
     * @return {*}
     */
    async cleanAll() {
        this.redisService.flushall()
    }
}
