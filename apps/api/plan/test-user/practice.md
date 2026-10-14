# Test-user practice tracker

## Active scope

- Project: Ledgerly API (`apps/api`)
- Plan: [`2026-10-07.md`](../2026-10-07.md)
- Scope rule: Practice a small set of unique implementation patterns drawn from this plan. The user does not need to complete every plan task.
- Exclusion: E2E and other test-writing tasks are excluded from practice, per the user's instruction.
- Completion rule: Once each distinct relevant pattern has been demonstrated, report that this scope is complete and recommend moving to another plan rather than practicing repetitive checklist items.

## Patterns practiced

| Pattern | Scope task | Difficulty | Status | Evidence |
| --- | --- | --- | --- | --- |
| DTO validation for a required positive numeric amount | Deposit request DTO | Normal | Practiced | User created `DepositDto` with number, required, and positive-value validation. Formatting is not part of the assessment. |
| Authenticated controller route with path parameter, request body, and current user | `POST /accounts/:id/deposits` | Normal | Practiced | Controller uses the existing class-level auth guard, parses the account ID, accepts `DepositDto`, and delegates user ID, account ID, and DTO to the service. |
| Service-layer ownership check | Deposit account lookup | Normal | Practiced | Service queries by both account `id` and authenticated `userId`, then raises `NotFoundException` if no owned account matches. |

## Patterns still available in this scope

- Prisma transaction model and account relationship
- Prisma transaction boundary for balance update plus transaction creation
- Module/provider wiring for a new feature
- Authenticated transaction-history retrieval and ordering

These are candidate patterns, not a requirement to practice all of them. Select a bounded exercise only when the user asks to continue, avoid test tasks, and do not repeat a pattern already practiced.

## Attempt history

- 2026-10-13: Normal DTO validation exercise reviewed; core positive-number validation demonstrated. User asked that formatting details not be graded.
- 2026-10-14: Normal authenticated deposit-controller route reviewed; core routing, authenticated user, DTO input, and delegation pattern demonstrated. The called service method remains to be implemented as a separate pattern.
- 2026-10-14: Normal service ownership-check pattern reviewed; account lookup is scoped by both IDs and follows the existing not-found behavior. Balance update and transaction creation remain separate patterns.
