import { ApiProperty } from '@nestjs/swagger';

// ApplyDetailRequest DTO
export class ApplyDetailRequestDto {
  @ApiProperty({ type: 'integer', description: '申请单据的id，（豸印数据库中的单据表id）', required: true })
  id?: number;

  @ApiProperty({ type: 'string', description: '申请编码,20位', required: true })
  code?: string;

  @ApiProperty({ type: 'string', description: '用印编码', required: true })
  stampCode?: string;

  @ApiProperty({ type: 'string', description: '印章mac', required: true })
  mac?: string;

  @ApiProperty({ type: 'string', description: '用印事由', required: true })
  reason?: string;

  @ApiProperty({ type: 'integer', description: '申请次数', required: true })
  applyCount?: number;

  @ApiProperty({ type: 'integer', description: '剩余次数', required: true })
  availableCount?: number;

  @ApiProperty({ type: 'string', format: 'date', description: '失效时间', required: true })
  expireTIme?: Date;

  @ApiProperty({ type: 'boolean', description: '盖章拍照', required: true })
  stampPhotograph?: boolean;

  @ApiProperty({ type: 'boolean', description: '盖章采集人脸', required: true })
  facePhoto?: boolean;

  @ApiProperty({ type: 'boolean', description: 'ocr识别', required: true })
  ocrDistinguish?: boolean;

  @ApiProperty({ type: 'boolean', description: '印章识别', required: true })
  sealDistinguish?: boolean;

  @ApiProperty({ type: 'string', description: '申请拍照文件Url', required: true })
  applyPdfUrl?: string;

  @ApiProperty({ type: 'string', description: '盖章拍照文件Url', required: true })
  stampPdfUrl?: string;

  @ApiProperty({ type: 'string', description: 'ocr识别文件Url' })
  ocrPdfUrl?: string;

  @ApiProperty({ type: 'string', description: '用印人', required: true })
  stampUser?: string;

  @ApiProperty({ type: 'string', description: '创建人', required: true })
  createUser?: string;

  @ApiProperty({ type: 'array', items: { type: 'string' }, description: '拍照图片' })
  imageUrls?: string[];

  @ApiProperty({ type: 'array', items: { type: 'string' }, description: '附件' })
  fileUrls?: string[];
}



// StampRecord DTO
export class StampRecordDto {
  @ApiProperty({ type: 'integer', description: '记录id', required: true })
  id?: number;

  @ApiProperty({ type: 'string', description: '创建时间', required: true })
  createTime?: string;

  @ApiProperty({ type: 'string', description: '更新时间', required: true })
  updateTime?: string;

  @ApiProperty({ type: 'integer', description: '申请单据id', required: true })
  applyId?: number;

  @ApiProperty({ type: 'string', description: '人脸拍照图片URL', required: true })
  facePhotoUrl?: string;

  @ApiProperty({ type: 'string', description: '申请事由', required: true })
  reason?: string;

  @ApiProperty({ type: 'integer', description: '公司id', required: true })
  companyId?: number;

  @ApiProperty({ type: 'string', description: '公司名称', required: true })
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
    id: number = 0;
  
    @ApiProperty({ type: 'string', description: '序列号', required: true })
    serialNumber: string = '';
  
    @ApiProperty({ type: 'integer', description: '申请单据id', required: true })
    applyId: number = 0;
  
    @ApiProperty({ type: 'integer', description: '启动id', required: true })
    startId: number = 0;
  
    @ApiProperty({ type: 'string', description: '印章mac', required: true })
    mac: string = '';
  
    @ApiProperty({ type: 'integer', description: '启动序号', required: true })
    startNo: number = 0;
  
    @ApiProperty({ type: 'integer', description: '盖章序号', required: true })
    stampNo: number = 0;
  
    @ApiProperty({ type: 'string', description: '盖章时间', required: true })
    stampTime: string = '';
  }
  // StampRecordRequest DTO
export class StampRecordRequestDto {
    @ApiProperty({ type: 'integer', description: '盖章记录id', required: true })
    stamRecordId?: number;
  
    @ApiProperty({ type: 'object', description: 'StampRecord对象', required: true })
    opStampRecordBo?: StampRecordDto;
  
    @ApiProperty({ type: 'array', items: { type: 'object' }, description: '盖章详情列表', required: true })
    opStampRecordDetails?: StampRecordDetailDto[];
  
    @ApiProperty({ type: 'array', items: { type: 'string' }, description: '盖章记录图片list', required: true })
    opStampRecordImages?: string[];
  
    @ApiProperty({ type: 'boolean', description: '标记是否是本次盖章记录', required: true })
    currentFlag?: boolean;
  }

  export class callback {
    @ApiProperty({ type: ApplyDetailRequestDto })
    opApplyDetailRequest?: ApplyDetailRequestDto;
  
    @ApiProperty({ type: [StampRecordRequestDto] })  // 添加这一行
    opStampRecordRequest?: StampRecordRequestDto[];
  }
  