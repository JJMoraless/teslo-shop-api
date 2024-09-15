import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('ProductsService');
   constructor(
    @InjectRepository(User)
    private readonly userRepositoy: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    try {
      const userCreated = this.userRepositoy.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepositoy.save(userCreated);

    
      return userCreated;   // TODO: RETORNAR JWT
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const userFound = await this.userRepositoy.findOne({
      where: { email },
      select: { email: true, password: true },
    });

    if (!userFound) {
      throw new UnauthorizedException('Not valid credentials');
    }

    if (!bcrypt.compareSync(password, userFound.password)) {
      throw new UnauthorizedException('Not valid credentials');
    }

    return userFound; // TODO: RETORNAR JWT
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateUserDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
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
