import { Transform, TransformFnParams } from 'class-transformer';
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  ObjectIdColumn,
  
} from 'typeorm';
import { ObjectId } from 'mongodb' //注意这个ObjectId一定要从 mongodb里面导入，而不是typeorm
export class baseEntity extends BaseEntity {
  @ObjectIdColumn({
   
  })
  id?: ObjectId;

  @Transform((row: TransformFnParams) => +new Date(row.value))
  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt!: Date;

  @Transform((row: TransformFnParams) => +new Date(row.value))
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'deleted_at',
    select: false,
    comment: '软删除时间',
    default: null,
  })
  deletedAt!: Date | null;
}
