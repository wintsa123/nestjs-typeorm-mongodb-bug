import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
import {  ApiProperty } from '@nestjs/swagger';

export class daka {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    opencheckindatatype!: number
    @ApiProperty({ required: true })
    @IsNotEmpty()

    "starttime": string
    @ApiProperty({ required: true })
    @IsNotEmpty()
    "endtime": string
    @ApiProperty({ required: false })
    "useridlist": string[]

}
