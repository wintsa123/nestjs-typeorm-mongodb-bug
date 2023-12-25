
import { RequestParamsEnum } from '@src/enums';
import crypto from 'crypto';
import isStream from "is-stream"
interface Obj {
  [propName: string]: any
}
/**
 * @Author: 水痕
 * @Date: 2023-10-07 18:53:32
 * @LastEditors: 水痕
 * @Description: 随机生成指定范围内的随机数
 * @param {number} min
 * @param {number} max
 * @return {*}
 */
export const getRandomNum = (min: number, max: number): number => {
  return Math.floor(min + Math.random() * (max - min));
};

/**
 * @Author: 水痕
 * @Date: 2023-10-07 18:56:03
 * @LastEditors: 水痕
 * @Description: 生成随机长度的字符串
 * @param {number} length
 * @return {*}
 */
export const randomString = (length: number): string => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * @Author: 水痕
 * @Date: 2023-10-07 19:06:42
 * @LastEditors: 水痕
 * @Description: 字符串md5加密
 * @param {string} str
 * @return {*}
 */
export const strToMd5 = (str: string): string => {
  const md5 = crypto.createHash('md5');
  return md5.update(str).digest('hex');
};

/**
 * @Author: 水痕
 * @Date: 2023-10-07 19:06:42
 * @LastEditors: 水痕
 * @Description: hash加密
 * @param {string} str
 * @return {*}
 */
export const generateCacheKey = (data) => {
  // Use SHA-256 hash function to hash the request body
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  // Truncate or modify the hash if necessary to fit within Redis key length limit
  return hash;
}


/**
 * @Author: wintsa
 * @Date: 2023-12-25 15:47:29
 * @LastEditors: wintsa
 * @Description: copy法大大的sign逻辑
 * @return {*}
 */
export const sign = ({
  signStr,
  timestamp,
  appSecret,
}: {
  signStr: string
  timestamp: number | string
  appSecret: string 
}): string => {
  // 对排序后的参数字符串计算摘要，sha256Hex
  const signText = crypto.createHash("sha256").update(signStr).digest("hex")

  // 用时间戳计算临时签名密钥
  const timestampSecret = crypto
    .createHmac("sha256", appSecret)
    .update(String(timestamp))
    .digest()

  // 计算参数签名
  const hash = crypto.createHmac("sha256", timestampSecret).update(signText).digest("hex")

  return hash
}

export const formatParams=({
  data,
  appId,
  signMethod,
  nonce,
  timestamp,
  event
}) =>{
  const signParams = {
    [RequestParamsEnum.APP_ID]: appId,
    [RequestParamsEnum.SIGN_TYPE]: signMethod,
    [RequestParamsEnum.TIMESTAMP]: timestamp,
    [RequestParamsEnum.NONCE]: nonce,
    ['X-FASC-Event']: event,
    [RequestParamsEnum.DATA_KEY]: JSON.stringify(data || '')

  }
  return signParams
}

export const formatSignString = (signParams:Obj): string => {
  let params = { ...signParams }
  let strParam = ""
  // 去除字节流参数
  removeStream(params)
  // 去除值为空的字段
  params = deepRemoveNull(params)
  const keys = Object.keys(params)
  // 排序
  keys.sort((a, b) => a.localeCompare(b))
  // 参数拼接，去除重复的key
  for (const k in keys) {
    if (!keys.hasOwnProperty(k)) {
      continue
    }
    strParam += "&" + keys[k] + "=" + params[keys[k] as keyof Obj]
  }
  const signStr = strParam.slice(1)
  return signStr
}


function removeStream(data: any) {
  for (const key in data) {
    if (isStream(data[key])) {
      delete data[key]
    }
  }
}

function deepRemoveNull(obj: any) {
  if (isArray(obj)) {
    return obj.map(deepRemoveNull)
  } else if (isObject(obj)) {
    const result: any = {}
    for (const key in obj) {
      const value = obj[key]
      if (!isBlank(value)) {
        result[key] = deepRemoveNull(value)
      }
    }
    return result
  } else {
    return obj
  }
}

function isBuffer(x: any): boolean {
  return Buffer.isBuffer(x)
}

function isArray(x: any): boolean {
  return Array.isArray(x)
}

function isObject(x: any): boolean {
  return typeof x === "object" && !isArray(x) && !isStream(x) && !isBuffer(x)
}

function isNull(x: any): boolean {
  return x === null
}

function isBlank(x: any): boolean {
  if (typeof x === 'string') {
    return x.trim() === ''
  } else {
    return x === null || x === undefined
  }
}
