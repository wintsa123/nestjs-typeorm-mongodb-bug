import { Injectable, Logger } from '@nestjs/common';
import { WxchatDto } from './dto/wxchat.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@src/plugin/redis/redis.service';
import WXBizMsgCrypt from '@wintsa/wxmsgcrypt';


@Injectable()
export class WxchatService {
  private corpsecret = this.configService.get('wxChat.corpsecret')
  private dakaSecret = this.configService.get('wxChat.dakaSecret')

  private CorpID = this.configService.get('wxChat.CorpID')
  private AgentId = this.configService.get('wxChat.AgentId')
  private readonly logger = new Logger(WxchatService.name);
  private token = this.configService.get('wxChat.Token')
  private Key = this.configService.get('wxChat.Key')

  private wxBizMsgCrypt = new WXBizMsgCrypt(this.token, this.Key, this.CorpID); // 会自动解构

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,

  ) { }

  async getAssesstToken(params = 'default') {
    const access_token = await this.redisService.get('assess_token');
    if (access_token) return access_token
    let data
    switch (params) {
      case 'daka':
        data = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.CorpID}&corpsecret=${this.dakaSecret}`)
        break;
      default:
        data = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.CorpID}&corpsecret=${this.corpsecret}`)
        break;
    }
    await this.redisService.set('assess_token', data.access_token, data.expires_in)
    return data.data.access_token
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
    const signature = this.wxBizMsgCrypt.GetSignature(timestamp, nonce, echostr1)
    if (signature !== msg_signature) {
      this.logger.warn('签名不正确');
      return false
    }
    const reult = this.wxBizMsgCrypt.VerifyURL(msg_signature, timestamp, nonce, echostr); // 会将密文 echostr 解密出来，在返回企业欸新即可
    return reult
  }
  //正式接受
  async getMsg(data: any, query: any) {
    const { msg_signature, timestamp, nonce } = query;
    let recivedMsg = this.wxBizMsgCrypt.DecryptMsg(msg_signature, timestamp, nonce, data);
    console.log(recivedMsg)
    const testXmlData = MessageHandle.textXml({
      toUser: recivedMsg.FromUserName, // 员工号?或者账号就是 userid
      fromUser: this.CorpID, // 此处固定为 企业CorpID
      content: 'hello'  // 我们要发送的内容
    })
    // 加密消息体
    let sendReplyMsg = this.wxBizMsgCrypt.EncryptMsg(testXmlData);

    return sendReplyMsg
  }





}
/**
 * @description: 为了演示，我们构建一个明文的文本消息结构
 * @param {type} 
 * @return: 
 */
class MessageHandle {
  static textXml({ toUser, fromUser, content }) {
    const sTimeStamp = parseInt(String(new Date().valueOf() / 1000));
    return {
      sReplyMsg: `<xml><ToUserName><![CDATA[${toUser}]]></ToUserName><FromUserName><![CDATA[${fromUser}]]></FromUserName><CreateTime>${sTimeStamp}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${content}]]></Content></xml>`,
      sTimeStamp
    }
  }
}