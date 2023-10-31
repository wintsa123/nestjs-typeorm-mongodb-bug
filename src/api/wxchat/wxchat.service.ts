import { Injectable } from '@nestjs/common';
import { WxchatDto } from './dto/wxchat.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@src/plugin/redis/redis.service';
import { LoggerService } from '@src/plugin/logger/logger.service';

@Injectable()
export class WxchatService {
  private corpsecret = this.configService.get('wxChat.corpsecret')
  private CorpID = this.configService.get('wxChat.CorpID')
  private AgentId = this.configService.get('wxChat.AgentId')

  constructor(
    private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) { }

  async getAssesstToken() {
    const access_token = await this.redisService.get('assess_token');
    if (access_token) return access_token
    const { data } = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.CorpID}&corpsecret=${this.corpsecret}`)
    console.log(data.access_token,'token')
    await this.redisService.set('assess_token', data.access_token, data.expires_in)
    return data.access_token
  }
  // 发送企业微信消息
  async sendMessage(message?: string) {
    const assess_token = await this.getAssesstToken()
    const { data } = await axios.post('https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=' + assess_token, {
      touser: 'User01', // 发送人
      msgtype: "textcard",
      agentid: this.AgentId, // 应用id
      textcard: {
        title: `标题`,
        description: message || '描述',
        btntxt: '查看详情'
      },
    })
    console.log(data)
    if (data.errcode) {
      return '失败'
    } else {
      return '成功'
    }
  }


}
