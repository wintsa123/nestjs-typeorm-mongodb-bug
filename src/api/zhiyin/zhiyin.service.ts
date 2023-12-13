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
import { Connection, Repository, createConnection, getConnection, getManager } from 'typeorm';
import { difference, isEmpty, isNil, pickBy, uniqBy } from 'lodash';
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
    // @InjectRepository(hrmresourceEntity,'oracle')
    // private readonly hrmresourceRepositor: Repository<hrmresourceEntity>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly WxchatService: WxchatService,
    private connection: Connection

  ) {
    this.initialize();
  }
  private async initialize() {
    try {
      this.connection = await createConnection({
        type: "oracle",
        host: "192.168.2.222",
        port: 1521,
        username: String(this.configService.get('datasourceOracle.username')),
        password: String(this.configService.get('datasourceOracle.username')),
        database: String(this.configService.get('datasourceOracle.username')),
        sid: String(this.configService.get('datasourceOracle.sid')),
      });

      // Perform additional initialization steps with the connection if needed

      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to establish database connection', error);
    }
  }
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
        .sort((a, b) => { return a[0].localeCompare(b[0]) })
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
    let tmp = pickBy(params, (value) => !isNil(value)) as any
    const mergedObj = { ...objTmp, ...tmp };
    const stampUser1 = await this.connection.query(`select WORKCODE from hrmresource where id=${mergedObj.stampUser} `)
    const createUser1 = await this.connection.query(`select WORKCODE from hrmresource where id=${mergedObj.createUser}`)
    console.log(stampUser1, createUser1)
    if (createUser1[0].WORKCODE == null) {
      return '创建人不存在'
    }
    if (stampUser1[0].WORKCODE == null) {
      return '创建人不存在'
    }
    const stampUser = await this.useridRepository.findOne({ where: { userid: stampUser1[0].WORKCODE } })
    const createUser = await this.useridRepository.findOne({ where: { userid: createUser1[0].WORKCODE } })
    if (createUser == null) {
      return '创建人授权，请登录企业微信工作台小程序先授权'
    }
    if (stampUser == null) {
      return '创建人授权，请登录企业微信工作台小程序先授权'
    }
    mergedObj.stampUser = stampUser?.userOpenid
    mergedObj.createUser = createUser?.userOpenid
    let result = this.Sign(mergedObj)
    const url = `${this.url}oa/apply/sync`
    console.log(result)
    try {
      const { data: done } = await axios.post(url, result, {
        headers: {
          'Content-Type': 'application/json', // 设置请求头为 JSON 格式
        },
      })
      console.log(done)
      if (done.success) {
        return done
      } else {
        this.logger.error(done)
        return done.msg
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

    const url1 = `${this.url}oa/apply/cancel?code=${result.code}&appId=${result.appId}&timestamp=${result.timestamp}&sign=${result.sign}`

    try {

      const { data: done } = await axios.get(url1)
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

    const url1 = `${this.url}oa/stamp/info?appId=${result.appId}&code=${result.code}&traceId=${result.traceId}&timestamp=${result.timestamp}&sign=${result.sign}`
    try {

      const { data: done } = await axios.get(url1)
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
      const existingUserIds = await this.useridRepository.find({ select: ["userOpenid"] });
      const openid = difference(Useropenid, existingUserIds)
      if (openid.length === 0) {
        return { successIds: Useropenid, invalid: [] };
      }
      const assess_token = await this.WxchatService.getAssesstToken()
      const { data } = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/batch/openuserid_to_userid?access_token=${assess_token}`, {
        "open_userid_list": openid,
        "source_agentid": this.configService.get('zhiyin.AgentId')
      })

      if (data.errcode) {
        return '失败'
      }
      if (data.userid_list.length > 0) {
        // for (const item of data.userid_list) {
        //   item['userOpenid'] = item.open_userid
        //   delete item['open_userid']
        //   const user = await this.connection.query(`select id,LASTNAME as name from hrmresource where WORKCODE='${item.userid}' `)
        //   item.id = user[0].ID
        //   item.name = user[0].NAME

        //   await this.useridRepository.save(item);

        // }
        const entitiesToSave = await Promise.all(data.userid_list.map(async (item) => {
          item['userOpenid'] = item.open_userid;
          delete item['open_userid'];
          const user = await this.connection.query(`select id,LASTNAME as name from hrmresource where WORKCODE='${item.userid}' `)
          item.id = user[0].ID
          item.name = user[0].NAME
          return item as zhiyinuserid; // Ensure item conforms to YourEntity structure
        }))
        console.log(entitiesToSave)
      }
      const successIds = data.userid_list.map(e => e.userOpenid)
      return { successIds, invalid: data.invalid_open_userid_list }
    }


    catch (error) {
      console.log(error)
      throw error;
    }
  }


}
