import { Module } from '@nestjs/common';
import { TmpRedisService } from './tmp-redis.service';
import { TmpRedisController } from './tmp-redis.controller';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    RouterModule.register([
      {
        path: '', // 指定项目名称
        module: TmpRedisModule,
      },
    ]),
  ],
  controllers: [TmpRedisController],
  providers: [TmpRedisService],
})
export class TmpRedisModule {}
