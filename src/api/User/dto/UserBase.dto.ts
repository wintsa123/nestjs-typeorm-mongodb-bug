import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class UserBaseDto  {
    @ApiProperty({ description: '用户名',required: true })
    @IsNotEmpty()
    name!: string
   
}
