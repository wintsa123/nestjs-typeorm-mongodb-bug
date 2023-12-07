// StampRecordDetailEntity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { StampRecordEntity } from './StampRecord.entity';
import { Transform, TransformFnParams } from 'class-transformer';
import { ApplyDetailEntity } from './ApplyDetail.entity';

@Entity({ name: 'zhiyinDetail', database: 'nestapi' })
export class StampRecordDetailEntity {
    constructor(props: Partial<StampRecordDetailEntity>) {
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

    @Column({ type: 'varchar' , nullable: true})
    serialNumber?: string;

   

    @Column({  type: 'int' })
    sealId?: number;

    @Column({ type: 'varchar' })
    mac!: string;

    @Column({ type: 'int' })
    startNo?: number;

    @Column({  type: 'int' })
    stampNo?: number;

    @Column({  type: 'int' })
    stampMode?: number;

    @Column({  type: 'timestamp', nullable: true })
    stampTime?: Date;

 
    @ManyToOne(() => ApplyDetailEntity, applyDetail => applyDetail.details)
    apply?: ApplyDetailEntity;

  
   
}
