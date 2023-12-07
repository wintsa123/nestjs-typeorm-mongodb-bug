import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

// ApplyDetailRequest DTO
export class ApplyDetailRequestDto {
  @ApiProperty({ type: 'integer', description: '申请单据的id，（豸印数据库中的单据表id）', required: true })
  @IsNotEmpty()
  id?: number;

  @ApiProperty({ type: 'string', description: '申请编码,20位', maxLength: 20, required: true })
  @IsNotEmpty()
  code?: string;
  @ApiProperty({ type: 'string', description: '创建时间', required: false })
  createTime?: string;
  @ApiProperty({ type: 'string', description: '用印编码', required: true })
  @IsNotEmpty()
  stampCode?: string;

  @ApiProperty({ type: 'string', description: '印章mac', required: true })
  @IsNotEmpty()
  mac?: string;

  @ApiProperty({ type: 'string', description: '用印事由', required: false })
  reason?: string;
  @ApiProperty({ type: 'integer', required: false })
  sealId?: number;
  @ApiProperty({ type: 'integer', description: '申请次数', required: true })
  @IsNotEmpty()
  applyCount?: number;

  @ApiProperty({ type: 'integer', description: '剩余次数', required: true })
  @IsNotEmpty()
  availableCount?: number;

  @ApiProperty({ type: 'string', format: 'date', description: '失效时间', required: true })
  @IsNotEmpty()
  expireTIme?: Date;

  @ApiProperty({ type: 'boolean', description: '盖章拍照', required: false })
  stampPhotograph?: boolean;

  @ApiProperty({ type: 'boolean', description: '盖章采集人脸', required: false })
  facePhoto?: boolean;

  @ApiProperty({ type: 'boolean', description: 'ocr识别', required: false })
  ocrDistinguish?: boolean;

  @ApiProperty({ type: 'boolean', description: '印章识别', required: false })
  sealDistinguish?: boolean;

  @ApiProperty({ type: 'string', description: '申请拍照文件Url', required: false })
  applyPdfUrl?: string;

  @ApiProperty({ type: 'string', description: '盖章拍照文件Url', required: false })
  stampPdfUrl?: string;

  @ApiProperty({ type: 'string', description: 'ocr识别文件Url', required: false })
  ocrPdfUrl?: string;

  @ApiProperty({ type: 'string', description: '用印人', required: true })
  @IsNotEmpty()
  stampOpenUserId?: string;

  @ApiProperty({ type: 'string', description: '创建人', required: true })
  @IsNotEmpty()
  createOpenUserId?: string;

  @ApiProperty({ type: 'array', items: { type: 'string' }, description: '拍照图片', required: false })
  imageUrls?: string[];

  @ApiProperty({ type: 'array', items: { type: 'string' }, description: '附件', required: false })
  fileUrls?: string[];
}



// StampRecord DTO
export class StampRecordDto {
  @ApiProperty({ type: 'integer', description: '记录id', required: true })
  @IsNotEmpty()
  id?: number;

  @ApiProperty({ type: 'string', description: '创建时间', required: true })
  @IsNotEmpty()
  createTime?: string;

  @ApiProperty({ type: 'string', description: '更新时间', required: false })
  updateTime?: string;



  @ApiProperty({ type: 'string', description: '人脸拍照图片URL', required: false })
  facePhotoUrl?: string;

  @ApiProperty({ type: 'string', description: '申请事由', required: false })
  reason?: string;

  @ApiProperty({ type: 'integer', description: '公司id', required: true })
  @IsNotEmpty()
  companyId?: number;

  @ApiProperty({ type: 'string', description: '公司名称', required: true })
  @IsNotEmpty()
  companyName?: string;

  @ApiProperty({ type: 'integer', description: '盖章次数', required: true })
  stampCount?: number;

  @ApiProperty({ type: 'number', format: 'double', description: '维度', required: true })
  latitude?: number;

  @ApiProperty({ type: 'number', format: 'double', description: '经度', required: true })
  longitude?: number;

  @ApiProperty({ type: 'number', format: 'double', description: '地址', required: true })
  address?: number;
}

// StampRecordDetail DTO
export class StampRecordDetailDto {
  @ApiProperty({ type: 'integer', description: '主键', required: true })
  @IsNotEmpty()
  id?: number;

  @ApiProperty({ type: 'string', description: '序列号', required: false })
  serialNumber?: string;

  @ApiProperty({ type: 'integer', description: '启动id', required: true })
  startId?: number;

  @ApiProperty({ type: 'string', description: '印章mac', required: true })
  @IsNotEmpty()
  mac? : string;

  @ApiProperty({ type: 'integer', description: '启动序号', required: false })
  startNo? :number;

  @ApiProperty({ type: 'integer', description: '盖章序号', required: false })
  stampNo? :number;

  @ApiProperty({ type: 'string', description: '盖章时间', required: true })
    @IsNotEmpty()

  stampTime? :string;
}
// StampRecordRequest DTO
export class StampRecordRequestDto {
  // @ApiProperty({ type: 'integer', description: '盖章记录id', required: false })
  // stamRecordId?: number;

  @ApiProperty({ type: 'object', description: 'StampRecord对象', required: true })
  opStampRecordBo?: StampRecordDto;

  @ApiProperty({ type: 'array', items: { type: 'object' }, description: '盖章详情列表', required: true })
  opStampRecordDetails?: StampRecordDetailDto[];

  @ApiProperty({ type: 'array', items: { type: 'string' }, description: '盖章记录图片list', required: false })
  opStampRecordImages?: string[];

  @ApiProperty({ type: 'boolean', description: '标记是否是本次盖章记录', required: false })
  currentFlag?: boolean;
}

export class callback {
  @ApiProperty({ type: ApplyDetailRequestDto, required: true })
  opApplyDetailRequest?: ApplyDetailRequestDto;

  @ApiProperty({ type: [StampRecordRequestDto], required: true })  // 添加这一行
  opStampRecordRequest?: StampRecordRequestDto[];
}
