import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './login.service';
import { LoginVo } from './vo/login.vo';
import * as svgCaptcha from 'svg-captcha';
import { HttpException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('admin')
@Controller()
export class LoginController {
  constructor(private readonly loginService: LoginService) {}
  @Post('login')
  async loginApi(@Body() req: LoginDto): Promise<LoginVo> {
    if (req.captcha.toLowerCase() === req.codeText.toLowerCase()) {
      return await this.loginService.loginApi(req);
    } else {
      throw new HttpException('验证码错误', HttpStatus.OK);
    }
  }

  @Get('refresh')
  async refreshTokenApi(@Query('token') token: string): Promise<LoginVo> {
    return await this.loginService.refreshTokenApi(token);
  }

  @Get('captcha')
  getCaptchaApi() {
    const captcha = svgCaptcha.create({
      size: 4, //生成几个验证码
      fontSize: 50, //文字大小
      width: 100, //宽度
      height: 34, //高度
      background: '#fff', //背景颜色
    });
    // session['code'] = captcha['text']; //存储验证码记录到session
    // res.set('Content-Type', 'image/svg+xml');
    // res.send(captcha['data']);
    return captcha;
  }
}
