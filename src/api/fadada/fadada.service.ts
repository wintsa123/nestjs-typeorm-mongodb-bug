import { Injectable, Logger } from '@nestjs/common';

import { CreateFadadaDto } from './dto/create-fadada.dto';
import { UpdateFadadaDto } from './dto/update-fadada.dto';
import { Fadada } from './entities/fadada.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, In, IsNull, LessThan, MoreThan, Repository, createConnection } from 'typeorm';
import * as fascOpenApi from '@fddnpm/fasc-openapi-node-sdk';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@src/plugin/redis/redis.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { fadadaSeal } from './entities/fadadaSeal.entity';
import { signTaskStatus } from '@src/enums';
import JSONbig from 'json-bigint';
import { groupBy, map, uniqBy, zip } from 'lodash';
import { redisCacheKey } from '@src/utils';
import { IdTypeEnum, OpenId } from '@fddnpm/fasc-openapi-node-sdk';

@Injectable()
export class FadadaService {
  private logger = new Logger(FadadaService.name);

  constructor(
    private readonly SocketGateway: SocketGateway,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @InjectRepository(Fadada)
    private readonly fadadaRepository: Repository<Fadada>,
    @InjectRepository(fadadaSeal)
    private readonly SealRepository: Repository<fadadaSeal>,
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


      this.logger.log('oracle连接成功');
    } catch (error) {
      this.logger.error('连接oracle失败', error);
      throw error
    }
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 10:35:22
   * @LastEditors: wintsa
   * @Description: 初始化，返回一个合适的对象，并且会自动获取token
   * @return {*}
   */
  async init() {
    let fadadaToken = await this.redisService.get('fadadaToken')
    if (!fadadaToken) {
      this.logger.log('Token过期重新获取')
      fadadaToken = await this.getToken()
    }
    let Tmpobj = {
      credential: { appId: this.configService.get('fadada.appId') as string, appSecret: this.configService.get('fadada.appSecret') as string, accessToken: fadadaToken as string },
      serverUrl: this.configService.get('fadada.serverUrl') as string,
    }
    return Tmpobj
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 10:36:22
   * @LastEditors: wintsa
   * @Description: 获取Token
   * @return Token
   */
  async getToken() {
    try {
      let client = new fascOpenApi.serviceClient.Client({
        credential: { appId: this.configService.get('fadada.appId') as string, appSecret: this.configService.get('fadada.appSecret') as string },
        serverUrl: this.configService.get('fadada.serverUrl') as string,
      })
      const token: any = await client.getAccessToken()

      if (token.status !== 200 || token.data.code !== '100000') {
        this.logger.error('Token获取失败')
        throw token.data
      }
      await this.redisService.set('fadadaToken', token.data.data.accessToken, 7200)
      return token.data.data.accessToken;

    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-11 08:49:27
   * @LastEditors: wintsa
   * @Description: 回调数据
   * @return {*}
   */
  async callback(data, headers) {

    const { 'x-fasc-timestamp': timestamp, 'x-fasc-nonce': nonce, 'x-fasc-event': Eventid, 'x-fasc-app-id': appId, 'x-fasc-sign-type': signMethod, 'x-fasc-sign': signNum } = headers

    this.logger.debug('data', 'callback', headers)
    this.logger.debug(data.bizContent)

    if (!timestamp) {
      this.logger.error(data.bizContent)
      this.logger.error('过期无效数据')
      return 'success'
    }
    const currentTimestamp = Date.now(); // 获取当前时间戳（毫秒）
    const upperLimit = currentTimestamp + 300000; // 上限时间戳
    const lowerLimit = currentTimestamp - 300000; // 下限时间戳
    if (timestamp < lowerLimit || timestamp > upperLimit) {
      this.logger.error('时间不正确')
      return 'success'
    }

    const params = {
      "X-FASC-App-Id": appId,
      "X-FASC-Sign-Type": signMethod,
      "X-FASC-Timestamp": timestamp,
      "X-FASC-Nonce": nonce,
      "X-FASC-Event": Eventid,
      bizContent: data.bizContent,
      appSecret: this.configService.get('fadada.appSecret')
    }
    const sign = fascOpenApi.utils.sign(params);

    if (sign !== signNum) {
      this.logger.error('法大大回调验证出错')
      return 'success'
    }
    // const tmp = JSON.parse(data.bizContent, (_key, value) => {
    //   if (typeof value === 'number' ) {
    //     console.log(value)
    //     return String(value);
    //   }
    //   return value;
    // });
    const json = JSONbig({
      storeAsString: true

    })
    const tmp = json.parse(data.bizContent)


    switch (Eventid) {
      case 'user-authorize':
        if (tmp.authResult !== 'success') {
          this.logger.error('user-authorize')
          this.logger.error(tmp.authFailedReason)
          throw false
        }
        if (tmp.identProcessStatus !== 'success') {
          this.logger.error('user-authorize')
          this.logger.error(tmp.identFailedReason)
          throw false
        }
        try {
          let existingData = await this.fadadaRepository.findOne({ where: { clientUserId: tmp.clientUserId } });
          if (existingData) {
            // 如果已存在，更新记录
            await this.fadadaRepository.update({ clientUserId: existingData.clientUserId }, { openUserId: tmp.openUserId });
          } else {
            // 如果不存在，创建新记录
            const newData = this.fadadaRepository.create({ clientUserId: tmp.clientUserId, openUserId: tmp.openUserId });
            await this.fadadaRepository.save(newData);
          }
          await this.redisService.del(`GET:/api/v1/fadada/user/GetByClientUserId?ClientUserId=${tmp.clientUserId}`)

          return 'success';
        } catch (error) {
          this.logger.error('Error:', error);
          throw error
        }
        break;
      case 'personal-seal-create':
        try {
          tmp.expiresTime = new Date(Number(tmp.expiresTime))
          tmp.eventTime = new Date(Number(tmp.eventTime))
          let oaUser = await this.connection.query(`select lastname from hrmresource where id='${tmp.clientUserId}' `)
          tmp.oaName = oaUser[0].LASTNAME
          await this.SealRepository.save(tmp);
          return 'success';
        } catch (error) {
          this.logger.error('Error:', error);
          throw error
        }
        break;
      case 'personal-seal-delete':
        try {
          await this.SealRepository.delete({ sealId: tmp.sealId });
          await this.redisService.del(`GET:/api/v1/fadada/user/CheckFreeStatusBySealId?SealId=${tmp.SealId}`)
          return 'success';
        } catch (error) {
          this.logger.error('Error:', error);
          throw error
        }
        break;
      case 'personal-seal-authorize-free-sign':
        try {
          let result = await this.SealRepository.findOne({
            withDeleted: true, where: { sealId: tmp.sealId }, select: ['id', 'sealId', 'deletedAt']
          });

          if (result) {

            Object.assign(result, tmp)
            result.expiresTime = new Date(Number(tmp.expiresTime))
            result.eventTime = new Date(Number(tmp.eventTime))
            await this.SealRepository.save(result);
            if (result.deletedAt) {
              await this.SealRepository.restore({ sealId: tmp.sealId });

            }
          } else {
            tmp.expiresTime = new Date(Number(tmp.expiresTime))
            tmp.eventTime = new Date(Number(tmp.eventTime))
            await this.SealRepository.save(tmp);
          }
          await this.redisService.del(`GET:/api/v1/fadada/user/CheckFreeStatusBySealId?SealId=${tmp.SealId}`)
          return 'success';
        } catch (error) {
          this.logger.error('Error:', error);
          throw error
        }
        break;
      case 'personal-seal-authorize-free-sign-cancel':
        try {
          await this.SealRepository.softDelete({ sealId: tmp.sealId });
          await this.redisService.del(`GET:/api/v1/fadada/user/CheckFreeStatusBySealId?SealId=${tmp.SealId}`)
          return 'success';
        } catch (error) {
          this.logger.error('Error:', error);
          throw error
        }
        break;
      case 'sign-task-sign-failed':

        return 'success'
        break;

      case 'sign-task-signed':
        this.logger.debug(tmp)
        return 'success'
        break;
      default:
        return 'success'
        break;
    }


  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 11:06:37
   * @LastEditors: wintsa
   * @Description:  获取企业的基本信息、认证状态、授权状态和范围等。注意：该接口返回的信息中不涉及隐私，因此不需要授权
   * @return {*}
   */
  async corpGet() {
    const client = new fascOpenApi.corpClient.Client(await this.init())
    let result: any = await client.get({ openCorpId: this.configService.get('fadada.opencorpId') as string })
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('Corp获取失败')
      throw result.data


    }
    return result.data.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 11:07:01
   * @LastEditors: wintsa
   * @Description: 用于获取企业的实名身份信息。注意：只有经过企业授权后，应用系统方可获得此信息
   * @return {*}
   */
  async corpGetIdentity() {
    const client = new fascOpenApi.corpClient.Client(await this.init())
    let result: any = await client.getIdentityInfo({ openCorpId: this.configService.get('fadada.opencorpId') as string })
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('corpGetIdentity获取失败')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2024-01-03 09:26:23
   * @LastEditors: wintsa
   * @Description: 查询印章名称、类型、系统章状态、图片和用印员列表等详情信息。
   * @return {*}
   */
  async corpGetSeal(sealId) {
    const client = new fascOpenApi.sealClient.Client(await this.init())
    let result: any = await client.getSealDetail({ openCorpId: this.configService.get('fadada.opencorpId') as string, sealId })
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)

      this.logger.error('corpGetIdentity获取失败')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 11:07:58
   * @LastEditors: wintsa
   * @Description: 查询企业成员列表
   * @return {*}
   */
  async corpGetList() {
    const client = new fascOpenApi.orgClient.Client(await this.init())
    let result: any = await client.getMemberList({ openCorpId: this.configService.get('fadada.opencorpId') as string })
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('corpGetList error')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 10:36:47
   * @LastEditors: wintsa
   * @Description: 获取用户授权链接
   * @return {*}
   */
  async getUserAuthUrl(data) {
    const euiClient = new fascOpenApi.euiClient.Client(await this.init())
    if (!data['freeSignInfo']) {
      data['freeSignInfo'] = {}
    }
    data['freeSignInfo']['businessId'] = this.configService.get('fadada.businessId') as string


    let result: any = await euiClient.getUserAuthUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('userAuthUrl获取失败')
      throw result.data

    }
    return result.data.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-18 11:22:14
   * @LastEditors: wintsa
   * @Description: 验证回调地址callback
   * @return {*}
   */
  async UserAuthUrl(clientUserId, openUserId, authResult, authFailedReason) {
    if (authResult !== 'success') {
      this.logger.error(authFailedReason)
      await this.SocketGateway.sendMessageToClient(clientUserId, { status: 'nopass', message: authFailedReason })
      return authFailedReason
    }
    try {
      let existingData = await this.fadadaRepository.findOne({ where: { clientUserId } });
      if (existingData) {
        // 如果已存在，更新记录
        await this.fadadaRepository.update({ clientUserId: existingData.clientUserId }, { openUserId });
      } else {
        // 如果不存在，创建新记录
        const newData = this.fadadaRepository.create({ clientUserId, openUserId });
        await this.fadadaRepository.save(newData);
      }
      await this.SocketGateway.sendMessageToClient(clientUserId, { status: 'pass' })
      await this.redisService.del(`GET:/api/v1/fadada/user/GetByClientUserId?ClientUserId=${clientUserId}`)

      return true;
    } catch (error) {
      this.logger.error('Error:', error);
      await this.SocketGateway.sendMessageToClient(clientUserId, { status: 'nopass', message: error })
      return false
    }
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-09 14:37:51
   * @LastEditors: wintsa
   * @Description: 提交成功的回调，调用socket让流程提交
   * @return {*}
   */
  async submitCallback(clientId, data) {
    await this.SocketGateway.sendMessageToClient(clientId, { status: data })

    return true
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 11:52:57
   * @LastEditors: wintsa
   * @Description: 将已添加的用户暂时禁用。禁用后，该用户暂时不能通过该应用系统使用法大大平台服务
   * @return {*}
   */
  async userDisable(data) {
    const Client = new fascOpenApi.userClient.Client(await this.init())
    let result: any = await Client.disableUser(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('userDisable获取失败')
      throw result.data

    }
    await this.fadadaRepository.softDelete({ openUserId: data.openUserId });

    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 11:52:57
   * @LastEditors: wintsa
   * @Description: 将已禁用的用户再次激活。激活后，该用户可继续通过该应用系统使用法大大平台服务
   * @return {*}
   */
  async userEnable(data) {
    const Client = new fascOpenApi.userClient.Client(await this.init())
    let result: any = await Client.enableUser(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('userEnable获取失败')
      throw result.data

    }

    await this.fadadaRepository.restore({ openUserId: data.openUserId });

    return result.data
  }

  /**
    * @Author: wintsa
    * @Date: 2023-11-16 11:52:57
    * @LastEditors: wintsa
    * @Description:  将已激活的用户，解除绑定
    * @return {*}
    */
  async userUnbind(data) {
    const Client = new fascOpenApi.userClient.Client(await this.init())
    let result: any = await Client.unbindUser(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('userunbind获取失败')
      throw result.data

    }
    await this.fadadaRepository.delete({ openUserId: data.openUserId })

    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 11:52:57
   * @LastEditors: wintsa
   * @Description:  获取个人用户的基本信息、认证状态、授权状态和范围等。注意：该接口返回的信息中不涉及个人隐私，因此不需要授权
   * @return {*}
   */
  async userGet(data) {
    const Client = new fascOpenApi.userClient.Client(await this.init())
    let result: any = await Client.getUserInfo(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('userGet')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-23 15:35:06
   * @LastEditors: wintsa
   * @Description: 获取授权状态
   * @return {*}
   */
  async getopenUserId(clientUserId) {
    let result = await this.fadadaRepository.findOne({ where: { clientUserId } });
    if (result) {
      return 'true'
    } else {
      return false
    }
  }

  /**
     * @Author: wintsa
     * @Date: 2023-11-23 15:35:06
     * @LastEditors: wintsa
     * @Description: 检查签名的免验证签状态
     * @return {*}
     */
  async CheckFreeStatus(sealId) {
    let result = await this.SealRepository.findOne({ where: { sealId } });
    if (result) {
      return 'true'
    } else {
      return false
    }

  }
  /**
     * @Author: wintsa
     * @Date: 2023-11-16 11:52:57
     * @LastEditors: wintsa
     * @Description:  用于获取个人用户的身份信息
     * @return {*}
     */
  async userGetIdentity(data) {
    const Client = new fascOpenApi.userClient.Client(await this.init())
    let result: any = await Client.getIdentInfo(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('userGetIdentity')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 13:57:34
   * @LastEditors: wintsa
   * @Description: 获取上传文件的链接
   * @return {*}
   */
  async uploadDoc(data) {
    const Client = new fascOpenApi.docClient.Client(await this.init())
    let result: any = await Client.getUploadUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('uploadDoc')
      throw result

    }
    return result.data.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 14:42:22
   * @LastEditors: wintsa
   * @Description: 通过网络文件地址上传
   * @return {*}
   */
  async uploadFileByUrl(data) {
    const Client = new fascOpenApi.docClient.Client(await this.init())
    let result: any = await Client.uploadFileByUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('uploadFileByUrl')
      throw result.data

    }
    return result.data.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 13:57:34
   * @LastEditors: wintsa
   * @Description: 文件上传后，文件处理
   * @return {*}
   */
  async fileProcess(data) {
    const Client = new fascOpenApi.docClient.Client(await this.init())
    let result: any = await Client.fileProcess(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('fileProcess')
      throw result.data


    }
    return result.data.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-16 14:01:09
   * @LastEditors: wintsa
   * @Description: 验证文件有无签署
   * @return {*}
   */
  async fileVerifySign(data) {
    const Client = new fascOpenApi.docClient.Client(await this.init())
    let result: any = await Client.fileVerifySign(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('fileVerifySign')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:14:33
   * @LastEditors: wintsa
   * @Description: 创建签署任务(基于文档) 
   * @return {*}
   */
  async signCreate(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let tmpData = JSON.parse(JSON.stringify(data))
    if (tmpData['initiator']['idType'] == 'corp') {
      tmpData['initiator']['openId'] = this.configService.get('fadada.opencorpId')
    }
    if (tmpData['businessId']) {
      tmpData['businessId'] = this.configService.get('fadada.businessId')
    } else {
      delete tmpData['businessId']
    }
    for (const e of tmpData['actors']) {
      if (e.actor.actorType == 'corp') {
        e.actor['actorOpenId'] = this.configService.get('fadada.opencorpId')
      }
      if (e.actor.actorType == 'person' && e.actor['actorOpenId'] == true) {
        let result = await this.fadadaRepository.findOne({ where: { clientUserId: e.actor['clientId'] } });
        e.actor['actorOpenId'] = result!['openUserId']

      }
    }


    try {
      let result: any = await Client.create(tmpData)
      if (result.status !== 200 || result.data.code !== '100000') {

        this.logger.error(result.headers)
        const hash = redisCacheKey('POST', '/api/v1/fadada/sign/Create', data)

        if (await this.redisService.get(hash)) {
          await this.redisService.del(hash)
          let done = await this.signCreate(data)
          return done
        }

        throw result.data

      }
      return result.data.data
    } catch (error) {
      this.logger.error(error)
      throw error
    }

  }

  /**
  * @Author: wintsa
  * @Date: 2023-11-17 10:14:33
  * @LastEditors: wintsa
  * @Description: 创建签署任务(基于签署任务模板) 
  * @return {*}
  */
  async signCreateWithTemple(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.createWithTemplate(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('createWithTemplate')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:17:15
   * @LastEditors: wintsa
   * @Description: 添加签署任务文档
   * @return {*}
   */
  async signAddDoc(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.addDoc(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('signAddDoc')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:19:21
   * @LastEditors: wintsa
   * @Description: 移除签署任务文档
   * @return {*}
   */
  async signdeleteDoc(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.deleteDoc(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('signdeleteDoc')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:21:03
   * @LastEditors: wintsa
   * @Description: 添加签署任务控件
   * @return {*}
   */
  async signaddFiele(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.addField(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('addField')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:21:33
   * @LastEditors: wintsa
   * @Description: 移除签署任务控件
   * @return {*}
   */
  async signdeleteFiele(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.deleteField(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('deleteField')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:45:12
   * @LastEditors: wintsa
   * @Description: 填写签署任务控件内容
   * @return {*}
   */
  async fillFieldValues(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.fillFieldValues(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('fillFieldValues')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:45:38
   * @LastEditors: wintsa
   * @Description: 添加签署任务附件
   * @return {*}
   */
  async addAttach(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.addAttach(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('addAttach')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:46:25
   * @LastEditors: wintsa
   * @Description: 移除签署任务附件
   * @return {*}
   */
  async deleteAttach(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.deleteAttach(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('deleteAttach')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:46:43
   * @LastEditors: wintsa
   * @Description: 添加签署任务参与方
   * @return {*}
   */
  async addActor(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.addActor(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('addActor')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:46:59
   * @LastEditors: wintsa
   * @Description: 移除签署任务参与方
   * @return {*}
   */
  async deleteActor(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.deleteActor(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('deleteActor')
      throw result.data

    }
    return result.data
  }
  /**
     * @Author: wintsa
     * @Date: 2023-11-17 10:46:59
     * @LastEditors: wintsa
     * @Description: 修改签署任务参与方
     * @return {*}
     */
  async modifyActor(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.modifyActor(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('modifyActor')
      throw result.data

    }
    return result.data
  }
  /**
     * @Author: wintsa
     * @Date: 2023-11-17 10:46:59
     * @LastEditors: wintsa
     * @Description: 获取签署任务编辑链接
     * @return {*}
     */
  async getSignTaskEditUrl(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getSignTaskEditUrl(data)

    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getSignTaskEditUrl')
      throw result.data

    }
    return result.data.data
  }

  /**
     * @Author: wintsa
     * @Date: 2023-11-17 10:46:59
     * @LastEditors: wintsa
     * @Description: 获取签署任务预览链接
     * @return {*}
     */
  async getSignTaskPreviewUrl(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getSignTaskPreviewUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getSignTaskPreviewUrl')
      throw result.data

    }
    return result.data.data
  }

  /**
      * @Author: wintsa
      * @Date: 2023-11-17 10:46:59
      * @LastEditors: wintsa
      * @Description: 获取参与方签署链接
      * @return {*}
      */
  async getActorUrl(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getActorUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getActorUrl')
      throw result.data

    }
    return result.data.data
  }
  /**
      * @Author: wintsa
      * @Date: 2023-11-17 10:46:59
      * @LastEditors: wintsa
      * @Description: 获取参与方批量签署链接
      * @return {*}
      */
  async getActorBatchSignTaskUrl(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getActorBatchSignTaskUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getActorBatchSignTaskUrl')
      throw result.data

    }
    return result.data
  }
  /**
      * @Author: wintsa
      * @Date: 2023-11-17 10:46:59
      * @LastEditors: wintsa
      * @Description: 获取参与方签署链接（API3.0任务专属）
      * @return {*}
      */
  async getV3ActorSignTaskUrl(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getV3ActorSignTaskUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getV3ActorSignTaskUrl')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:53:48
   * @LastEditors: wintsa
   * @Description: 提交签署任务
   * @return {*}
   */
  async signStart(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.start(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('start')
      throw result.data
    } else {
      return result.data.msg
    }
  }

  /**
    * @Author: wintsa
    * @Date: 2023-11-17 10:53:48
    * @LastEditors: wintsa
    * @Description: 撤销签署任务
    * @return {*}
    */
  async signCancel(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.cancel(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('cancel')
      throw result.data

    }
    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:55:13
   * @LastEditors: wintsa
   * @Description: 定稿签署任务
   * @return {*}
   */
  async finalizeDoc(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.finalizeDoc(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('finalizeDoc')
      throw result.data

    }
    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:55:43
   * @LastEditors: wintsa
   * @Description: 催办签署任务
   * @return {*}
   */
  async urgeSignTask(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.urgeSignTask(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('urgeSignTask')
      throw result.data

    }
    return result.data.msg
  }

  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:56:17
   * @LastEditors: wintsa
   * @Description: 阻塞签署任务
   * @return {*}
   */
  async signblock(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.block(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('block')
      throw result.data

    }
    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:56:56
   * @LastEditors: wintsa
   * @Description: 解阻签署任务
   * @return {*}
   */
  async signUnblock(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.unblock(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('unblock')
      throw result.data

    }
    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:57:11
   * @LastEditors: wintsa
   * @Description: 结束签署任务
   * @return {*}
   */
  async signfinish(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.finish(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('finish')
      throw result.data

    }
    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-11 09:58:12
   * @LastEditors: wintsa
   * @Description: 删除任务
   * @return {string}
   */
  async signdelete(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.delete(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('delete')
      this.logger.error(data)

      throw result.data

    }

    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:58:05
   * @LastEditors: wintsa
   * @Description: 作废签署任务
   * @return {*}
   */
  async signAbolish(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.abolish(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('abolish')
      throw result.data

    }
    return result.data.msg
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:58:36
   * @LastEditors: wintsa
   * @Description: 查询签署任务详情
   * @return {*}
   */
  async signGetDetail(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getDetail(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getDetail')
      throw result.data

    }
    delete result.data.data['initiator']
    return result.data.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-22 15:20:10
   * @LastEditors: wintsa
   * @Description: 获取预填写链接
   * @return {*}
   */
  async getPrefillUrl(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getPrefillUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getDetail')
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:59:25
   * @LastEditors: wintsa
   * @Description: 查询签署任务列表
   * @return {*}
   */
  async signGetOwnerList(data) {
    try {
      const Client = new fascOpenApi.signTaskClient.Client(await this.init())
      if (data.ownerId.idType == 'corp') {
        data.ownerId['openId'] = this.configService.get('fadada.opencorpId')

      } else if (data.ownerId.idType == 'person') {
        const result = await this.fadadaRepository.findOne({
          where: { clientUserId: data.ownerId['openId'] }, select: ["openUserId"] // 指定要选择的字段
        });
        data.ownerId['openId'] = result!.openUserId
      }
      let result: any = await Client.getOwnerList(data)
      if (result.status !== 200 || result.data.code !== '100000') {
        this.logger.error('getOwnerList')
        throw result.data

      }
      result.data.data.signTasks.forEach(element => {
        const statusValue = signTaskStatus[element.signTaskStatus];

        if (statusValue) {
          // 如果 statusValue 存在，则将 element.signTaskStatus 修改为相应的值
          element.signTaskStatus = statusValue;
        }
      });
      return result.data
    } catch (error) {
      throw error

    }
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 11:01:06
   * @LastEditors: wintsa
   * @Description: 获取签署文档下载地址
   * @return {*}
   */
  async signGetOwnerDownLoadUrl(signTaskId) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    console.log(signTaskId)
    let params={
      "ownerId": {"idType":'corp' ,"openId":this.configService.get('fadada.opencorpId')} as OpenId,
      "signTaskId":signTaskId
    }
    
    let result: any = await Client.getOwnerDownLoadUrl(params)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)
      throw result.data

    }
    return result.data
  }



  /**-----------------------------------------------------------------------个人印章管理----------------------------------------------------------------------------------*/
  /**
   * @Author: wintsa
   * @Date: 2023-12-22 14:52:53
   * @LastEditors: wintsa
   * @Description: 创建个人图片签名
   * @return {*}
   */
  async PersonCreateByImage(data) {
    const client = new fascOpenApi.sealClient.Client(await this.init())
    let result: any = await client.createPersonalSealByImage(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)
      throw result.data

    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2024-01-08 14:21:39
   * @LastEditors: wintsa
   * @Description: 根据模板创建个人签名
   * @return {*}
   */
  async PersonCreateByTemple(data) {
    const client = new fascOpenApi.sealClient.Client(await this.init())
    let result: any = await client.createPersonalSealByTemplate(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)
      throw result.data

    }
    return result.data
  }


  /**
 * @Author: wintsa
 * @Date: 2023-12-22 14:52:53
 * @LastEditors: wintsa
 * @Description: 获取签名创建链接
 * @return {*}
 */
  async getPersonalSealCreateUrl(clientUserId) {
    if (clientUserId.length == 0) {
      throw '未取得登录id'
    }
    const client = new fascOpenApi.sealClient.Client(await this.init())

    let result: any = await client.getPersonalSealCreateUrl({ clientUserId })
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)
      throw result.data
    }
    return result.data
  }
  /**
* @Author: wintsa
* @Date: 2023-12-22 14:52:53
* @LastEditors: wintsa
* @Description: 获取签名管理链接
* @return {*}
*/
  async getPersonalSealManageUrl(data) {
    const client = new fascOpenApi.sealClient.Client(await this.init())
    let result: any = await client.getPersonalSealManageUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)
      throw result.data
    }
    return result.data
  }

  /**
* @Author: wintsa
* @Date: 2023-12-22 14:52:53
* @LastEditors: wintsa
* @Description: 获取个人签名设置免验证签链接
* @return {*}
*/
  async getPersonalFreeSignUrl(data) {
    try {


      if (!data || data.length == 0) {
        throw false
      }
      const client = new fascOpenApi.sealClient.Client(await this.init())


      let tmp = await this.SealRepository.findOne({ where: { sealId: Array.isArray(data) ? data[0].sealId : data.sealId[0] } });

      if (!tmp) {
        throw `${Array.isArray(data) ? data[0].clientUserId : data.clientUserId}该人未授权`
      }

      let result: any = await client.getPersonalFreeSignUrl({ openUserId: tmp.openUserId, businessId: this.configService.get('fadada.businessId') as string, sealIds: Array.isArray(data) ? data.map(e => e.sealId) : data.sealId })
      if (result.status !== 200 || result.data.code !== '100000') {
        this.logger.error(result.data)
        throw result.data
      }
      return result.data
    } catch (error) {
      throw error
    }
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-22 14:58:04
   * @LastEditors: wintsa
   * @Description: 查询个人签名列表
   * @return {*}
   */
  async getPersonalSealList(clientUserId) {
    if (clientUserId.length == 0) {
      throw '未取得登录id'
    }
    const client = new fascOpenApi.sealClient.Client(await this.init())
    let data = await this.fadadaRepository.findOne({ where: { clientUserId } });

    if (!data) {
      throw '请先授权';

    }
    // @ts-ignore    
    let result: any = await client.getPersonalSealList({ openUserId: data.openUserId })
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)
      throw result.data
    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-22 14:59:19
   * @LastEditors: wintsa
   * @Description: 解除签名免验证签
   * @return {*}
   */
  async cancelPersonalFreeSign(data) {
    const client = new fascOpenApi.sealClient.Client(await this.init())
    let result: any = await client.cancelPersonalFreeSign(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error(result.data)
      throw result.data
    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-12-22 14:59:38
   * @LastEditors: wintsa
   * @Description: 删除个人签名
   * @return {*}
   */
  async deletePersonalSeal(sealId) {
    try {
      const client = new fascOpenApi.sealClient.Client(await this.init())
      let tmp = await this.SealRepository.findOne({ where: { sealId } });
      if (!tmp) {
        throw tmp
      }
      // @ts-ignore
      let result: any = await client.deletePersonalSeal({ openUserId: tmp.openUserId, sealId: tmp.sealId })
      if (result.status !== 200 || result.data.code !== '100000') {
        this.logger.error(result.data)
        throw result.data
      }
      return result.data
    } catch (error) {
      throw error
    }

  }
  /**-----------------------------------------------------------------------个人印章管理end----------------------------------------------------------------------------------*/



  /**
   * @Author: wintsa
   * @Date: 2024-01-03 17:36:58
   * @LastEditors: wintsa
   * @Description: 获取公司免验证签url
   * @return {*}
   */
  async freeSealURL(sealIds) {
    const Client = new fascOpenApi.sealClient.Client(await this.init())
    let result: any = await Client.getSealFreeSignUrl({ openCorpId: this.configService.get('fadada.opencorpId') as string, businessId: this.configService.get('fadada.businessId') as string, sealIds })
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getDeta获取公司免验证签urlil')
      this.logger.error(result.data)
      throw result.data
    }
    return result.data.data
  }
  /**
  * @Author: wintsa
  * @Date: 2024-01-03 09:48:56
  * @LastEditors: wintsa
  * @Description: 检查任务的签名免验证情况
  * @return {*}
  */
  async authFreeSeal(signTaskId) {
    try {


      const detail = await this.signGetDetail({ signTaskId })
      const corp = detail.actors.filter(e => e.actorInfo.actorType == 'corp')
      const person = detail.actors.filter(e => e.actorInfo.actorType == 'person')
      let all: any[] = [];
      if (corp.length > 0) {
        let promises = []

        const corpSeal = corp.flatMap(e => e.signFields).map(e => e.sealId)
        if (corpSeal.includes(null)) {
          throw '公司有未指定印章'
        }
        const promise = corpSeal.map(async (e) => {
          return await this.corpGetSeal(e)
        })
        promises = promises.concat(promise)
        let result: any = await Promise.all(promises)
        if (result.some(e => e.code !== '100000')) {
          throw result
        }
        const notFree = result.filter(e => e.data.sealInfo.freeSignInfos == null).map(e => { return { sealId: e.data.sealInfo.sealId, sealName: e.data.sealInfo.sealName, sealUser: e.data.sealInfo.sealUsers.map(e => e.memberName) } })
        if (notFree.length > 0) {
          const url = await this.freeSealURL(notFree.map(e => e.sealId))
          // 确保两个数组长度相同
          notFree.forEach(e => { e['url'] = url.freeSignShortUrl, e['type'] = 'corp' })
          const tmp = uniqBy(notFree, 'url');

          all = all.concat(tmp)
        }


      }

      if (person.length > 0) {

        const personSeal = person.flatMap(e => e.signFields).map(e => e.sealId)
        if (personSeal.includes(null)) {
          throw '个人有未指定印章'
        }
        // 继续执行后续逻辑

        const currentDate = new Date();
        let result = await this.SealRepository.find({
          where: {
            sealId: In(personSeal)
          }
        });
        result = result.filter(e => {
          if (e.expiresTime) {
            return currentDate > new Date(e.expiresTime)

          } else {
            return e.businessId == null

          }
        })
        if (result.length > 0) {

          const result1 = result.map(e => { return { sealId: e.sealId, sealUser: e.oaName, openUserId: e.openUserId } })
          const groupByOpenUserid = groupBy(result1, 'openUserId')
          const promise = Object.keys(groupByOpenUserid).map(async (e) => {
            return await this.getPersonalFreeSignUrl(groupByOpenUserid[e])
          })
          const done = await Promise.all(promise)
          if (done.some(e => e.code !== '100000')) {
            throw done
          }
          const notFree = Object.keys(groupByOpenUserid).map((e, i) => {
            return {
              sealId: groupByOpenUserid[e][0].sealId,
              sealUser: groupByOpenUserid[e][0].sealUser,
              url: done[i].data.freeSignShortUrl,
              type: 'person'
            }
          })
          all = all.concat(notFree)
        }

      }


      return all

    } catch (error) {
      throw error
    }
  }

  /**
   * @Author: wintsa
   * @Date: 2024-01-11 10:36:28
   * @LastEditors: wintsa
   * @Description: 下载report
   * @return {*}
   */
  async  report(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    const field=await this.connection.query(`SELECT DOCFILEID FROM uf_dzqz2024_dt3 where mainid=6`)
    // Client.applyReport
    // Client.downloadReport
console.log(data)
    
  }
   /**
   * @Author: wintsa
   * @Date: 2024-01-11 10:36:28
   * @LastEditors: wintsa
   * @Description: 查询签署完成的附件
   * @return {*}
   */
  async  getFileInfo(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    // Client.getMessageReportDownloadUrl
    console.log(data)

  }
}

