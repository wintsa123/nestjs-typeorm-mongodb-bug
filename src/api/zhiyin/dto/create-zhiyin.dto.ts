import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateZhiyinDto {


    @ApiProperty({ description: '单据编号(OA系统单据的唯一标识)',required: true })
    @IsNotEmpty()
    code!: string
}
