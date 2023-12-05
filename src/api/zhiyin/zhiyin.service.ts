import { Injectable, Logger } from '@nestjs/common';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { UpdateZhiyinDto } from './dto/update-zhiyin.dto';
import { RedisService } from '@src/plugin/redis/redis.service';
import { ConfigService } from '@nestjs/config';
const crypto = require('crypto');
import { getTime } from "@src/utils/index";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class ZhiyinService {
  private logger = new Logger(ZhiyinService.name);
  private appId = this.configService.get('zhiyin.appId')
  private appKey = this.configService.get('zhiyin.appKey')
  private url = this.configService.get('zhiyin.url')

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) { }



  Sign(params) {
    function generateSignature(params, appKey) {
      const queryParamStr = Object.entries(params)
        .filter(([key, value]) => key && value !== undefined)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      console.log(params)
      const appKeySuffix = `&appKey=${appKey}`;

      const fullQueryParamStr = queryParamStr + appKeySuffix;
      console.log(fullQueryParamStr)
      return crypto.createHash('md5').update(fullQueryParamStr).digest('hex').toUpperCase();

    }
    const signature = generateSignature(params, this.appKey);
    console.log(signature)
    params['sign'] = signature
    return params;
  }
  async getDriveList() {
    let objTmp = {
      traceId: 'zw' + uuidv4(),
      appId: this.appId,
      timestamp: getTime()
    }
    let result = this.Sign(objTmp)
    let url = `${this.url}oa/device/list?appId=${this.appId}&traceId=${result.traceId}&timestamp=${result.timestamp}&sign=${result.sign}`
    try {
      const { data: done } = await axios.get(url)
      if (done.success) {
        return done.data
      } else {
        this.logger.error(done.msg)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  async push(params) {
    let objTmp = {
      traceId: 'zw' + uuidv4(),
      appId: this.appId,
      timestamp: getTime()
    }
    const mergedObj = { ...objTmp, ...params };
    let result = this.Sign(mergedObj)
    console.log(result)
    const url = `${this.url}oa/apply/sync`
    console.log(url)
    try {
      const { data: done } = await axios.post(url, result)
      if (done.success) {
        return done.data
      } else {
        this.logger.error(done)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
  callback(data) {
    console.log(data)
    return data
  }
}
