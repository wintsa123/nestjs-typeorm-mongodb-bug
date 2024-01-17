import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import { CronJob } from 'cron';

@Injectable()
export class TasksService {
    constructor(
        // private readonly workData: workData,
        private schedule: SchedulerRegistry
    ) {

    }
   
//     @Cron('45 17 * * 1-5') // 5:35 PM
//     async dakatiXin4() {
//         if (process.env.NODE_APP_INSTANCE !== '0') return
//         try {

           

//         } catch (error) {

//         }

//     }
// }

}