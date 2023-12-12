import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, Res, Header, HttpCode } from '@nestjs/common';
import { WxchatService } from './wxchat.service';
import { WxchatDto } from './dto/wxchat.dto';
import { daka } from './dto/daka.dto';

import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RedisCacheApi } from '@src/decorators';
import { FastifyReply } from 'fastify';
import { dakaRule } from './dto/dakaRule.dto';

@ApiTags('企业微信')
@Controller('wxchat')

export class WxchatController {
  constructor(private readonly wxchatService: WxchatService) { }
  @Post('/sendMessage')
  @ApiOperation({ summary: '调用该接口可主动发信息通过应用' })

  sendMsg(@Body() msg: WxchatDto) {

    return this.wxchatService.sendMessage(msg.msg);
  }

  @Get('/getUserid')
  @ApiOperation({ summary: '调用该接口可获取userid' })
  getUserid( @Query('id') id:string[],@Query('agentid') agentid:number) {
    return this.wxchatService.getUserid(id,agentid);
  }
  @Get('/test')
  @ApiOperation({ summary: '调用该接口可获取userid' })
  test( @Query('id') id:string[]) {
    return this.wxchatService.test(id);
  }
  @Get('/getToken')
  @ApiOperation({ summary: '获取微信accessToken' })
  getToken() {
    return this.wxchatService.getAssesstToken();
  }

  @Get('/getMsg')
  @ApiOperation({ summary: '应用验证接口' })
  validate(@Query('msg_signature') msg_signature: string, @Query('timestamp') timestamp: string, @Query('nonce') nonce: string, @Query('echostr') echostr: string) {
    return this.wxchatService.validate(msg_signature, timestamp, nonce, echostr);
  }

  @Post('/getMsg')
  @ApiOperation({ summary: '获取应用信息并返回信息' })
  @Header('Content-Type', 'application/xml')
  @HttpCode(200)
  async getMsg(@Body() data, @Query() query) {
    return this.wxchatService.getMsg(data, query)
  }

  @Post('/getDakaData')
  @ApiOperation({ summary: '获取打卡数据' })
  async getDakaData(@Body() data: daka) {
    return this.wxchatService.getDakaData(data)
  }
  
  @Post('/getcorpcheckinoption')
  @ApiOperation({ summary: '获取打卡所有规则' })
  async getcorpcheckinoption() {
    return this.wxchatService.getcorpcheckinoption()
  }
  @Post('/getcheckinoption')
  @ApiOperation({ summary: '获取打卡员工规则' })
  async getcheckinoption(@Body() data: dakaRule) {
    return this.wxchatService.getcheckinoption(data)
  }
}
