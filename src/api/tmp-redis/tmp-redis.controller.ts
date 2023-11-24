import { Body, Controller, Post } from '@nestjs/common';
import { TmpRedisService } from './tmp-redis.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('redis')
@Controller('tmp-redis')
export class TmpRedisController {
  constructor(private readonly tmpRedisService: TmpRedisService) {}
  @Post('/cleanall')
  @ApiOperation({ summary: '调用该接口可清空redis缓存' })
  cleanall() {
    return this.tmpRedisService.cleanAll();
  }
}
