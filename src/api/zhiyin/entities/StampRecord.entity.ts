import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { baseEntity } from '@src/api/base.entity';
import { Transform, TransformFnParams } from 'class-transformer';
import { StampRecordDetailEntity } from './StampRecordDetail.entity';
import { ApplyDetailEntity } from './ApplyDetail.entity';
@Entity({ name: 'zhiyinrecord', database: 'nestapi' })
export class StampRecordEntity {
    constructor(props: Partial<StampRecordEntity>) {
        Object.assign(this, props);
      }
    @PrimaryColumn({
        type: 'int',
        name: 'id',
        comment: '主键id',
    })
    id!: number;
    

    @Column({  type: 'json', nullable: true })
    opStampRecordImages?: string;

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



    @Column({ type: 'varchar', nullable: true })
    facePhotoUrl?: string;

    @Column({ type: 'varchar', length: 255 })
    reason?: string;

    @Column({  type: 'int' })
    companyId?: number;

    @Column({  type: 'varchar' })
    companyName?: string;

    @Column({  type: 'int' })
    stampCount?: number;

    @Column({ type: 'double precision' })
    latitude?: number;

    @Column({ type: 'double precision' })
    longitude?: number;

    @Column({ type: 'varchar', length: 255 })
    address?: string;

    @Column({  type: 'int' })
    stampUser?: number;

    @Column({  type: 'varchar' })
    stampOpenUserId?: string;
    @Column({  type: 'varchar' ,nullable:true})
    stampOaUserName?: string;
    @Column({  type: 'boolean' })
    isSublicense?: boolean;

    @ManyToOne(() => ApplyDetailEntity, e => e.records)
    apply?: ApplyDetailEntity;
  

}