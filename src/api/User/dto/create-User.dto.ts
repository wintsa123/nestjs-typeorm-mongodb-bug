import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Length } from "class-validator";
import { UserBaseDto } from "./UserBase.dto";
import { IsEmail, IsPhoneNumber } from 'class-validator';

export class UserCreatDto extends UserBaseDto {
    @ApiProperty({ description: '密码', required: true })
    @IsNotEmpty()
    @Length(6, 20, { message: '密码请输入6到20位长度' })
    password!: string
    @ApiProperty({ description: '手机号', required: false })
    @IsNotEmpty()
    @IsPhoneNumber('CN', { message: '错误的手机号' }) // 使用 IsPhoneNumber 验证手机号
    phone!: string
}
