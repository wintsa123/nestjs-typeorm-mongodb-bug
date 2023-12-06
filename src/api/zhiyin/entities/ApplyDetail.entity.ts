import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { baseEntity } from '@src/api/base.entity';
import { Transform, TransformFnParams } from 'class-transformer';
import { StampRecordDetailEntity } from './StampRecordDetail.entity';
import { StampRecordEntity } from './StampRecord.entity';

@Entity({ name: 'zhiyinVetting', database: 'nestapi' })

export class ApplyDetailEntity {
  constructor(props: Partial<ApplyDetailEntity>) {
    Object.assign(this, props);
  }
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id',
    comment: '主键id',
  })
  id!: number;
  @Transform((row: TransformFnParams) => +new Date(row.value))
  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'createTime',
    comment: '创建时间',
  })
  createTime!: Date;
  @Transform((row: TransformFnParams) => +new Date(row.value))
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'updateTime',
    comment: '更新时间',
  })
  updateTime!: Date;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({  type: 'varchar' })
  stampCode!: string;

  @Column({ type: 'int' })
  sealId!: number;

  @Column({ type: 'varchar' })
  mac!: string;

  @Column({  type: 'int' })
  companyId!: number;

  @Column({ type: 'varchar' })
  reason?: string;

  @Column({ type: 'varchar', nullable: true })
  fileName?: string;

  @Column({  type: 'varchar', nullable: true })
  fileType?: string;

  @Column({  type: 'varchar', nullable: true })
  fileNumber?: string;

  @Column({  type: 'varchar', nullable: true })
  fileUrl?: string;

  @Column({  type: 'int' })
  applyCount?: number;

  @Column({  type: 'int' })
  availableCount?: number;

  @Column({  type: 'timestamp', nullable: true })
  expireTime?: Date;

  @Column({  type: 'boolean' })
  stampPhotograph?: boolean;

  @Column({  type: 'boolean' })
  facePhoto?: boolean;

  @Column({  type: 'boolean' })
  ocrDistinguish?: boolean;

  @Column({  type: 'boolean' })
  sealDistinguish?: boolean;

  @Column({  type: 'int' })
  approvalStatus?: number;

  @Column({  type: 'varchar', nullable: true })
  applyPdfUrl?: string;

  @Column({  type: 'varchar', nullable: true })
  stampPdfUrl?: string;

  @Column({  type: 'varchar', nullable: true })
  ocrPdfUrl?: string;

  @Column({  type: 'int' })
  stampUser?: number;

  @Column({  type: 'varchar' })
  stampOpenUserId?: string;

  @Column({  type: 'int' })
  createUser?: number;

  @Column({  type: 'varchar' })
  createOpenUserId?: string;

  @Column({ type: 'json', nullable: true })
  imageUrls?: string[];

  @Column({ type: 'json', nullable: true })
  fileUrls?: string[];



  @OneToMany(() => StampRecordDetailEntity, stampRecordDetail => stampRecordDetail.apply)
  details?: StampRecordDetailEntity[];

  @OneToMany(() => StampRecordEntity, e => e.apply)
  records?: StampRecordEntity[];

}
