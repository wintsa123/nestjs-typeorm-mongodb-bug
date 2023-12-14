import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { baseEntity } from '@src/api/base.entity';

@Entity({ name: 'fadada', database: 'nestapi' }) 

export class Fadada extends baseEntity {
    @Column({ unique: true }) // 设置唯一性约束，确保 clientUserId 是唯一的
    clientUserId!: string;

    @Column()
    openUserId!: string;

    @Column({  type: 'boolean',    default: false})
    freeStatus!: boolean;

    
}
