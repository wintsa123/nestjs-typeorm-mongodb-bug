import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, Res } from '@nestjs/common';
import { WxchatService } from './wxchat.service';
import { WxchatDto } from './dto/wxchat.dto';
import { ApiTags } from '@nestjs/swagger';
import { RedisCacheApi } from '@src/decorators';
import { FastifyReply } from 'fastify';

@ApiTags('wxchat')
@Controller('wxchat')
export class WxchatController {
  constructor(private readonly wxchatService: WxchatService) { }
  @Post('/sendMessage')
  sendMsg(@Body() msg: WxchatDto) {
    return this.wxchatService.sendMessage(msg.msg);
  }


  @Get('/getToken')
  getToken() {
    return this.wxchatService.getAssesstToken();
  }

  @Get('/getMsg')
  validate(@Query('msg_signature') msg_signature: string, @Query('timestamp') timestamp: string, @Query('nonce') nonce: string, @Query('echostr') echostr: string) {
    return this.wxchatService.validate(msg_signature, timestamp, nonce, echostr);
  }
  @Post('/getMsg')
  async getMsg(@Body() data, @Query() query, @Res() res: FastifyReply) {
    let result = await this.wxchatService.getMsg(data, query);
    res.type('application/xml')
    res.code(200);
    res.send(result)
  }

}
