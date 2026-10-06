import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/generated/prisma/prisma.service.js';
import { UsersService } from '../src/users/users.service.js';

describe('Registration (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = {
    user: { findUnique: vi.fn(), create: vi.fn() },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: vi.fn() } },
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

  it('registers a user with a hash and omits passwordHash from the response', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data, select }) => ({
      id: 1,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(select ? {} : { passwordHash: data.passwordHash }),
    }));

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ada@example.com',
        password: 'correct horse battery staple',
        firstName: 'Ada',
        lastName: 'Lovelace',
      })
      .expect(201);

    expect(response.body).not.toHaveProperty('passwordHash');
    expect(prisma.user.create).toHaveBeenCalled();
    const [{ data }] = prisma.user.create.mock.calls[0];
    expect(data.passwordHash).toMatch(/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
    expect(data.passwordHash).not.toContain('correct horse battery staple');
  });

  it('rejects invalid input and duplicate emails', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'bad',
        password: 'short',
        firstName: '',
        lastName: '',
      })
      .expect(400);
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ada@example.com',
        password: 'correct horse battery staple',
        firstName: 'Ada',
        lastName: 'Lovelace',
      })
      .expect(409);
  });

  afterAll(() => app.close());
});
