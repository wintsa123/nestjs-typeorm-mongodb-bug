import { Injectable } from '@nestjs/common';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { UpdateZhiyinDto } from './dto/update-zhiyin.dto';

@Injectable()
export class ZhiyinService {
  create() {
    return 'This action adds a new zhiyin';
  }

  findAll() {
    return `This action returns all zhiyin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} zhiyin`;
  }

  update(id: number) {
    return `This action updates a #${id} zhiyin`;
  }

  remove(id: number) {
    return `This action removes a #${id} zhiyin`;
  }
}
