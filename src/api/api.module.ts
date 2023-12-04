import { Module } from '@nestjs/common';
import { WxchatModule } from './wxchat/wxchat.module';
import { ZhiyinModule } from './zhiyin/zhiyin.module';
import { FadadaModule } from './fadada/fadada.module';
import { TmpRedisModule } from './tmp-redis/tmp-redis.module';

@Module({
  imports: [
    FadadaModule,
    WxchatModule,
    ZhiyinModule,
    TmpRedisModule
  ],
})
export class ApiModule {}
