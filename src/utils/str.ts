
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
   * @Author: 水痕
   * @Date: 2022-08-12 22:23:43
   * @LastEditors: wintsa
   * @Description: 生成redis的key
   * @param {string} method 请求方式
   * @param {string} url url地址
   * @param {string} identity 身份
   * @return {*}
   */

export const redisCacheKey=(method: string, url: string, body?: any): string =>{
  console.log(method, 'method')


  if (body !== undefined && body !== null) {
    const hash = generateCacheKey(body)
    console.log(hash, 'hash')
    if (method == 'GET') {
      return `${method}:${url}:${hash}`;

    } else {
      return `${method}:${hash}`;

    }
  } else {
    return `${method}:${url}`;

  }
}