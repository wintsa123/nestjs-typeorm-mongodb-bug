import { ClassSerializerInterceptor, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { HttpExceptionFilter } from './filters/http-exception.filter';
import {
  LoggerInterceptor,
  RedisCacheInterceptor,
  RedisLimitInterceptor,
  ApiInterceptor,
} from './interceptors';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ValidationPipe } from './pipe/validation.pipe';
import { getConfig } from './utils';
import { ApiModule } from './api/api.module';
import { PluginModule } from './plugin/plugin.module';
import { TasksService } from './corn/robot';
import { WxchatService } from './api/wxchat/wxchat.service';
import { SocketModule } from './socket/socket.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false, // 忽视默认读取.env的文件配置
      isGlobal: true, // 全局注入
      load: [getConfig], // 加载配置文件
    }),
    // mysql的连接
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => (
        {
        type: 'mysql',
        name: "default",
        host: String(configService.get('datasource.host')),
        port: Number.parseInt(configService.get('datasource.port') ?? '3306'),
        username: String(configService.get('datasource.username')),
        password: String(configService.get('datasource.password')),
        database: String(configService.get('datasource.database')),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        logging: configService.get('datasource.logging'),
        timezone: '+08:00', // 东八区
        autoLoadEntities: true, // 每个通过forFeature()注册的实体都会自动添加到配置对象的entities数组中
        // synchronize:true,
        cache: {
          duration: 60000, // 1分钟的缓存
        },
      }
      ),
    }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'oracle',
    //     name: 'oracle', // 连接名称
    //     host: "192.168.2.222",
    //     username: String(configService.get('datasourceOracle.username')),
    //     password: String(configService.get('datasourceOracle.password')),
    //     port: Number(configService.get('datasourceOracle.port')),
    //     sid: String(configService.get('datasourceOracle.sid')),
    //     synchronize: false,
    //     extra: {
    //       poolMax: 40,
    //       poolMin: 20,
    //     },
    //     entities: [__dirname + '/**/*.ORLentity{.ts,.js}'],
    //     logging: configService.get('datasourceOracle.logging'),
    //     cache: {
    //       duration: 60000, // 1分钟的缓存
    //     },
    //   }),
    // }),
    ScheduleModule.forRoot(),
    ApiModule,
    PluginModule,
    SocketModule,
  ],
  providers: [
    Logger, TasksService, WxchatService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RedisLimitInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RedisCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiInterceptor,
    },
    // 全局使用管道(数据校验)
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // 全局使用过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule { }
