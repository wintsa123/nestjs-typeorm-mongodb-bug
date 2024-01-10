import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, BeforeUpdate, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { Transform, TransformFnParams } from 'class-transformer';
import { baseEntity } from '@src/api/base.entity';

@Entity({ name: 'zhiyindevices', database: 'nestapi' })
export class devicesEntity extends baseEntity  {
    @Column({ type: 'varchar' })
    name?: string;
    @Column({ type: 'varchar' })
    mac?: string;
    @Column({ type: 'timestamp',nullable:true })
    serviceTime?: Date;

    @Column({ type: 'varchar',nullable:true })
    type?: string;
    @Column({ type: 'varchar',nullable:true })
    organization?: string;

   
}
