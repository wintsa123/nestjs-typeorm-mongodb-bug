import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common/enums';
import { Logger } from '@nestjs/common/services';
import { AppModule } from './app.module';
import { getConfig, IS_DEV } from './utils';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { fastifyHelmet } from '@fastify/helmet';
import { fastifyStatic } from '@fastify/static';
import * as fastifyXmlBody from 'fastify-xml-body-parser';

import fastifyCsrf from 'fastify-csrf';
import fastifyCookie from '@fastify/cookie';


export const config = getConfig();
const PORT = config.PORT || 9089;
const PREFIX = config.PREFIX || '/';
async function bootstrap() {
  const logger: Logger = new Logger('main.ts');

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }), {
    logger: IS_DEV ? ['log', 'debug', 'error', 'warn'] : ['error', 'warn'],
  });
  app.enableCors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    "credentials": true,
    allowedHeaders: '*', // 允许所有的请求头
    exposedHeaders: '*', // 允许所有的响应头
  });
  // 启动版本管理
  app.enableVersioning({
    defaultVersion: '1', // 不指定默认版本为v1
    type: VersioningType.URI,
  });
  app.register(fastifyStatic, {
    root: join(__dirname, 'public'),
    prefix: '/', // optional: default '/'
  })
  app.register(fastifyXmlBody);

  app.register(fastifyCookie, {
    secret: 'zw', // for cookies signature
  });
  app.register(
    fastifyHelmet,
    {
      contentSecurityPolicy: false,

    },

  )
  app.register(fastifyCsrf);
  // 给请求添加prefix

  app.setGlobalPrefix(PREFIX);
 

  const config = new DocumentBuilder()
    .setTitle('Api example')
    .setDescription('临时接口调试')
    .setVersion('1.0')
      .setLicense('Apache 2.0', 'http://www.apache.org/licenses/LICENSE-2.0.html')

    .build();

    

  const fastifyInstance = app.getHttpAdapter().getInstance();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      plugins: [
        {
          // 启用导出插件
          'export-to': {}
        },
      ],
    },
  });

  await app.listen(PORT, '0.0.0.0', () => {
    logger.log(`服务已经启动,接口请访问:http://wwww.localhost:${PORT}/${PREFIX}`);
  });

}
// async function bootstrap() {
//   const logger: Logger = new Logger('main.ts');
//   //暂时关闭了api接口
// const app = await NestFactory.create( AppModule , {
//   // 开启日志级别打印
//   logger: IS_DEV ? ['log', 'debug', 'error', 'warn'] : ['error', 'warn'],
// });
//   //允许跨域请求
//   app.enableCors();
//   // 启动版本管理
//   app.enableVersioning({
//     defaultVersion: '1', // 不指定默认版本为v1
//     type: VersioningType.URI,
//   });

//   // 给请求添加prefix
//   app.setGlobalPrefix(PREFIX);
//   await app.listen(PORT, () => {
//     logger.log(`服务已经启动,接口请访问:http://wwww.localhost:${PORT}/${PREFIX}`);
//   });
// }
bootstrap();
