import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ZhiyinService } from './zhiyin.service';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { pushDto } from './dto/push.dto';
import { ApiBody, ApiOperation, ApiParam, ApiTags, } from '@nestjs/swagger';
import { query } from 'express';
@ApiTags('zhiyin')
@Controller('zhiyin')
export class ZhiyinController {
  constructor(private readonly zhiyinService: ZhiyinService) {}

  

  @Get('/getDriveList')
  @ApiOperation({ summary: '印章列表查询接口'})
  getDriveList() {
    return this.zhiyinService.getDriveList();
  }

  @Post('/push')
  @ApiOperation({ summary: 'OA审批单据推送接口',description:'供企业群体推送用印审批单据，用于在Saas平台驱动印章'  })

 push(@Body()data :pushDto) {
    return this.zhiyinService.push(data);
  }

}
