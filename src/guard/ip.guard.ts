import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ipWhitelist implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
    ) { }
    private readonly allowedIPs = this.configService.get('ipWhitelist')


    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const clientIP = request.ip;

        return this.allowedIPs.includes(clientIP);
    }
}