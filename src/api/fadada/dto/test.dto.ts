import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
export class TestDto {
    clientId!: string

    data?: any
      
}
