export enum RequestParamsEnum {
  /**
   * 企业控制台创建应用后得到的应用ID
  */
  APP_ID = "X-FASC-App-Id",
  /**
   * 签名算法类型:固定HMAC-SHA256
   */
  SIGN_TYPE = "X-FASC-Sign-Type",
  /**
   * 请求参数的签名值
   */
  SIGN = "X-FASC-Sign",
  /**
   * 时间戳(yyyy-MM-dd HH:mm:ss.sss)，时间戳必须是保证是当前时间，同时跟法大大这边的服务器时间正负不能相差5分钟
   */
  TIMESTAMP = "X-FASC-Timestamp",
  /**
   * FASC.openApi子版本号。如当前规划新版本为：5.1。注意：若指定子版本号下不存在接口，系统将会报错返回。
   */
  SUBVERSION = 'X-FASC-Api-SubVersion',
  /**
   * 随机数(32位, 10分钟内不能重复请求)
   */
  NONCE = "X-FASC-Nonce",
  /**
   * 平台令牌,通过获取令牌接口返回
   */
  ACCESS_TOKEN = "X-FASC-AccessToken",
  /**
   * 请求参数的集合，除公共请求参数都必须放在这个参数中传递（除文件，字节流等）,json字符串.
   */
  DATA_KEY = "bizContent",
  GRANT_TYPE = "X-FASC-Grant-Type",
  FDD_REQUEST_ID = "X-FASC-Request-Id",
  /**
   * 默认授权类型
   **/
  CLIENT_CREDENTIAL = "client_credential",
  EUI_TIMESTAMP = "timestamp",
  EUI_SIGNATURE = "signature",
  METHOD_POST = 'POST',
  METHOD_GET = 'GET',
}


export enum signTaskStatus {
  task_created = "任务创建中",
  finish_creation = '已创建',
  fill_progress = "填写进行中",
  fill_completed = " 填写已完成",
  sign_progress = "签署进行中",
  sign_completed = "签署已完成",
  task_finished = "任务已结束",
  task_terminated = "任务异常停止",
  expired = "已逾期",
  abolishing = "作废中",
  revoked = "已作废",
}