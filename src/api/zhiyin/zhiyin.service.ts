import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '@src/plugin/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

import { getTime } from "@src/utils/index";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ApplyDetailEntity } from './entities/ApplyDetail.entity';
import { StampRecordEntity } from './entities/StampRecord.Entity';
import { StampRecordDetailEntity } from './entities/StampRecordDetail.entity';
import { Connection, EntityRepository, Repository, createConnection, getConnection, getCustomRepository, getManager, getRepository } from 'typeorm';
import { difference, isEmpty, isNil, pickBy, uniqBy } from 'lodash';
import { devicesEntity } from './entities/deviceList.entity';
import { WxchatService } from "src/api/wxchat/wxchat.service";
@EntityRepository(ApplyDetailEntity)
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
            if (new Date(existingData.serviceTime) < new Date()) {
              await this.devicesRepository.softDelete({ mac: item.mac })
            }
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



  async deviceAdd(data) {
    try {
      for (const item of data) {
        const existingData = await this.devicesRepository.findOne({ where: { mac: item.mac } });
        if (!existingData) {
          await this.devicesRepository.save(item);
        } else {
          await this.devicesRepository.update({ mac: item.mac }, item);

          if (new Date(existingData.serviceTime) < new Date()) {
            await this.devicesRepository.softDelete({ mac: item.mac })
          }

        }

        return data
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-13 16:36:30
   * @LastEditors: wintsa
   * @Description: hash计算
   * @return {*}
   */
  hashString(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
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
    const stampUser1 = await this.connection.query(`select WORKCODE,lastname,id from hrmresource where id=${mergedObj.stampUser} `)
    const createUser1 = await this.connection.query(`select WORKCODE,lastname,id from hrmresource where id=${mergedObj.createUser}`)
    console.log(stampUser1, createUser1)
    if (createUser1[0].WORKCODE == null) {
      return '创建人不存在，我们不允许管理员发起因为管理员与企微账号无关联'
    }
    if (stampUser1[0].WORKCODE == null) {
      return '用印人不存在'
    }

    const stampUser = this.hashString(stampUser1[0].WORKCODE)
    const createUser = this.hashString(createUser1[0].WORKCODE)
    mergedObj.stampUser = stampUser
    mergedObj.createUser = createUser
    let result = this.Sign(mergedObj)
    const url = `${this.url}oa/apply/sync`
    console.log(stampUser1[0].lastname)
    try {
      const { data: done } = await axios.post(url, result, {
        headers: {
          'Content-Type': 'application/json', // 设置请求头为 JSON 格式
        },
      })
      console.log(done)
      if (done.success) {
        let tmpobj = {}
        tmpobj['createOaUserId'] = createUser1[0].ID
        tmpobj['stampOaUserId'] = createUser1[0].ID

        tmpobj['createOaUserName'] = createUser1[0].LASTNAME
        tmpobj['stampOaUserName'] = stampUser1[0].LASTNAME
        tmpobj['requestId'] = params.requestId
        tmpobj['code'] = params.code
        tmpobj['status'] = '未盖章'

        tmpobj['mac'] = params.mac
        tmpobj['stampCode'] = done.data
        await this.applyDetailRepository.save(tmpobj)

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
        const target = await this.applyDetailRepository.findOne({ where: { code: result.code } })
        target!.status = '撤回'
        target && await this.applyDetailRepository.save(target)
        await this.applyDetailRepository.softDelete({ code: result.code })
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
   * @Date: 2023-12-15 11:00:00
   * @LastEditors: wintsa
   * @Description: 关闭单据
   * @return {*}
   */
  async close(code: string) {
    let objTmp = {
      code,
      appId: this.appId,
      timestamp: getTime(),
    }
    let result = this.Sign(objTmp)
    const url1 = `${this.url}/oa/apply/close?code=${result.code}&appId=${result.appId}&timestamp=${result.timestamp}&sign=${result.sign}`
    try {
      const { data: done } = await axios.get(url1)
      if (done.success) {
        const target = await this.applyDetailRepository.findOne({ where: { code: result.code } })
        target!.status = '完成'
        target && await this.applyDetailRepository.save(target)
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
    try {

      const { opApplyDetailRequest, opStampRecordRequest } = data
      delete opApplyDetailRequest['id']
      opApplyDetailRequest['status'] = '待盖章'
      if (opApplyDetailRequest['availableCount'] == 0) {
        opApplyDetailRequest['status'] = '完成'
      }
      let applyDetail = await this.applyDetailRepository.findOne({ where: { stampCode: opApplyDetailRequest.stampCode } });
      if (!applyDetail) return '未找到对应单据，请确定该单据有在oa流程发起'
      let createWorkcode = await this.convert([opApplyDetailRequest.createOpenUserId], true)
      let stampWorkcode = await this.convert([opApplyDetailRequest.stampOpenUserId], true)
      const tmp1 = opStampRecordRequest.map((e: any) => { return { ...e.opStampRecordBo, opStampRecordImages: e.opStampRecordImages } });
      let StampRecords = uniqBy([].concat(...tmp1), 'id').map((e: any) => { e['apply'] = applyDetail!.id; return new StampRecordEntity(e) })
      let tmp = [].concat(...opStampRecordRequest.map((e) => e.opStampRecordDetails))
      let StampRecordDetails = uniqBy(tmp, 'id').map((e: any) => { e['apply'] = applyDetail!.id; return new StampRecordDetailEntity(e) })
      Object.assign(applyDetail, opApplyDetailRequest)
      const stampUser1 = await this.connection.query(`select lastname from hrmresource where WORKCODE='${stampWorkcode}' `)
      const createUser1 = await this.connection.query(`select lastname from hrmresource where WORKCODE='${createWorkcode}'`)
      console.log(stampUser1, createUser1)
      if (createUser1[0].LASTNAME == null) {
        return '创建人不存在'
      }
      if (stampUser1[0].LASTNAME == null) {
        return '创建人不存在'
      }
      StampRecords['stampOaUserName'] = stampUser1[0].LASTNAME
      applyDetail['details'] = StampRecordDetails
      applyDetail['records'] = StampRecords

      applyDetail['createOaUserName'] = createUser1[0].LASTNAME
      applyDetail['stampOaUserName'] = stampUser1[0].LASTNAME

      await this.applyDetailRepository.save(applyDetail);
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
  async convert(Useropenid, local = false) {
    try {

      const assess_token = await this.WxchatService.getAssesstToken()
      const { data } = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/batch/openuserid_to_userid?access_token=${assess_token}`, {
        "open_userid_list": Useropenid,
        "source_agentid": this.configService.get('zhiyin.AgentId')
      })
      console.log(data, 'convert')
      if (data.errcode) {
        this.logger.error(data)
        return '失败'
      }
      if (data.userid_list.length > 0) {
        const successIds = data.userid_list.map(e => {
          return this.hashString(e.userid)

        })
        if (local == true) {
          return data.userid_list[0].userid
        } else {
          return { successIds, invalid: data.invalid_open_userid_list }

        }

      } else {
        return { successIds: [], invalid: data.invalid_open_userid_list }

      }
    }


    catch (error) {
      console.log(error)
      throw error;
    }
  }


}
