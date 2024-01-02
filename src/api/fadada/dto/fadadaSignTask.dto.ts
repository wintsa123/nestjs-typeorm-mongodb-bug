import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class SignTask {
    @ApiProperty({ required: true })
    // @IsNotEmpty()
    signTaskId!: string


}
