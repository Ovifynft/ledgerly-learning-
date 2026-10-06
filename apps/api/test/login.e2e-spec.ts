import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { PrismaService } from '../src/generated/prisma/prisma.service.js';
import { UsersService } from '../src/users/users.service.js';

describe('Login and authentication guard', () => {
  let app: INestApplication<App>;
  const salt = '00112233445566778899aabbccddeeff';
  const password = 'correct horse battery staple';
  const hash = 'scrypt$' + salt + '$' + '00'.repeat(64);
  const prisma = { user: { findUnique: vi.fn(), create: vi.fn() } };
  const jwt = {
    signAsync: vi.fn().mockResolvedValue('signed-token'),
    verifyAsync: vi.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  beforeEach(() => vi.clearAllMocks());

  it('returns a JWT for valid credentials', async () => {
    const crypto = await import('node:crypto');
    const key = (await new Promise((resolve, reject) =>
      crypto.scrypt(password, salt, 64, (e, k) => (e ? reject(e) : resolve(k))),
    )) as Buffer;
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'ada@example.com',
      passwordHash: `scrypt$${salt}$${key.toString('hex')}`,
    });
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ada@example.com', password })
      .expect(201, { accessToken: 'signed-token' });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'ada@example.com',
    });
  });

  it('uses the same 401 response for unknown users and wrong passwords', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'missing@example.com', password })
      .expect(401);
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'ada@example.com',
      passwordHash: hash,
    });
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong password' })
      .expect(401);
  });

  it('rejects invalid login input', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bad', password: 'short' })
      .expect(400);
  });

  afterAll(() => app.close());
});
