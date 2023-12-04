import { PartialType } from '@nestjs/swagger';
import { CreateZhiyinDto } from './create-zhiyin.dto';

export class UpdateZhiyinDto extends PartialType(CreateZhiyinDto) {}
