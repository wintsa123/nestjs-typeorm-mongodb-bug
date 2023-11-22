import { Injectable } from '@nestjs/common';
import { CreateSocketDto } from './dto/create-socket.dto';
import { UpdateSocketDto } from './dto/update-socket.dto';
import { WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
export class SocketService {
  
  @WebSocketServer()
  server?: Server ;
  
  sendNotificationToClients(msg,@ConnectedSocket() client: Socket) {
    console.log(this.server,111)
    client.broadcast.emit('message', msg);
    
    // client.to('268').emit('message', msg);

  }
 

 

  
}
