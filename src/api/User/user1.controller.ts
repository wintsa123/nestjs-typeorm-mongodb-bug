import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    Delete,
} from '@nestjs/common';
import { UserService1 } from './user1.service';
import { User as UserModel } from '@prisma/client';

@Controller()
export class AppController {
    constructor(
        private readonly userService: UserService1,
    ) { }




    @Post('user')
    async signupUser(
        @Body() userData: { name: string; phone: string, password: string,role?:string },
    ): Promise<UserModel> {
        userData['role'] = '1'
        return this.userService.createUser(userData);
    }


}