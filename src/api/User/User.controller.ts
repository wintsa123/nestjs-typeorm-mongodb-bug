import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserService } from './User.service';
import { UserCreatDto } from './dto/create-User.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, } from '@nestjs/swagger';
import { query } from 'express';
import { ipWhitelist } from '@src/guard/ip.guard';

@ApiTags('用户')
@Controller('User')
// @ApiResponse({status : 200,description:'成功'})

export class UserController {
  constructor(private readonly UserService: UserService) { }



  @Post('/rigster')
  @ApiOperation({ summary: '用户注册' })
  register(@Body()data:UserCreatDto) {
    return this.UserService.register(data);
  }

}
