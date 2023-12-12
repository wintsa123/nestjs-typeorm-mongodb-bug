import { Injectable, Logger } from '@nestjs/common';

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
import { Repository, getConnection } from 'typeorm';
import { uniqBy } from 'lodash';
import { devicesEntity } from './entities/deviceList.entity';
import { WxchatService } from "src/api/wxchat/wxchat.service";
import { zhiyinuserid } from './entities/OpenUserid.entity';
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
    @InjectRepository(devicesEntity)
    private readonly devicesRepository: Repository<devicesEntity>,
    @InjectRepository(zhiyinuserid)
    private readonly useridRepository: Repository<zhiyinuserid>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly WxchatService: WxchatService
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
      const appKeySuffix = `&appKey=${appKey}`;

      const fullQueryParamStr = queryParamStr + appKeySuffix;
      return crypto.createHash('md5').update(fullQueryParamStr).digest('hex').toUpperCase();

    }
    const signature = generateSignature(params, this.appKey);
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
        for (const item of done.data) {
          const existingData = await this.devicesRepository.findOne({ where: { mac: item.mac } });
          if (!existingData) {
            await this.devicesRepository.save(item);
          } else {
            await this.devicesRepository.update({ mac: item.mac }, item);

          }
        }
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
    console.log(mergedObj)

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
  /**
   * @Author: wintsa
   * @Date: 2023-12-12 10:10:47
   * @LastEditors: wintsa
   * @Description: UserOpenid回调
   * @return {*}
   */
  async userOpenIdCallback(Useropenid) {
    try {
      const assess_token = await this.WxchatService.getAssesstToken()
      const { data } = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/batch/openuserid_to_userid?access_token=${assess_token}`, {
        "open_userid_list": Useropenid,
        "source_agentid": this.configService.get('zhiyin.AgentId')
      })
      console.log(data)
      if (data.errcode) {
        return '失败'
      } else {
        if (data.userid_list.length > 0) {

          // const result=await this.useridRepository
          // .createQueryBuilder()
          // .insert()
          // .into(zhiyinuserid)
          // .values(data.userid_list.map(e=>{return {userOpenid:e.open_userid,userid:e.userid}}))
          // .onConflict(`("userOpenid","userid") DO NOTHING`) // or use another conflict resolution strategy
          // .execute();
          for (const item of data.userid_list) {
            console.log(item)
            item['userOpenid'] = item.open_userid
            delete item['open_userid']
            const existingData = await this.useridRepository.findOne({ where: { userOpenid: item.userOpenid } });
            if (!existingData) {
              await this.useridRepository.save(item);
            } else {
              existingData.userid = item.userid
              await this.useridRepository.save(existingData);
            }
          }
          // console.log(result)
        }
        const successIds = data.userid_list.map(e => e.userOpenid)
        return { successIds, invalid: data.invalid_open_userid_list }
      }
    } catch (error) {
      console.log(error)
      throw error;

    }
  }


}
