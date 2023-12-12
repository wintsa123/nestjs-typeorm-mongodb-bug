import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, BeforeUpdate } from 'typeorm';
import { Transform, TransformFnParams } from 'class-transformer';
import { baseEntity } from '@src/api/base.entity';

@Entity({ name: 'zhiyinuserid', database: 'nestapi' })
export class zhiyinuserid extends baseEntity {
    @Column({ type: 'varchar' })
    name?: string;
    @Column({ type: 'varchar' })
    userid?: string;
    @Column({ type: 'varchar' })
    userOpenid?: string;


}
