import { PartialType } from '@nestjs/swagger';
import { CreateFadadaDto } from './create-fadada.dto';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
export class UpdateFadadaDto extends PartialType(CreateFadadaDto) {
    @MaxLength(60, { message: '个人用户的法大大帐号，仅限手机号或邮箱，长度最大60个字符。如该手机号或邮箱未注册法大大，则用户会以此作为注册账号。当用户accountName与mobile传相同手机号，同时设置认证方式为手机号认证，用户打开链接后只需输入一次验证码即可完成认证和授权。' })
    accountName?: string
    unbindAccount?: boolean
    redirectUrl?: string
    redirectMiniAppUrl?: string
}
