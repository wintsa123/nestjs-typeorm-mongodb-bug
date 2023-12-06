import { ApiProperty } from '@nestjs/swagger';

// ApplyDetailRequest DTO
export class ApplyDetailRequestDto {
  @ApiProperty({ type: 'integer', description: '申请单据的id，（豸印数据库中的单据表id）', required: false })
  id?: number;

  @ApiProperty({ type: 'string', description: '申请编码,20位', required: false })
  code?: string;

  @ApiProperty({ type: 'string', description: '用印编码', required: false })
  stampCode?: string;

  @ApiProperty({ type: 'string', description: '印章mac', required: false })
  mac?: string;

  @ApiProperty({ type: 'string', description: '用印事由', required: false })
  reason?: string;

  @ApiProperty({ type: 'integer', description: '申请次数', required: false })
  applyCount?: number;

  @ApiProperty({ type: 'integer', description: '剩余次数', required: false })
  availableCount?: number;

  @ApiProperty({ type: 'string', format: 'date', description: '失效时间', required: false })
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

  @ApiProperty({ type: 'string', description: 'ocr识别文件Url' })
  ocrPdfUrl?: string;

  @ApiProperty({ type: 'string', description: '用印人', required: false })
  stampUser?: string;

  @ApiProperty({ type: 'string', description: '创建人', required: false })
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

  @ApiProperty({ type: 'string', description: '创建时间', required: false })
  createTime?: string;

  @ApiProperty({ type: 'string', description: '更新时间', required: false })
  updateTime?: string;

  @ApiProperty({ type: 'integer', description: '申请单据id', required: false })
  applyId?: number;

  @ApiProperty({ type: 'string', description: '人脸拍照图片URL', required: false })
  facePhotoUrl?: string;

  @ApiProperty({ type: 'string', description: '申请事由', required: false })
  reason?: string;

  @ApiProperty({ type: 'integer', description: '公司id', required: false })
  companyId?: number;

  @ApiProperty({ type: 'string', description: '公司名称', required: false })
  companyName?: string;

  @ApiProperty({ type: 'integer', description: '盖章次数', required: false })
  stampCount?: number;

  @ApiProperty({ type: 'number', format: 'double', description: '维度', required: false })
  latitude?: number;

  @ApiProperty({ type: 'number', format: 'double', description: '经度', required: false })
  longitude?: number;

  @ApiProperty({ type: 'number', format: 'double', description: '地址', required: false })
  address?: number;
}

// StampRecordDetail DTO
export class StampRecordDetailDto {
    @ApiProperty({ type: 'integer', description: '主键', required: true })
    id: number = 0;
  
    @ApiProperty({ type: 'string', description: '序列号', required: false })
    serialNumber: string = '';
  
    @ApiProperty({ type: 'integer', description: '申请单据id', required: false })
    applyId: number = 0;
  
    @ApiProperty({ type: 'integer', description: '启动id', required: false })
    startId: number = 0;
  
    @ApiProperty({ type: 'string', description: '印章mac', required: false })
    mac: string = '';
  
    @ApiProperty({ type: 'integer', description: '启动序号', required: false })
    startNo: number = 0;
  
    @ApiProperty({ type: 'integer', description: '盖章序号', required: false })
    stampNo: number = 0;
  
    @ApiProperty({ type: 'string', description: '盖章时间', required: false })
    stampTime: string = '';
  }
  // StampRecordRequest DTO
export class StampRecordRequestDto {
    @ApiProperty({ type: 'integer', description: '盖章记录id', required: false })
    stamRecordId?: number;
  
    @ApiProperty({ type: 'object', description: 'StampRecord对象', required: false })
    opStampRecordBo?: StampRecordDto;
  
    @ApiProperty({ type: 'array', items: { type: 'object' }, description: '盖章详情列表', required: false })
    opStampRecordDetails?: StampRecordDetailDto[];
  
    @ApiProperty({ type: 'array', items: { type: 'string' }, description: '盖章记录图片list', required: false })
    opStampRecordImages?: string[];
  
    @ApiProperty({ type: 'boolean', description: '标记是否是本次盖章记录', required: false })
    currentFlag?: boolean;
  }

  export class callback {
    @ApiProperty({ type: ApplyDetailRequestDto })
    opApplyDetailRequest?: ApplyDetailRequestDto;
  
    @ApiProperty({ type: [StampRecordRequestDto] })  // 添加这一行
    opStampRecordRequest?: StampRecordRequestDto[];
  }
  