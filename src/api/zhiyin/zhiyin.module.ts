import { Module } from '@nestjs/common';
import { ZhiyinService } from './zhiyin.service';
import { ZhiyinController } from './zhiyin.controller';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    RouterModule.register([
      {
        path: '', // 指定项目名称
        module: ZhiyinModule,
      },
    ]),
  ],
  controllers: [ZhiyinController],
  providers: [ZhiyinService],
})
export class ZhiyinModule {}
