import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import internal from 'stream';
import { CreateZhiyinDto } from "./create-zhiyin.dto";

export class pushDto extends CreateZhiyinDto{
    

    @ApiProperty({  description: '印章mac',required: true})
    @IsNotEmpty()
    "mac": string

    @ApiProperty({ description: '用印事由', required: true })
    @IsNotEmpty()
    "reason": string

    @ApiProperty({ description: '申请次数',required: true })
    @IsNotEmpty()
    "applyCount": number

    @ApiProperty({ description: '失效时间（格式：yyyy-MM-dd HH:mm:ss）',required: true })
    @IsNotEmpty()
    "expireTime": string

    @ApiProperty({ description: '用印人(微信传手机号，企微传OpenUserID)',required: true })
    @IsNotEmpty()
    "stampUser": string

    @ApiProperty({ description: '申请人(微信传手机号，企微传OpenUserID)',required: true })
    @IsNotEmpty()
    "createUser": string
    @ApiProperty({ description: '盖章拍照（0：不拍照，1：拍照，默认0）',required: false })
    "stampPhotograph": internal
    @ApiProperty({ description: '盖章采集人脸（0：不采集，1：采集，默认0）',required: false })
    "facePhoto": internal

    @ApiProperty({description: 'ocr识别（0：不识别，1：识别，默认0）', required: false })
    "ocrDistinguish": internal
    @ApiProperty({ description: '印章识别（0：不识别，1：识别，默认0）',required: false })
    "sealDistinguish": internal

    @ApiProperty({description: '盖章记录回调地址', required: true })
    "callbackUrl": string

}
