import { Injectable, Logger } from '@nestjs/common';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { UpdateZhiyinDto } from './dto/update-zhiyin.dto';
import { RedisService } from '@src/plugin/redis/redis.service';
import { ConfigService } from '@nestjs/config';
const crypto = require('crypto');

@Injectable()
export class ZhiyinService {
  private logger = new Logger(ZhiyinService.name);
  private appId = this.configService.get('zhiyin.appId')
  private appKey = this.configService.get('zhiyin.appKey')
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) { }

  create() {
    return 'This action adds a new zhiyin';
  }

  getAssesstToken(params) {
    function generateSignature(params, appKey) {
      // 步骤 1: 将参数按字母顺序排序
      const sortedParams = Object.keys(params).sort();

      // 步骤 2: 将排序后的参数拼接成一个字符串
      const paramsString = sortedParams.map(key => `${key}=${params[key]}`).join('&');

      // 步骤 3: 在字符串末尾追加 AppKey
      const paramsWithKey = paramsString + appKey;

      // 步骤 4: 对追加 AppKey 后的字符串进行 MD5 32 位加密
      const md5Hash = crypto.createHash('md5').update(paramsWithKey).digest('hex');

      // 步骤 5: 将加密后的结果转换为大写，得到最终的签名值
      const signature = md5Hash.toUpperCase();

      return signature;
    }
    const signature = generateSignature(params, this.appKey);
    console.log(signature)
    return signature;
  }


}
