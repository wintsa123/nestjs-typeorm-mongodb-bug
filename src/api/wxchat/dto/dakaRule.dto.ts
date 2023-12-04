import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
import {  ApiProperty } from '@nestjs/swagger';

export class dakaRule {
   
    @ApiProperty({ required: true })
    @IsNotEmpty()
    "datetime": string
   
    @ApiProperty({ required: false })
    "useridlist": string[]

}
