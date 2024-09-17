import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(User)
    private readonly userRepositoy: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async saveUser(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    try {
      const userCreated = this.userRepositoy.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepositoy.save(userCreated);

      return {
        user: userCreated,
        token: this.getJwtToken({ id: userCreated.id }),
      };
      
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async logInUser(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const userFound = await this.userRepositoy.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });
 

    if (!bcrypt.compareSync(password, userFound.password)) {
      throw new UnauthorizedException('Not valid credentials');
    }

    return {
      token: this.getJwtToken({ id: userFound.id }),
    }; // TODO: RETORNAR JWT
  }

 /* ----------------------------- private methods ---------------------------- */

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBExeptions(error: any): never {
    if (error?.code === '23505') {
      // * duplicate key error code
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error?.message);
    throw new InternalServerErrorException(error?.message);
  }
}
