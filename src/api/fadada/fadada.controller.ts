import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FadadaService } from './fadada.service';
import { CreateFadadaDto } from './dto/create-fadada.dto';
import { UpdateFadadaDto } from './dto/update-fadada.dto';

@Controller('fadada')
export class FadadaController {
  constructor(private readonly fadadaService: FadadaService) {}

  @Post()
  create(
  ) {
    return this.fadadaService.create();
  }

  @Get()
  findAll() {
    return this.fadadaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fadadaService.findOne(+id);
  }

  

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fadadaService.delete(+id);
  }
}
