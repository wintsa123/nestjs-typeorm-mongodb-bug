import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, BeforeUpdate, Index, PrimaryColumn } from 'typeorm';
import { Transform, TransformFnParams } from 'class-transformer';
import { baseEntity } from '@src/api/base.entity';

@Entity({ name: 'zhiyinuserid', database: 'nestapi' })
@Index(["userid", "userOpenid"], { unique: true })
export class zhiyinuserid  {
    @PrimaryColumn({
        type: 'int',
        name: 'id',
        comment: '主键id',
    })
    id!: number;
    @Column({ type: 'varchar' })
    userid?: string;
    @Column({ type: 'varchar' })
    userOpenid?: string;
    @Column({ type: 'varchar' })
    name?: string;
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


}
