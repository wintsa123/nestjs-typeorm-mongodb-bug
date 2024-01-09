import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, PrimaryColumn, DeleteDateColumn } from 'typeorm';
import { baseEntity } from '@src/api/base.entity';
import { Transform, TransformFnParams } from 'class-transformer';
import { StampRecordDetailEntity } from './StampRecordDetail.entity';
import { StampRecordEntity } from './StampRecord.entity';

@Entity({ name: 'zhiyinvetting', database: 'nestapi' })

export class notApproval {
  constructor(props: Partial<notApproval>) {
    Object.assign(this, props);
  }
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id',
    comment: '主键id',
  })
  id?: number;
  @Transform((row: TransformFnParams) => +new Date(row.value))
  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'createTime',
    comment: '创建时间',
  })
  createTime?: Date;
  @Transform((row: TransformFnParams) => +new Date(row.value))
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'updateTime',
    comment: '更新时间',
  })
  updateTime?: Date;
  @Transform((row: TransformFnParams) => +new Date(row.value))
  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
    name: 'deleteTime',
    comment: '删除时间',
  })
  deleteTime?: Date;




  @Column({ type: 'varchar',nullable:true })
  mac?: string;


  @Column({  type: 'int',nullable:true })
  companyId?: number;

  @Column({ type: 'varchar',nullable:true })
  reason?: string;

  @Column({ type: 'varchar', nullable: true })
  fileName?: string;

  @Column({  type: 'varchar', nullable: true })
  fileType?: string;

  @Column({  type: 'varchar', nullable: true })
  fileNumber?: string;

  @Column({  type: 'varchar', nullable: true })
  fileUrl?: string;

  @Column({  type: 'int',nullable:true })
  applyCount?: number;

  @Column({  type: 'int',nullable:true })
  availableCount?: number;

  

  @Column({  type: 'boolean',nullable:true })
  stampPhotograph?: boolean;

  @Column({  type: 'boolean',nullable:true })
  facePhoto?: boolean;

  @Column({  type: 'boolean',nullable:true })
  ocrDistinguish?: boolean;

  @Column({  type: 'boolean',nullable:true })
  sealDistinguish?: boolean;

  @Column({  type: 'int',nullable:true })
  approvalStatus?: number;

  @Column({  type: 'varchar', nullable: true })
  applyPdfUrl?: string;

  @Column({  type: 'varchar', nullable: true })
  stampPdfUrl?: string;

  @Column({  type: 'varchar', nullable: true })
  ocrPdfUrl?: string;

  @Column({  type: 'int',nullable:true })
  stampUser?: number;

  @Column({  type: 'varchar',nullable:true })
  stampOpenUserId?: string;

 
  
  @Column({  type: 'varchar',nullable:true })
  stampOaUserId?: string;

  

  @Column({ type: 'json', nullable: true})
  imageUrls?: string[];

  @Column({ type: 'json', nullable: true })
  fileUrls?: string[];



  @OneToMany(() => StampRecordDetailEntity, stampRecordDetail => stampRecordDetail.apply,{cascade:false})
  details?: StampRecordDetailEntity[];

  @OneToMany(() => StampRecordEntity, e => e.apply,{cascade:false})
  records?: StampRecordEntity[];

}
