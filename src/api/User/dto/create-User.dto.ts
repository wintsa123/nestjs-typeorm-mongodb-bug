import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { UserBaseDto } from "./UserBase.dto";
import { IsEmail, IsPhoneNumber } from 'class-validator';

export class UserCreatDto extends UserBaseDto{
    @ApiProperty({ description: '密码',required: true})
    @IsNotEmpty()
    password!: string
    @ApiProperty({ description: '手机号',required: false})
    @IsNotEmpty()
    @IsPhoneNumber()
    phone!: string
}
