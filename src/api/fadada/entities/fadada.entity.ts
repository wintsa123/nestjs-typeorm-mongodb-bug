import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { SharedEntity } from '@src/shared/entities/base.entity';

@Entity({ name: 'fadadaAccount' }) // 指定表名为 'MyUsers'

export class Fadada extends SharedEntity {
    @Column({ unique: true }) // 设置唯一性约束，确保 clientUserId 是唯一的
    clientUserId!: string;

    @Column()
    openUserId!: string;

    
}
