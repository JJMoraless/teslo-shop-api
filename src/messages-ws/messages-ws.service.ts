import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';

interface ConnectedClient {
  [id: string]: {
    socket: Socket;
    user: User;
  };
}

@Injectable()
export class MessagesWsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // map string to socket
  private conectedClients: ConnectedClient = {};

  async registerClient(client: Socket, userId: string) {
    const userFound = await this.userRepository.findOneBy({ id: userId });
    this.checkConnectionUser(userFound);

    if (!userFound) {
      throw new Error('User not found');
    }

    if (!userFound.isActive) {
      throw new Error('User not active');
    }

    this.conectedClients[client.id] = {
      socket: client,
      user: userFound,
    };
  }

  removeClient(client: Socket) {
    delete this.conectedClients[client.id];
  }

  getAmountClients(): number {
    return Object.keys(this.conectedClients).length;
  }

  getClients(): string[] {
    return Object.keys(this.conectedClients);
  }

  findUserBySocket(socket: Socket): User {
    return this.conectedClients[socket.id].user;
  }

  checkConnectionUser(userToCheck: User) {
    const clients = Object.values(this.conectedClients);
    const clientFound = clients.find(({ user }) => user.id === userToCheck.id);
    clientFound?.socket?.disconnect();
  }
}
