import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WxchatService } from './wxchat.service';
import { WxchatDto } from './dto/wxchat.dto';
import { ApiTags } from '@nestjs/swagger';
import { RedisCacheApi } from '@src/decorators';

@ApiTags('wxchat')
@Controller('wxchat')
export class WxchatController {
  constructor(private readonly wxchatService: WxchatService) {}
  @Post()
  sendMsg(@Body() msg: WxchatDto) {
    return this.wxchatService.sendMessage(msg.msg);
  }


  @Get()
  getToken() {
    return this.wxchatService.getAssesstToken();
  }

}