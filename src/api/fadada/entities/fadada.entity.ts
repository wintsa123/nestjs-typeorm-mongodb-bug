import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { SharedEntity } from '@src/shared/entities/base.entity';

@Entity({ name: 'fadadaAccount' }) // 指定表名为 'MyUsers'

export class Fadada extends SharedEntity {
    @Column()
    clientUserId!: string;

    @Column()
    openUserId!: string;

    
}
