import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ZhiyinService } from './zhiyin.service';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { UpdateZhiyinDto } from './dto/update-zhiyin.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('zhiyin')
@Controller('zhiyin')
export class ZhiyinController {
  constructor(private readonly zhiyinService: ZhiyinService) {}

  @Post()
  create() {
    return this.zhiyinService.create();
  }

  @Get('/getToken')
  @ApiOperation({ summary: '获取豸印accessToken' })
  getToken() {
    return this.zhiyinService.getAssesstToken({});
  }

}
