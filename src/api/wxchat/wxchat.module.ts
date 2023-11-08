import { Module } from '@nestjs/common';
import { WxchatService } from './wxchat.service';
import { WxchatController } from './wxchat.controller';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    RouterModule.register([
      {
        path: '', // 指定项目名称
        module: WxchatModule,
      },
    ]),
  ],
  controllers: [WxchatController],
  providers: [WxchatService],
})
export class WxchatModule {}
