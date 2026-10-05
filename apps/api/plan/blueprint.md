# Ledgerly API Blueprint

## Scope For Today

Build the first clean backend slice for Ledgerly:

- Users
- Accounts
- The `User -> Account` relationship
- Runtime request validation
- Thin controllers
- Service-based business logic
- Prisma/PostgreSQL persistence

Transfers, deposits, withdrawals, balances, idempotency, and ledger entries are future work.

## Shared Rules

- Controllers handle HTTP routing, params, body DTOs, pipes, and responses.
- Services handle application logic and database calls.
- Request bodies must be validated with Nest DTO classes, `class-validator` decorators, and the global `ValidationPipe`.
- Route params must be parsed before being treated as numbers.
- Missing records should return proper HTTP errors.
- Database access should go through Prisma, preferably via a `PrismaService`.

## User Model Shape

Minimum fields for today:

```ts
User {
  id: number
  email: string
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
  accounts: Account[]
}
```

Notes:

- `email` should be unique.
- `firstName` and `lastName` should be required.
- `User` can have many accounts.

## Account Model Shape

Minimum fields for today:

```ts
Account {
  id: number
  name: string
  type: string
  currency: string
  balance: Decimal
  userId: number
  user: User
  createdAt: Date
  updatedAt: Date
}
```

Notes:

- `userId` is the foreign key to `User`.
- `balance` should not use JavaScript floating point logic for serious money operations.
- For today, account creation can default `balance` to `0`.
- `type` can start as a string such as `WALLET`, `SAVINGS`, or `CURRENT`.
- `currency` can start as `NGN`.

## Endpoints

## `POST /users`

Creates a Ledgerly user.

### Request Body

```json
{
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```

### Validation

- `email` is required.
- `email` must be a valid email.
- `firstName` is required.
- `firstName` must be a string.
- `lastName` is required.
- `lastName` must be a string.

### Service Work

- Check whether the email is already used, or rely on the database unique constraint and handle the error clearly.
- Create the user through Prisma.
- Return the created user.

### Success Response

Status: `201 Created`

```json
{
  "id": 1,
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "createdAt": "2026-10-02T00:00:00.000Z",
  "updatedAt": "2026-10-02T00:00:00.000Z"
}
```

### Error Cases

- Invalid body: `400 Bad Request`
- Duplicate email: `409 Conflict` or clear `400 Bad Request`

## `GET /users/:id`

Fetches one Ledgerly user by ID.

### Route Params

```text
id: number
```

### Validation

- Use a pipe such as `ParseIntPipe` if IDs are numeric.
- Reject non-numeric IDs before the service runs.

### Service Work

- Find the user by ID through Prisma.
- Optionally include the user's accounts.
- Throw `NotFoundException` if the user does not exist.

### Success Response

Status: `200 OK`

```json
{
  "id": 1,
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "accounts": []
}
```

### Error Cases

- Invalid ID: `400 Bad Request`
- Missing user: `404 Not Found`

## `POST /accounts`

Creates an account/wallet for an existing user.

### Request Body

```json
{
  "userId": 1,
  "name": "Main Wallet",
  "type": "WALLET",
  "currency": "NGN"
}
```

### Validation

- `userId` is required.
- `userId` must be a number.
- `name` is required.
- `name` must be a string.
- `type` is required.
- `type` must be a string or enum value.
- `currency` is required.
- `currency` must be a string.

### Service Work

- Confirm the user exists.
- Create the account linked to that user.
- Default the balance to `0`.
- Return the created account.

### Success Response

Status: `201 Created`

```json
{
  "id": 1,
  "userId": 1,
  "name": "Main Wallet",
  "type": "WALLET",
  "currency": "NGN",
  "balance": "0",
  "createdAt": "2026-10-02T00:00:00.000Z",
  "updatedAt": "2026-10-02T00:00:00.000Z"
}
```

### Error Cases

- Invalid body: `400 Bad Request`
- Missing user: `404 Not Found`

## `GET /accounts`

Fetches accounts.

### Query Params

Optional for today:

```text
userId: number
```

### Behavior

- If `userId` is provided, return accounts owned by that user.
- If `userId` is not provided, return all accounts.

### Service Work

- Build a Prisma query based on optional filters.
- Return the account list.

### Success Response

Status: `200 OK`

```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "Main Wallet",
    "type": "WALLET",
    "currency": "NGN",
    "balance": "0"
  }
]
```

### Error Cases

- Invalid query param: `400 Bad Request`

## `GET /accounts/:id`

Fetches one account by ID.

### Route Params

```text
id: number
```

### Validation

- Use a pipe such as `ParseIntPipe` if IDs are numeric.
- Reject non-numeric IDs before the service runs.

### Service Work

- Find the account by ID through Prisma.
- Optionally include the owning user.
- Throw `NotFoundException` if the account does not exist.

### Success Response

Status: `200 OK`

```json
{
  "id": 1,
  "userId": 1,
  "name": "Main Wallet",
  "type": "WALLET",
  "currency": "NGN",
  "balance": "0",
  "user": {
    "id": 1,
    "email": "ada@example.com"
  }
}
```

### Error Cases

- Invalid ID: `400 Bad Request`
- Missing account: `404 Not Found`

## Suggested Build Order

- [ ] Update Prisma schema for `User` and `Account`.
- [ ] Run migration and regenerate Prisma Client if needed.
- [ ] Add or confirm `PrismaService`.
- [ ] Build `UsersModule`, `UsersController`, and `UsersService`.
- [ ] Build user DTOs.
- [ ] Implement `POST /users`.
- [ ] Implement `GET /users/:id`.
- [ ] Build `AccountsModule`, `AccountsController`, and `AccountsService`.
- [ ] Build account DTOs.
- [ ] Implement `POST /accounts`.
- [ ] Implement `GET /accounts`.
- [ ] Implement `GET /accounts/:id`.
- [ ] Manually test each endpoint.
- [ ] Explain the request flow for each endpoint.
