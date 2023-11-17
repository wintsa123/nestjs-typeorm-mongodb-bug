import { PartialType, ApiProperty } from '@nestjs/swagger';

export class fileVerify extends PartialType(class {}) {
  @ApiProperty({ required: false })
  fileId!: string;
  @ApiProperty({ required: false })

  fileHash!:string
}

