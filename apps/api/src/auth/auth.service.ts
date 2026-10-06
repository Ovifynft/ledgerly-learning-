import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../generated/prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
const scrypt = promisify(scryptCallback);
const invalidCredentials = () =>
  new UnauthorizedException('Invalid email or password');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException('A user with this email already exists');
    const salt = randomBytes(16).toString('hex');
    const key = (await scrypt(dto.password, salt, 64)) as Buffer;
    return this.usersService.create(
      { email: dto.email, firstName: dto.firstName, lastName: dto.lastName },
      `scrypt$${salt}$${key.toString('hex')}`,
    );
  }

  async currentUser(id: number) {
    return this.usersService.findPublic(id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!user) throw invalidCredentials();
    const [, salt, encodedHash] = user.passwordHash.split('$');
    if (!salt || !encodedHash) throw invalidCredentials();
    const supplied = (await scrypt(dto.password, salt, 64)) as Buffer;
    const stored = Buffer.from(encodedHash, 'hex');
    if (stored.length !== supplied.length || !timingSafeEqual(stored, supplied))
      throw invalidCredentials();
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return { accessToken };
  }
}
