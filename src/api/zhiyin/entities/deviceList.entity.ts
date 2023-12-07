// StampRecordDetailEntity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Transform, TransformFnParams } from 'class-transformer';
import { baseEntity } from '@src/api/base.entity';

@Entity({ name: 'zhiyinDevices', database: 'nestapi' })
export class StampRecordDetailEntity extends baseEntity {
   
    
    
}
