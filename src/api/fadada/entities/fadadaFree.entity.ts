import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryColumn } from 'typeorm';
import { baseEntity } from '@src/api/base.entity';
import { Transform, TransformFnParams } from 'class-transformer';

@Entity({ name: 'fadadafree', database: 'nestapi' })

export class fadadafree {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'id',
    comment: '主键id',
  })
  id!: number;
  @Column()


  clientUserId!: number;

  @Transform((row: TransformFnParams) => +new Date(row.value))
  @Column()
  eventTime!: string;
  @Transform((row: TransformFnParams) => +new Date(row.value))
  @Column()
  expiresTime?: string;
  @Transform((row: TransformFnParams) => +new Date(row.value))
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt!: Date;
  @DeleteDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'deleted_at',
    select: false,
    comment: '软删除时间',
    default: null,
  })
  deletedAt!: Date | null;


  @Column()
  openUserId!: string;
  @Column()
  sealId!: string;
  @Column()
  businessId!: string;

}
