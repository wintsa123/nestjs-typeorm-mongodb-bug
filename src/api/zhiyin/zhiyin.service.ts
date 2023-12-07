import { Injectable, Logger } from '@nestjs/common';
import { CreateZhiyinDto } from './dto/create-zhiyin.dto';
import { UpdateZhiyinDto } from './dto/update-zhiyin.dto';
import { RedisService } from '@src/plugin/redis/redis.service';
import { ConfigService } from '@nestjs/config';
const crypto = require('crypto');
import { getTime } from "@src/utils/index";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplyDetailEntity } from './entities/ApplyDetail.entity';
import { StampRecordEntity } from './entities/StampRecord.Entity';
import { StampRecordDetailEntity } from './entities/StampRecordDetail.entity';
import { Repository } from 'typeorm';
import { uniqBy } from 'lodash';

@Injectable()
export class ZhiyinService {
  private logger = new Logger(ZhiyinService.name);
  private appId = this.configService.get('zhiyin.appId')
  private appKey = this.configService.get('zhiyin.appKey')
  private url = this.configService.get('zhiyin.url')

  constructor(
    @InjectRepository(ApplyDetailEntity)
    private readonly applyDetailRepository: Repository<ApplyDetailEntity>,
    @InjectRepository(StampRecordEntity)
    private readonly stampRecordRepository: Repository<StampRecordEntity>,
    @InjectRepository(StampRecordDetailEntity)
    private readonly stampRecordDetailRepository: Repository<StampRecordDetailEntity>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) { }


  /**
   * @Author: wintsa
   * @Date: 2023-12-05 11:16:03
   * @LastEditors: wintsa
   * @Description: 根据对象签名
   * @return {*}
   */
  Sign(params) {
    function generateSignature(params, appKey) {
      const queryParamStr = Object.entries(params)
        .filter(([key, value]) => key && value !== undefined)
        .sort((a, b) => { console.log(a); return a[0].localeCompare(b[0]) })
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      console.log(queryParamStr)
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
  /**
   * @Author: wintsa
   * @Date: 2023-12-05 11:16:23
   * @LastEditors: wintsa
   * @Description: 获取印章设备列表
   * @return {*}
   */
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

  /**
   * @Author: wintsa
   * @Date: 2023-12-05 11:16:36
   * @LastEditors: wintsa
   * @Description: oa审批单据推送
   * @return {*}
   */
  async push(params) {
    let objTmp = {
      traceId: 'zw' + uuidv4(),
      appId: this.appId,
      timestamp: getTime()
    }
    const mergedObj = { ...objTmp, ...params };
    let result = this.Sign(mergedObj)
    const url = `${this.url}oa/apply/sync`
    try {
      const { data: done } = await axios.post(url, result)
      if (done.success) {
        return done
      } else {
        this.logger.error(done)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  /**
   * @Author: wintsa
   * @Date: 2023-12-05 11:16:48
   * @LastEditors: wintsa
   * @Description: 撤销单据推送
   * @return {*}
   */
  async cancel(code: string) {
    let objTmp = {
      code,
      appId: this.appId,
      timestamp: getTime(),
    }
    let result = this.Sign(objTmp)
    console.log(result)

    const url1 = `${this.url}oa/apply/cancel?code=${result.code}&appId=${result.appId}&timestamp=${result.timestamp}&sign=${result.sign}`

    try {
      console.log(url1)

      const { data: done } = await axios.get(url1)
      console.log(done)
      if (done.success) {
        return done
      } else {
        this.logger.error(done)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-05 11:16:57
   * @LastEditors: wintsa
   * @Description: 回调地址
   * @return {*}
   */
  async callback(data) {
    const { opApplyDetailRequest, opStampRecordRequest } = data
    const tmp1 = opStampRecordRequest.map((e: any) => { return { ...e.opStampRecordBo, opStampRecordImages: e.opStampRecordImages } });
    let StampRecords = uniqBy([].concat(...tmp1), 'id').map((e: any) => { e['apply'] = opApplyDetailRequest.id; return new StampRecordEntity(e) })
    let tmp = [].concat(...opStampRecordRequest.map((e) => e.opStampRecordDetails))
    let StampRecordDetails = uniqBy(tmp, 'id').map((e: any) => { e['apply'] = opApplyDetailRequest.id; return new StampRecordDetailEntity(e) })
    const all = new ApplyDetailEntity(opApplyDetailRequest)
    all['details'] = StampRecordDetails
    all['records'] = StampRecords
    console.log(all)
    try {
      await this.applyDetailRepository.save(all);
      await this.stampRecordRepository.save(StampRecords);
      await this.stampRecordDetailRepository.save(StampRecordDetails);
      return true
    } catch (error) {
      throw error
    }

  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-05 17:52:19
   * @LastEditors: wintsa
   * @Description: 主动获取数据
   * @return {*}
   */
  async info(code) {
    let objTmp = {
      traceId: 'zw' + uuidv4(),
      code,
      appId: this.appId,
      timestamp: getTime(),
    }
    let result = this.Sign(objTmp)
    console.log(result)

    const url1 = `${this.url}oa/stamp/info?appId=${result.appId}&code=${result.code}&traceId=${result.traceId}&timestamp=${result.timestamp}&sign=${result.sign}`
    try {
      console.log(url1)

      const { data: done } = await axios.get(url1)
      console.log(done.success)
      if (done.success) {

        return done.data
      } else {
        return done.msg
        this.logger.error(done)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
