import { Module } from '@nestjs/common';
import { ZhiyinService } from './zhiyin.service';
import { ZhiyinController } from './zhiyin.controller';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplyDetailEntity } from './entities/ApplyDetail.entity';
import { StampRecordEntity } from './entities/StampRecord.entity';
import { StampRecordDetailEntity } from './entities/StampRecordDetail.entity';
import { devicesEntity } from './entities/deviceList.entity';
import { WxchatService } from '../wxchat/wxchat.service';

@Module({
  imports: [
    RouterModule.register([
      {
        path: '', // 指定项目名称
        module: ZhiyinModule,
      },
    ]),
    TypeOrmModule.forFeature([ApplyDetailEntity,StampRecordEntity,StampRecordDetailEntity,devicesEntity]),

  ],
  controllers: [ZhiyinController],
  providers: [ZhiyinService,WxchatService],
})
export class ZhiyinModule {}
