import { Injectable, Logger } from '@nestjs/common';
import { pickBy } from 'lodash';

import { CreateFadadaDto } from './dto/create-fadada.dto';
import { UpdateFadadaDto } from './dto/update-fadada.dto';
import { Fadada } from './entities/fadada.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fascOpenApi from '@fddnpm/fasc-openapi-node-sdk';
// import  clientConfig  from '@fddnpm/fasc-openapi-node-sdk';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@src/plugin/redis/redis.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class FadadaService {
  private logger = new Logger(FadadaService.name);

  constructor(
    private readonly SocketGateway: SocketGateway,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @InjectRepository(Fadada)
    private readonly fadadaRepository: Repository<Fadada>,

  ) { }
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
      let fadadaToken = await this.redisService.get('fadadaToken')
      if (fadadaToken) return fadadaToken

      let client = new fascOpenApi.serviceClient.Client({
        credential: { appId: this.configService.get('fadada.appId') as string, appSecret: this.configService.get('fadada.appSecret') as string },
        serverUrl: this.configService.get('fadada.serverUrl') as string,
      })
      const token: any = await client.getAccessToken()
      if (token.status !== 200) {
        this.logger.error('Token获取失败')

        return token.data
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
      return result.data.msg
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
      return result.data.msg
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
      this.logger.error('corpGetIdentity获取失败')
      return result.data.msg
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


    console.log
    let result: any = await euiClient.getUserAuthUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('userAuthUrl获取失败')
      return result.data.msg
    }
    console.log(result)
    await this.redisService.del(`GET:/api/v1/fadada/user/GetByClientUserId?ClientUserId=${data.clientUserId}`)
    return result.data.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-18 11:22:14
   * @LastEditors: wintsa
   * @Description: 验证回调地址
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
  async submitCallback(clientId){
    await this.SocketGateway.sendMessageToClient(clientId, { status: 'pass' })

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
      return result.data.msg
    }
    await this.fadadaRepository.softDelete({ openUserId: data });

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
      return result.data.msg
    }

    await this.fadadaRepository.restore({ openUserId: data });

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
      return result.data.msg
    }
    await this.fadadaRepository.softDelete({ openUserId: data });

    return result.data
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
      return result.data.msg
    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-23 15:35:06
   * @LastEditors: wintsa
   * @Description: 获取激活状态的openUserId
   * @return {*}
   */
  async getopenUserId(clientUserId) {
    let result = await this.fadadaRepository.findOne({ where: { clientUserId } });
    if (result) {
      return result.openUserId
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
      return result.data.msg
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
      return result.data.msg
    }
    console.log(result.data)
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
    console.log(data)
    const Client = new fascOpenApi.docClient.Client(await this.init())
    let result: any = await Client.uploadFileByUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('uploadFileByUrl')
      return result.data.msg
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
      return result.data.msg
    }
    console.log(result.data)
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
      return result.data.msg
    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 10:14:33
   * @LastEditors: wintsa
   * @Description: 创建签署任务
   * @return {*}
   */
  async signCreate(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    data.actors = data.actors.map(e => {
      return {
        actor: pickBy(e.actor, value => value.length > 0 && value !== null && value !== undefined), signConfigInfo: pickBy(e.signConfigInfo, value => value.length > 0 && value !== null && value !== undefined)
      }
    })
    if (data['initiator']['idType'] == 'corp') {
      data['initiator']['openId'] = this.configService.get('fadada.opencorpId')
    }
    if (data['businessId']) {
      data['businessId'] = this.configService.get('fadada.businessId')
    } else {
      delete data['businessId']
    }
    console.log(data)
    let result: any = await Client.create(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('signCreate')
      return result.data.msg
    }
    console.log(result.data)
    return result.data.data
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
    } else {
      console.log(result)
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
      return result.data.msg
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
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getOwnerList(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getOwnerList')
      return result.data.msg
    }
    return result.data
  }
  /**
   * @Author: wintsa
   * @Date: 2023-11-17 11:01:06
   * @LastEditors: wintsa
   * @Description: 获取签署文档下载地址
   * @return {*}
   */
  async signGetOwnerDownLoadUrl(data) {
    const Client = new fascOpenApi.signTaskClient.Client(await this.init())
    let result: any = await Client.getOwnerDownLoadUrl(data)
    if (result.status !== 200 || result.data.code !== '100000') {
      this.logger.error('getOwnerDownLoadUrl')
      return result.data.msg
    }
    return result.data
  }

}
