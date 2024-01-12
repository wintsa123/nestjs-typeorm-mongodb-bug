import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
export class report {
    id!:string
    signTaskId!: string

    reportType?: string
      
}
