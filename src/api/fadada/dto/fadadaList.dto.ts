import { PartialType, ApiProperty } from '@nestjs/swagger';

export class fadadaList extends PartialType(class { }) {
    @ApiProperty({
        type: 'object', properties: {
            idType: { type: 'string' },
            openId: { type: 'string' },

        }, required: true
    })
    ownerId!: OpenId[];
}

interface OpenId {
    /** 文件的用途类型: doc | attach */
    idType: string;
    /** 法大大云存储中的源文件地址 */
    openId: string;

}
