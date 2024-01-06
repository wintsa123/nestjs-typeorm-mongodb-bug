import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class setType {

    @ApiProperty({ description: 'id',required: true })
    id!: string
    @ApiProperty({ description: '',required: true })
    type!: string
    @ApiProperty({ description: '',required: false})
    organization?: string
}
