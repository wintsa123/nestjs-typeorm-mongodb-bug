import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import { CronJob } from 'cron';

import { Connection, createConnection } from 'typeorm';
@Injectable()
export class TasksService {
    constructor(
        private readonly configService: ConfigService,
        private connection: Connection,
        // private readonly workData: workData,
        private schedule: SchedulerRegistry


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
    @Cron(CronExpression.EVERY_DAY_AT_4AM)
    // @Cron(CronExpression.EVERY_5_SECONDS)

    async setCorn() {

        const jobs = this.schedule.getCronJobs();
        jobs.forEach((_value, key, _map) => {
            let next;
            try {
                // this.schedule.deleteCronJob(key);
                let jo=this.schedule.getCronJob(key)
                jo.stop()
                this.logger.warn(`job ${key} stop!`);

            } catch (e) {
                next = 'error: next fire date is in the past!';
            }
        });
        const nowDay = new Date()
        const year = nowDay.getFullYear();
        const month = (nowDay.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, so add 1
        const day = nowDay.getDate().toString().padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;
        console.log(formattedDate)

        let oaUser = await this.connection.query(`select lx from uf_jjrapxx where RQ='${formattedDate}' `)
        if (oaUser[0].LX == 0) {

            jobs.forEach((_value, key, _map) => {
                let next;
                try {
                    // this.schedule.deleteCronJob(key);
                    let jo=this.schedule.getCronJob(key)
                    jo.start();
                    this.logger.warn(`job ${key} start!`);
    
                } catch (e) {
                    next = 'error: next fire date is in the past!';
                }
            });
            

        }
      


    }
 
    private readonly logger = new Logger(TasksService.name);
      private readonly robot = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=291dfc0c-3545-41e3-a355-6fb592f7c766`;
    // private readonly robot = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=4db5544c-1ac9-42ea-8661-fe8b55051002`; //信息部群

    @Cron('40 08 * * *')
    // @Cron(CronExpression.EVERY_5_SECONDS)
    async weatherFun() {
        // if (process.env.NODE_APP_INSTANCE !== '0') return
        try {
            //天气api，地址广州，具体citycode可以查询文件/网络
            const url = `http://t.weather.sojson.com/api/weather/city/101280101`;
            const { data: weather } = await axios.get(url);
            if (weather.status !== 200) {
                this.logger.warn(weather.message)
                return
            }

            let dataObj = {
                "msgtype": "markdown",
                "markdown": {
                    "content": `# 今天日期是${weather.time.split(' ')[0]}，${weather.cityInfo.parent + weather.cityInfo.city}今日白天天气情况如下： \n \n**温度区间：<font color=\"#4dc75b\">${weather.data.forecast[0].low}~${weather.data.forecast[0].high}</font>**\n**湿度：<font color=\"black\">${weather.data.shidu}</font>**\n**天气：<font color=\"black\">${weather.data.forecast[0].type}</font>**\n**日出时间：<font color=\"#fd0000\">${weather.data.forecast[0].sunrise}</font>**\n**日落时间：<font color=\"#e35a06\">${weather.data.forecast[0].sunset}</font>**\n**空气质量：<font color=\"${Number(weather.data.forecast[0].aqi) < 50 ? '#4dc75b' : (Number(weather.data.forecast[0].aqi) < 100 ? 'yellow' : 'red')}\">${weather.data.quality}，${weather.data.ganmao}</font>**\n\n\n
                >**pm2.5:<font color=\"${Number(weather.data.pm25) < 35 ? '#4dc75b' : (Number(weather.data.pm25) < 75 ? 'yellow' : 'red')}\">${weather.data.pm25}</font>**
                >**pm1.0:<font color=\"${Number(weather.data.pm10) < 50 ? '#4dc75b' : (Number(weather.data.pm10) < 100 ? 'yellow' : 'red')}\">${weather.data.pm10}</font>**
                >**空气质量指数:<font color=\"${Number(weather.data.forecast[0].aqi) < 50 ? '#4dc75b' : (Number(weather.data.forecast[0].aqi) < 100 ? 'yellow' : 'red')}\">${weather.data.forecast[0].aqi}</font>**
                >**风向:${weather.data.forecast[0].fx}**
                >**风力:${weather.data.forecast[0].fl}**

                 `
                }
            }
            const { data } = await axios.post(this.robot, dataObj
            );
            if (data.errcode == 0) {
                this.logger.warn(data.errmsg)
                return
            }
        } catch (error) {
            this.logger.error(error)
        }

    }
    @Cron('40 08 * * *')

    // @Cron(CronExpression.EVERY_5_SECONDS)
    async newsFun() {
        // if (process.env.NODE_APP_INSTANCE !== '0') return

        try {
            const newsUrl = `https://api.oioweb.cn/api/common/HotList`
            const { data: news } = await axios.get(newsUrl);
            if (news.code !== 200) {
                this.logger.warn(news)
                return
            }
            let Allnew: any[] = []
            Allnew = Allnew.concat(news.result['实时榜中榜'].filter((e: any) => e.index > 0))
            Allnew = Allnew.concat(news.result['微博'][0])
            Allnew = Allnew.concat(news.result['百度'].filter((e: any) => e.index < 4))
            Allnew = Allnew.concat(news.result['第一财经'].filter((e: any) => e.index < 9))
            let newObj = {
                "msgtype": "markdown",
                "markdown": {
                    'content': `# 今日新闻\n${Allnew.map((e, i) => {
                        return `${i + 1}、[${e.title}](${e.href})`
                    }).join('\n')}
            `}
            }
            const { data: result } = await axios.post(this.robot, newObj);
            if (result.errcode == 0) {
                this.logger.warn(result.errmsg)
                return
            }

        } catch (error) {
            this.logger.error(error)

        }

    }

    @Cron('35 8 * * 1-5') // 8:35 AM
    async dakatiXin() {
        // if (process.env.NODE_APP_INSTANCE !== '0') return
        try {

            let newObj = {
                "msgtype": "text",
                "text": {
                    "content": "打卡时间快到咯，兄弟姐妹们要记得打卡",
                    "mentioned_list": ["@all"],
                }
            }
            const { data: result } = await axios.post(this.robot, newObj);
            if (result.errcode == 0) {
                this.logger.warn(result.errmsg)
                return
            }

        } catch (error) {
            this.logger.error(error)

        }

    }

    @Cron('05 12 * * 1-5') // 11:55 AM
    async dakatiXin2() {
        // if (process.env.NODE_APP_INSTANCE !== '0') return
        try {

            let newObj = {
                "msgtype": "text",
                "text": {
                    "content": "打卡时间快到咯，兄弟姐妹们要记得打卡",
                    "mentioned_list": ["@all"],
                }
            }
            const { data: result } = await axios.post(this.robot, newObj);
            if (result.errcode == 0) {
                this.logger.warn(result.errmsg)
                return
            }

        } catch (error) {
            this.logger.error(error)

        }

    }

    @Cron('35 13 * * 1-5') // 1:35 PM
    async dakatiXin3() {
        // if (process.env.NODE_APP_INSTANCE !== '0') return
        try {

            let newObj = {
                "msgtype": "text",
                "text": {
                    "content": "打卡时间快到咯，兄弟姐妹们要记得打卡",
                    "mentioned_list": ["@all"],
                }
            }
            const { data: result } = await axios.post(this.robot, newObj);
            if (result.errcode == 0) {
                this.logger.warn(result.errmsg)
                return
            }

        } catch (error) {
            this.logger.error(error)

        }

    }
    @Cron('45 17 * * 1-5') // 5:35 PM
    async dakatiXin4() {
        // if (process.env.NODE_APP_INSTANCE !== '0') return
        try {

            let newObj = {
                "msgtype": "text",
                "text": {
                    "content": "打卡时间快到咯，兄弟姐妹们要记得打卡",
                    "mentioned_list": ["@all"],
                }
            }
            const { data: result } = await axios.post(this.robot, newObj);
            if (result.errcode == 0) {
                this.logger.warn(result.errmsg)
                return
            }

        } catch (error) {
            this.logger.error(error)

        }

    }
}

