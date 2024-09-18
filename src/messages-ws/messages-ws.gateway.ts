import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error) {
      return client.disconnect();
    }

    this.wss.emit('clients-updated', this.messagesWsService.getClients());

    const connectedClients = this.messagesWsService.getAmountClients();
    console.log({ connectedClients });
  }

  handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client);
    this.wss.emit('clients-updated', this.messagesWsService.getClients());

    const connectedClients = this.messagesWsService.getAmountClients();
    console.log({ connectedClients });
  }

  @SubscribeMessage('message-from-client')
  async handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    //* emitir evento solo para el cliente emisor
    // client.emit('message-from-server', {
    //   fullName: 'Soy Yo',
    //   message: payload.message || 'no message',
    // });


    const userFound = this.messagesWsService.findUserBySocket(client)

    //* emitir evento a todos los clientes, menos al cliente emisor
    // client.broadcast.emit('message-from-server', {
    //   fullName: userFound.fullName,
    //   message: payload.message || 'no message',
    // });

    //* emitir evento a todos los clientes
    this.wss.emit('message-from-server', {
      fullName: userFound.fullName,
      message: payload.message || 'no message',
    });
  }

}
