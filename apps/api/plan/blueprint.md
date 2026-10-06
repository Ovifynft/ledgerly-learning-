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

- [x] Update Prisma schema for `User` and `Account`.
- [x] Run migration and regenerate Prisma Client if needed.
- [x] Add or confirm `PrismaService`.
- [x] Build `UsersModule`, `UsersController`, and `UsersService`.
- [x] Build user DTOs.
- [x] Implement `POST /users`.
- [x] Implement `GET /users/:id`.
- [x] Build `AccountsModule`, `AccountsController`, and `AccountsService`.
- [x] Build account DTOs.
- [x] Implement `POST /accounts`.
- [x] Implement `GET /accounts`.
- [x] Implement `GET /accounts/:id`.
- [x] Test each endpoint through the Nest HTTP layer.
- [x] Explain the request flow for each endpoint.

## Current Implementation Notes

- [x] Import `AccountsModule` in `AppModule` so `/accounts` routes are actually registered.
- [x] Rename `accounts/acccounts.service.ts` to `accounts/accounts.service.ts` and update imports.
- [x] Rename `UsersModule` in `accounts.module.ts` to `AccountsModule`.
- [x] Align `CreateAccountDto` with the blueprint: account creation should not require `balance` from the request because the service defaults it to `0`.
- [x] Validate optional `GET /accounts?userId=` as a number instead of manually using `Number(userId)` without rejecting invalid values.
- [x] Test all endpoints through the Nest HTTP layer after the accounts module is wired.
- [x] Explain the request flow for each endpoint after testing.

## Implemented Request Flow

- `POST /users`: the global `ValidationPipe` validates and transforms `CreateUserDto`; `UsersController` passes it to `UsersService`; the service checks email uniqueness and creates the user with Prisma.
- `GET /users/:id`: `ParseIntPipe` rejects invalid IDs; `UsersService` queries Prisma and returns `404 Not Found` when no user exists.
- `POST /accounts`: the global `ValidationPipe` validates `CreateAccountDto` and rejects client-supplied `balance`; `AccountsService` confirms the owner exists, sets `balance` to `0`, and creates the account with Prisma.
- `GET /accounts`: an optional `ParseIntPipe` validates and transforms `userId`; `AccountsService` supplies a Prisma `where` filter only when the query parameter is present.
- `GET /accounts/:id`: `ParseIntPipe` rejects invalid IDs; `AccountsService` fetches the account with its owner and returns `404 Not Found` when it does not exist.

Endpoint coverage lives in `test/ledgerly.e2e-spec.ts` and exercises successful requests, invalid bodies and numeric inputs, missing users/accounts, filtering, and the server-owned zero balance default.

# Today's Shape — October 6, 2026

## Schema Changes

### `User`

Add authentication credentials to the existing `User` model.

```ts
User {
  id: number
  email: string
  firstName: string
  lastName: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
  accounts: Account[]
}
```

Notes:

- `passwordHash` is required.
- Plain-text passwords must not be stored.
- `passwordHash` must not be exposed in API responses.

---

## New Endpoints

## `POST /auth/register`

Creates a Ledgerly user with authentication credentials.

### Request Body

```json
{
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "password": "ExamplePassword123!"
}
```

### Validation

- `email` is required.
- `email` must be a valid email.
- `firstName` is required.
- `firstName` must be a string.
- `lastName` is required.
- `lastName` must be a string.
- `password` is required.
- `password` must be a string.
- `password` must be at least 8 characters long.

### Success Response

Status: `201 Created`

```json
{
  "id": 2,
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "createdAt": "2026-10-06T00:00:00.000Z",
  "updatedAt": "2026-10-06T00:00:00.000Z"
}
```

### Error Cases

- Invalid body: `400 Bad Request`
- Duplicate email: `409 Conflict`

---

## `POST /auth/login`

Authenticates a Ledgerly user.

### Request Body

```json
{
  "email": "ada@example.com",
  "password": "ExamplePassword123!"
}
```

### Validation

- `email` is required.
- `email` must be a valid email.
- `password` is required.
- `password` must be a string.

### Success Response

Status: `200 OK`

```json
{
  "accessToken": "<jwt>"
}
```

### Token Shape

The JWT should identify the authenticated user.

```json
{
  "sub": 2,
  "email": "ada@example.com"
}
```

### Error Cases

- Invalid body: `400 Bad Request`
- Invalid credentials: `401 Unauthorized`

---

## `GET /auth/me`

Fetches the currently authenticated user.

### Authentication

```http
Authorization: Bearer <access-token>
```

A valid access token is required.

### Success Response

Status: `200 OK`

```json
{
  "id": 2,
  "email": "ada@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```

### Error Cases

- Missing token: `401 Unauthorized`
- Invalid token: `401 Unauthorized`
- Expired token: `401 Unauthorized`

---

## Existing Endpoint Changes

## `POST /accounts`

Change account creation so ownership comes from the authenticated user instead of a client-supplied `userId`.

### Authentication

```http
Authorization: Bearer <access-token>
```

### Previous Request Body

```json
{
  "userId": 1,
  "name": "Main Wallet",
  "type": "WALLET",
  "currency": "NGN"
}
```

### New Request Body

```json
{
  "name": "Main Wallet",
  "type": "WALLET",
  "currency": "NGN"
}
```

### Validation

- `name` is required.
- `name` must be a string.
- `type` is required.
- `type` must be a string or enum value.
- `currency` is required.
- `currency` must be a string.
- `userId` must not be accepted from the request body.
- `balance` must not be accepted from the request body.

### Success Response

Status: `201 Created`

```json
{
  "id": 2,
  "userId": 2,
  "name": "Main Wallet",
  "type": "WALLET",
  "currency": "NGN",
  "balance": "0",
  "createdAt": "2026-10-06T00:00:00.000Z",
  "updatedAt": "2026-10-06T00:00:00.000Z"
}
```

### Error Cases

- Invalid body: `400 Bad Request`
- Missing or invalid authentication: `401 Unauthorized`

---

## `GET /accounts`

Change account listing so it returns accounts belonging to the authenticated user.

The `userId` query parameter is removed from the normal customer endpoint.

### Authentication

```http
Authorization: Bearer <access-token>
```

### Success Response

Status: `200 OK`

```json
[
  {
    "id": 2,
    "userId": 2,
    "name": "Main Wallet",
    "type": "WALLET",
    "currency": "NGN",
    "balance": "0"
  }
]
```

### Error Cases

- Missing or invalid authentication: `401 Unauthorized`

---

## `GET /accounts/:id`

Change account retrieval so the requested account must belong to the authenticated user.

### Authentication

```http
Authorization: Bearer <access-token>
```

### Route Params

```text
id: number
```

### Validation

- `id` must be numeric.
- Invalid IDs must be rejected before the account query is performed.

### Success Response

Status: `200 OK`

```json
{
  "id": 2,
  "userId": 2,
  "name": "Main Wallet",
  "type": "WALLET",
  "currency": "NGN",
  "balance": "0"
}
```

### Error Cases

- Invalid ID: `400 Bad Request`
- Missing or invalid authentication: `401 Unauthorized`
- Missing account: `404 Not Found`
- Account not accessible by authenticated user: `403 Forbidden` or `404 Not Found`

---

## `POST /users`

The existing public user creation endpoint is superseded by:

```http
POST /auth/register
```

`POST /users` should no longer act as an unrestricted second public registration endpoint.
