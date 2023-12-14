import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { baseEntity } from '@src/api/base.entity';
import { Transform, TransformFnParams } from 'class-transformer';

@Entity({ name: 'fadadafree', database: 'nestapi' }) 

export class fadadafree  {
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
        name: 'eventTime',
        comment: '创建时间',
      })
      eventTime!: Date;
    
      @Transform((row: TransformFnParams) => +new Date(row.value))
      @Column({
        type: 'timestamp',
        nullable: true,
        name: 'expiresTime',
        comment: '过期时间',
      })
      expiresTime!: Date;
    
      @DeleteDateColumn({
        type: 'timestamp',
        nullable: false,
        name: 'deleted_at',
        select: false,
        comment: '软删除时间',
        default: null,
      })
      deletedAt!: Date | null;
    @Column({ unique: true }) // 设置唯一性约束，确保 clientUserId 是唯一的
    clientUserId!: string;

    @Column()
    openUserId!: string;
    @Column()
    sealId!: string;
    @Column()
    businessId!: string;

}
