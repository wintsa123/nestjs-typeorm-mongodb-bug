import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ZhiyinService } from './zhiyin.service';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { UpdateZhiyinDto } from './dto/update-zhiyin.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('zhiyin')
@Controller('zhiyin')
export class ZhiyinController {
  constructor(private readonly zhiyinService: ZhiyinService) {}

  @Post()
  create() {
    return this.zhiyinService.create();
  }

  @Get()
  findAll() {
    return this.zhiyinService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zhiyinService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.zhiyinService.update(+id );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zhiyinService.remove(+id);
  }
}
