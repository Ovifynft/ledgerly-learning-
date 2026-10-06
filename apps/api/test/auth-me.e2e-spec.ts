import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthGuard } from '../src/auth/auth.guard.js';
import { AuthService } from '../src/auth/auth.service.js';
import { PrismaService } from '../src/generated/prisma/prisma.service.js';
import { UsersService } from '../src/users/users.service.js';

describe('GET /auth/me', () => {
  let app: INestApplication<App>;
  const publicUser = {
    id: 7,
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = { user: { findUnique: vi.fn(), create: vi.fn() } };
  const jwt = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn().mockResolvedValue({ sub: 7, email: publicUser.email }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        AuthGuard,
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

  it('returns the authenticated user without passwordHash', async () => {
    prisma.user.findUnique.mockResolvedValue(publicUser);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer valid-token')
      .expect(200, {
        ...publicUser,
        createdAt: publicUser.createdAt.toISOString(),
        updatedAt: publicUser.updatedAt.toISOString(),
      });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: expect.objectContaining({ email: true }),
    });
  });

  it('rejects requests without authentication', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  afterAll(() => app.close());
});
