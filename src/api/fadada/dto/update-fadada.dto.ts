import { PartialType } from '@nestjs/swagger';
import { CreateFadadaDto } from './create-fadada.dto';

export class UpdateFadadaDto extends PartialType(CreateFadadaDto) {}
