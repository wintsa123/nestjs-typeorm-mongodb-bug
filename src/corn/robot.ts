import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    @Cron('40 08 * * *')
    // @Cron(CronExpression.EVERY_5_SECONDS)

    async handleCron() {

        //天气api，地址广州，具体citycode可以查询文件/网络
        const url = `http://t.weather.sojson.com/api/weather/city/101280101`;
        const { data: weather } = await axios.get(url);
        if (weather.status !== 200) {
            this.logger.warn(weather.message)
            return
        }
        // const robot = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=4db5544c-1ac9-42ea-8661-fe8b55051002`;

        const robot = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=aebfebdd-779c-460f-8838-d06bb51e51ab`;
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
        const { data } = await axios.post(robot, dataObj
        );
        if (data.errcode == 0) {
            this.logger.warn(data.errmsg)
            return
        }

        const newsUrl = `https://api.oioweb.cn/api/common/HotList`
        const { data: news } = await axios.get(newsUrl);
        if (news.code !== 200) {
            this.logger.warn(news)
            return
        }
        let Allnew: any[] = []
        Allnew=Allnew.concat(news.result['实时榜中榜'].filter((e: any) => e.index > 0))
        Allnew=Allnew.concat(news.result['微博'][0])
        Allnew=Allnew.concat(news.result['百度'].filter((e: any) => e.index < 4))
        Allnew=Allnew.concat(news.result['第一财经'].filter((e: any) => e.index < 9))
        let newObj = {
            "msgtype": "markdown",
            "markdown": {
                'content': `# 今日新闻\n${Allnew.map(e => {
                    return `[${e.title}](${e.href})`
                }).join('\n')}
            `}
        }
        const { data: result } = await axios.post(robot, newObj);
        console.log(result)
        if (result.errcode == 0) {
            this.logger.warn(result.errmsg)
            return
        }

    }
}