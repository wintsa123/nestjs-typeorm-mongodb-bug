import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ZhiyinService } from './zhiyin.service';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { pushDto } from './dto/push.dto';
import { callback } from './dto/callback.dto';

import { ApiBody, ApiOperation, ApiParam, ApiTags, } from '@nestjs/swagger';
import { query } from 'express';

@ApiTags('豸印')
@Controller('zhiyin')
export class ZhiyinController {
  constructor(private readonly zhiyinService: ZhiyinService) { }



  @Get('/getDriveList')
  @ApiOperation({ summary: '印章列表查询接口' })
  getDriveList() {
    return this.zhiyinService.getDriveList();
  }

  @Post('/push')
  @ApiOperation({ summary: 'OA审批单据推送接口', description: '供企业群体推送用印审批单据，用于在Saas平台驱动印章' })
  push(@Body() data: pushDto) {
    return this.zhiyinService.push(data);
  }
  @Get('/cancel')
  @ApiOperation({ summary: 'OA审批单据撤回', description: '供企业群体撤回已推送的用印审批单据，只支持撤回未使用盖章的单据撤回' })
  cancel(@Query() data: CreateZhiyinDto) {
    return this.zhiyinService.cancel(data.code);
  }
  @Get('/info')
  @ApiOperation({ summary: '盖章记录查询接口 ', description: '供企业群体查询已推送的用印审批单据的盖章记录数据' })
  info(@Query() data: CreateZhiyinDto) {
    return this.zhiyinService.info(data.code);
  }
  @Post('/callback')
  @ApiOperation({ summary: '回调地址' , description: 'OA系统推送的一条用印审批单据盖章完成之后，单据会进行关闭，此时会调用数据导出方法，并调用合作方的的回调接口将盖章记录推送回去。一条单据可能对应多条盖章记录，一条盖章记录可能对应多条盖章详情。比如一条要盖5个章的单据，第一次盖了两个章，第二次盖了三个章；那么返回值就是一条单据，对应两条盖章记录，第一条记录对应两条详情，第二条记录对应三条详情。'})
  @ApiBody({ type: callback }) 
  callback(
    @Body() data: callback,
  ) {
    // 方法体
    return this.zhiyinService.callback(data)
  }
  @Post('/userOpenIdCallback')
  @ApiOperation({ summary: '回调地址' , description: 'userOpenid回调'})
  userOpenIdCallback(
    @Body() Useropenid: string,
  ) {
    // 方法体
    return this.zhiyinService.userOpenIdCallback(Useropenid)
  }

}
