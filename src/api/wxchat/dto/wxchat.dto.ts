import { IsInt, IsMobilePhone, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';

export class WxchatDto {
    @IsNotEmpty({ message: '信息不能为空' })
    @IsOptional({ message: '发送信息' })
    msg!: string;

   


}
