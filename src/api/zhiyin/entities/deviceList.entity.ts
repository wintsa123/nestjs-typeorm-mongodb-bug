import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, BeforeUpdate } from 'typeorm';
import { Transform, TransformFnParams } from 'class-transformer';
import { baseEntity } from '@src/api/base.entity';

@Entity({ name: 'zhiyindevices', database: 'nestapi' })
export class devicesEntity extends baseEntity {
    @Column({ type: 'varchar' })
    name?: string;
    @Column({ type: 'varchar' })
    mac?: string;
    @Column({ type: 'timestamp',nullable:true })
    serviceTime?: Date;

   
}
