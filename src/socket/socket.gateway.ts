import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { WsServiceResponseInterceptor } from "src/interceptors/websock.interceptor";
import { SocketService } from './socket.service';
import { CreateSocketDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { WsServiceExceptionFilter } from '@src/filters/socket.filter';
import { Socket, Server } from 'socket.io';
@UseInterceptors(new WsServiceResponseInterceptor())
@UseFilters(new WsServiceExceptionFilter())

@WebSocketGateway(9088, {
  transports: ['websocket'],
  cors: {
    origin: '*',
},
})
export class SocketGateway {
  constructor(private readonly socketService: SocketService) {}
  @WebSocketServer()
  server?: Server;
  @SubscribeMessage('clientUserId')
  create(@MessageBody() clientUserId: string,@ConnectedSocket() client: Socket) {
    client.join(clientUserId)
    return true;
  }
  sendMessageToClient(clientId: string, message: string) {
    this.server?.to(clientId).emit('message', message);
  }
}
