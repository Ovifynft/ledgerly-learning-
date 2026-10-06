import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AccountsController } from '../src/accounts/accounts.controller.js';
import { AccountsService } from '../src/accounts/accounts.service.js';
import { PrismaService } from '../src/generated/prisma/prisma.service.js';
import { UsersController } from '../src/users/users.controller.js';
import { UsersService } from '../src/users/users.service.js';

describe('Ledgerly endpoints (e2e)', () => {
  let app: INestApplication<App>;
  const user = {
    id: 1,
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
  };
  const account = {
    id: 1,
    userId: 1,
    name: 'Main Wallet',
    type: 'WALLET',
    currency: 'NGN',
    balance: '0',
  };
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    account: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController, AccountsController],
      providers: [
        UsersService,
        AccountsService,
        { provide: PrismaService, useValue: prisma },
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

  it('creates and fetches a user', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(user);
    prisma.user.create.mockResolvedValue(user);

    await request(app.getHttpServer())
      .post('/users')
      .send({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .expect(201, user);
    await request(app.getHttpServer()).get('/users/1').expect(200, user);
  });

  it('validates user bodies and IDs and reports missing users', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'bad' })
      .expect(400);
    await request(app.getHttpServer()).get('/users/nope').expect(400);
    prisma.user.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/users/99').expect(404);
  });

  it('creates, lists, filters, and fetches accounts', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.account.create.mockResolvedValue(account);
    prisma.account.findMany.mockResolvedValue([account]);
    prisma.account.findUnique.mockResolvedValue({ ...account, user });

    await request(app.getHttpServer())
      .post('/accounts')
      .send({
        userId: 1,
        name: account.name,
        type: account.type,
        currency: account.currency,
      })
      .expect(201, account);
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: 0,
      },
    });
    await request(app.getHttpServer()).get('/accounts').expect(200, [account]);
    await request(app.getHttpServer())
      .get('/accounts?userId=1')
      .expect(200, [account]);
    expect(prisma.account.findMany).toHaveBeenLastCalledWith({
      where: { userId: 1 },
    });
    await request(app.getHttpServer())
      .get('/accounts/1')
      .expect(200, { ...account, user });
  });

  it('validates account input and reports missing records', async () => {
    await request(app.getHttpServer()).get('/accounts?userId=nope').expect(400);
    await request(app.getHttpServer()).get('/accounts/nope').expect(400);
    await request(app.getHttpServer())
      .post('/accounts')
      .send({ ...account, balance: 100 })
      .expect(400);
    prisma.user.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post('/accounts')
      .send({
        userId: 99,
        name: account.name,
        type: account.type,
        currency: account.currency,
      })
      .expect(404);
    prisma.account.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/accounts/99').expect(404);
  });

  afterAll(() => app.close());
});
