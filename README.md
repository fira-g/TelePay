# 💸 TelePay — Payment Reliability Gateway

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-EA580C?style=for-the-badge)


### A production-minded **payment reliability gateway** built to eliminate ghost transactions, duplicate charges, and inconsistent payment states.

**Designed to explore how money breaks in distributed systems — and how resilient systems recover.**

</div>

## 🚨 The Problem

In distributed payment systems, **success is not binary**.

Payment providers may report success while your system crashes, retries duplicate requests, or fails halfway through settlement.

This creates:

### 👻 Ghost Transactions

Money moves, but systems disagree on **what actually happened**.

TelePay solves this using:

- Idempotency
- Finite State Machines (FSM)
- Saga Compensation
- Redis Distributed Locks
- BullMQ Background Recovery

## 🎯 Why TelePay Exists

TelePay was built to answer one question:

> **How do payment systems remain correct even when everything goes wrong?**

Instead of another CRUD payment API, TelePay focuses on:

- Transactional correctness
- Failure recovery
- Duplicate prevention
- Deterministic state transitions
- Distributed reliability patterns

## 🏗 Architecture Overview

```text
                     ┌──────────────────┐
                     │     Client       │
                     └────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   TelePay API     │
                    │   Express Server  │
                    └────────┬──────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ PostgreSQL DB  │ │     Redis      │ │     BullMQ     │
│ Source of Truth│ │ Locks + Cache  │ │ Background Jobs│
└────────────────┘ └────────────────┘ └────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Mock Payment        │
                  │ Provider/Webhook    │
                  └─────────────────────┘
```

## ⚙ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching / Locks:** Redis
- **Queues:** BullMQ
- **HTTP Client:** Axios


## ✨ Core Features

### 🔐 Idempotency Protection
Prevents duplicate payment processing.

### 🔄 Async Provider Callbacks
Safely handles delayed or duplicate provider webhooks.

### 🧭 Finite State Machine (FSM)
Ensures legal payment transitions only.

### 🔁 Saga Compensation
Automatically refunds when partial failures occur.

### ⚡ Redis Distributed Locks
Prevents race conditions and concurrent state corruption.

### 🧵 BullMQ Background Jobs
Handles retries, reconciliation, and dead-letter workflows.

## 💳 Payment Lifecycle

```text
INITIATED
    ↓
AUTHORIZED
    ↓
SETTLED
```

Refund flow:

```text
SETTLED
    ↓
REFUND_PENDING
    ↓
REFUNDED
```

## 🚀 Getting Started

```bash
git clone https://github.com/yourusername/telepay.git
cd telepay
npm install
npm run dev
```

## 🔑 Environment Variables

```env
DATABASE_URL=
REDIS_URL=
PORT=
NODE_ENV=
PROVIDER_SECRET=
```

## 🧠 Lessons Learned

- Payments are state machines.
- Retries without idempotency are dangerous.
- Distributed systems fail by default.
- Correctness matters more than speed.
- Reliable systems recover automatically.

---

### Built to understand how reliable payment systems survive failure.
