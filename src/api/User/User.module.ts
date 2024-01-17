import { Module } from '@nestjs/common';
import { UserService } from './User.service';
import { UserController } from './User.controller';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/User.entitu';

@Module({
  imports: [
    RouterModule.register([
      {
        path: '', // 指定项目名称
        module: UserModule,
      },
    ]),
    TypeOrmModule.forFeature([User]),

  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
