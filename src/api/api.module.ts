import { Module } from '@nestjs/common';
import { UserModule } from './User/User.module';
import { TmpRedisModule } from './tmp-redis/tmp-redis.module';

@Module({
  imports: [
    UserModule,
    TmpRedisModule
  ],
})
export class ApiModule {}
