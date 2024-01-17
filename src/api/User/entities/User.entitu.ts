import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, BeforeUpdate, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { Transform, TransformFnParams } from 'class-transformer';
import { baseEntity } from '@src/api/base.entity';

@Entity()
export class User extends baseEntity {
    @Column({ type: 'string', nullable: true })
    name;

    @Column({ type: 'string', nullable: true })
    password;

    @Column({ type: 'number', nullable: true })
    phone;
    @Column({ type: 'string', nullable: true })
    role;

    @Column({ type: 'string', default: '', nullable: true })
    avatar;


    

}
