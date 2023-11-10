import { Injectable, Logger } from '@nestjs/common';
import { WxchatDto } from './dto/wxchat.dto';
import winston from 'winston';
const crypto = require('crypto');

import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@src/plugin/redis/redis.service';
import WXBizMsgCrypt from 'wxmsgcrypt';


@Injectable()
export class WxchatService {
  private corpsecret = this.configService.get('wxChat.corpsecret')
  private CorpID = this.configService.get('wxChat.CorpID')
  // private CorpID = 5629502985612755

  private AgentId = this.configService.get('wxChat.AgentId')
  private readonly logger = new Logger(WxchatService.name);
  private token = 'KxvcyR3SQqTIzAVyIQTn2'
  private Key = 'Fc3rx5pyQ4BePDDT7t5jHOvTzfdVbBDgySDhbebWDAq'

  private wxBizMsgCrypt = new WXBizMsgCrypt(this.token, this.Key, this.CorpID); // 会自动解构

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,

  ) { }

  async getAssesstToken() {
    const access_token = await this.redisService.get('assess_token');
    if (access_token) return access_token
    const { data } = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.CorpID}&corpsecret=${this.corpsecret}`)
    console.log(data.access_token, 'token')
    await this.redisService.set('assess_token', data.access_token, data.expires_in)
    return data.access_token
  }
  // 发送企业微信消息
  async sendMessage(message?: string) {
    try {
      const assess_token = await this.getAssesstToken()
      const { data } = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${assess_token}`, {
        touser: 'ZW001-202206-0143', // 发送人
        msgtype: "text",
        agentid: this.AgentId, // 应用id
        "text": {
          "content": message || '1'
        },
        safe: 0
      })
     
      if (data.errcode) {
        return '失败'
      } else {
        return '成功'
      }
    } catch (error) {
      throw error;
      
    }
   
  }
  // 验证
  async validate(msg_signature?: string, timestamp?: any, nonce?: any, echostr?: any) {
    let echostr1 = String(echostr).replace(' ', '+')
    console.log(msg_signature, timestamp, nonce, echostr1)

    const signature = this.wxBizMsgCrypt.GetSignature(timestamp, nonce, echostr1)
    if (signature !== msg_signature) {
      this.logger.warn('签名不正确');
      return false
    }

    const reult = this.wxBizMsgCrypt.VerifyURL(msg_signature, timestamp, nonce, echostr); // 会将密文 echostr 解密出来，在返回企业欸新即可

    return reult
  }



}
