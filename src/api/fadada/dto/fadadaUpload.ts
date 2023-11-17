
import { PartialType,ApiProperty  } from '@nestjs/swagger';
import { CreateFadadaDto } from './create-fadada.dto';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
export class UploadFadadaDto extends PartialType(class{}) {
    @ApiProperty({ required: false })
    @IsNotEmpty()
    fileType!: string;

}
