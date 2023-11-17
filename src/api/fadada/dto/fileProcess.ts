import { PartialType, ApiProperty } from '@nestjs/swagger';

export class FileProcess extends PartialType(class {}) {
  @ApiProperty({ type: 'array', items: { type: 'object', properties: {
    fileType: { type: 'string' },
    fddFileUrl: { type: 'string' },
    fileName: { type: 'string' },
    fileFormat: { type: 'string' },
  } }, required: false })
  fddFileUrlList!: FddFileUrl[];
}

interface FddFileUrl {
  /** 文件的用途类型: doc | attach */
  fileType: string;
  /** 法大大云存储中的源文件地址 */
  fddFileUrl: string;
  /** 指定文件名称，包含扩展名 */
  fileName: string;
  fileFormat?: string;
}
