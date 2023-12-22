import { Body, Controller, Post } from '@nestjs/common';
import { TmpRedisService } from './tmp-redis.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags('redis')
@Controller('tmp-redis')
export class TmpRedisController {
  constructor(private readonly tmpRedisService: TmpRedisService) {}
  @Post('/cleanall')
  @ApiOperation({ summary: '调用该接口可清空redis缓存,非常不建议随意使用，例如在一些缓存级别的接口，文档处理/任务id生成，如果参数一致不重复处理，如果清理缓存后，同一个文件重复处理会报错' })
  cleanall() {
    return this.tmpRedisService.cleanAll();
  }
}
