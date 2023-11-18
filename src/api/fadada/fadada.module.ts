import { Module } from '@nestjs/common';
import { FadadaService } from './fadada.service';
import { FadadaController } from './fadada.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fadada } from './entities/fadada.entity';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [RouterModule.register([
    {
      path: '', // 指定项目名称
      module: FadadaModule,
    },
  ]), TypeOrmModule.forFeature([Fadada]),
  ],
  controllers: [FadadaController],
  providers: [FadadaService],
})
export class FadadaModule { }
