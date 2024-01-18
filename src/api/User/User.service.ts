import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@src/plugin/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';

import { FindManyOptions, MongoRepository, getMongoRepository } from 'typeorm';
import { User } from './entities/User.entity';
import { MongoFindOneOptions } from 'typeorm/find-options/mongodb/MongoFindOneOptions';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private readonly UserRepository: MongoRepository<User>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,

  ) {
  }
  /**
   * @Author: wintsa
   * @Date: 2024-01-17 15:25:10
   * @LastEditors: wintsa
   * @Description: 用户注册
   * @return {*}
   */
  async register(data) {
    console.log(data)

    const result = await this.UserRepository.find({
      where: {
        $or: [{ "name": data.name }, { "phone": data.phone }],
      },
    })
    console.log(result) 

    if (result.length>0) {
      throw '该账号/手机号已经注册过了'
    }
    const user = new User();
    user.name = data.name;
    user.password = data.password;
    user.password = data.phone;

    this.UserRepository.save(user)
    return true
  }
  async initial() {
    const user = new User();
    user.name = "wintsa";
    user.password = "12300114";
    user.phone = "17666503623";
    user.role = '1'

    this.UserRepository.save(user)

  }

}
