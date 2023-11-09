import { Injectable, Logger } from '@nestjs/common';
import { WxchatDto } from './dto/wxchat.dto';
import winston from 'winston';
const crypto = require('crypto');

import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@src/plugin/redis/redis.service';
import {
  // PKCS7Decode,
  // PKCS7Encode,
  WxCrypto,
  aes256Decrypt,
  // aes256Encrypt,
  // buildXML,
  // buildXMLSync,
  // parseXML,
  // parseXMLSync,
  sha1
} from 'node-wxcrypto'

@Injectable()
export class WxchatService {
  private corpsecret = this.configService.get('wxChat.corpsecret')
  private CorpID = this.configService.get('wxChat.CorpID')
  // private CorpID = 5629502985612755

  private AgentId = this.configService.get('wxChat.AgentId')
  private readonly logger = new Logger(WxchatService.name);
  private token = 'KxvcyR3SQqTIzAVyIQTn2'
  private aesKey = Buffer.from('Fc3rx5pyQ4BePDDT7t5jHOvTzfdVbBDgySDhbebWDAq' + '=', 'base64')
  private IV = this.aesKey.slice(0, 16)

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
  // 验证
  async validate(msg_signature?: string, timestamp?: any, nonce?: any, echostr?: any) {
    let echostr1=String(echostr).replace(' ','+')
    console.log( msg_signature,timestamp, nonce, echostr1)

    const signature = sha1(this.token, timestamp, nonce, echostr1)
    if (signature !== msg_signature) {
      this.logger.warn('签名不正确');
      return false
    }

    if (this.aesKey.length !== 32) {
      this.logger.warn('长度出错');
      return false

    }
    let result=this.decrypt(echostr1)
    console.log('result:',result)
    return result
  }
  encrypt(xmlMsg) {
    /*
     *@params String xmlMsg 格式化后的 xml 字符串
     *@return String 加密后的字符串 填入到 Encrypt 节点中
     * 参照官方文档 需要返回一个buf: 随机16字节 + xmlMsg.length(4字节）+xmlMsg+appid。
     * buf的字节长度需要填充到 32的整数，填充长度为 32-buf.length%32, 每一个字节为 32-buf.length%32
     */
    let random16 = crypto.pseudoRandomBytes(16);
    let msg = new Buffer(xmlMsg);
    let msgLength = new Buffer(4);

    msgLength.writeUInt32BE(msg.length, 0);
    let corpId = new Buffer(this.CorpID);

    let raw_msg = Buffer.concat([random16, msgLength, msg, corpId]);
    let cipher = crypto.createCipheriv('aes-256-cbc', this.aesKey, this.IV);
    cipher.setAutoPadding(false);//重要，autopadding填充的内容无法正常解密

    raw_msg = this.PKCS7Encode(raw_msg);

    let cipheredMsg = Buffer.concat([cipher.update(/*encoded*/raw_msg), cipher.final()]);

    return cipheredMsg.toString('base64');
  }

  decrypt(text) {
    /*
     *@params String text 需要解密的字段（Encrypt节点中的内容）
     * @return String msg_content 返回消息内容（xml字符串）
     */

    let plain_text;
    let decipher = crypto.Decipheriv('aes-256-cbc', this.aesKey, this.IV)
    // crypto.Decipheriv == crypto.createDecipheriv 两个方法是一样的
    decipher.setAutoPadding(false);//重要

    let decipheredBuff = Buffer.concat([decipher.update(text, 'base64'), decipher.final()])
    decipheredBuff = this.PKCS7Decode(decipheredBuff)

    let len_netOrder_corpid = decipheredBuff.slice(16)
    console.log(len_netOrder_corpid.toString('utf-8'))

    //切割掉16个随机字符，剩余为 (4字节的 msg_len) + msg_content(长度为 msg_len ) + msg_appId 
    let msg_len = len_netOrder_corpid.slice(0, 4).readUInt32BE(0)

    let msg_content = len_netOrder_corpid.slice(4, msg_len + 4).toString('utf-8')

    //  let msg_appId =len_netOrder_corpid.slice(msg_len+4).toString('utf-8')
    return msg_content
  }
  PKCS7Decode(buff) {
    /*
     *去除尾部自动填充的内容
     */
    let padContent = buff[buff.length - 1]
    // let padContent = buff.at(-1)

    if (padContent < 1 || padContent > 32) {
      padContent = 0
    }
    let padLen = padContent;//根据填充规则，填充长度 = 填充内容，这一步赋值可以省略
    return buff.slice(0, buff.length - padLen)
  }
  PKCS7Encode(buff) {
    let blockSize = 32;
    let needPadLen = 32 - buff.length % 32
    if (needPadLen == 0) {
      needPadLen = blockSize
    }
    let pad = new Buffer(needPadLen)
    pad.fill(needPadLen)
    let newBuff = Buffer.concat([buff, pad])
    return newBuff
  }


}
