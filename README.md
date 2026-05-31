# ☀️ SummerMate — Social Activity Discovery Platform

A production-quality full-stack monorepo for discovering summer activities, meeting people, and creating memories.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web Frontend** | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| **Mobile** | Expo SDK, Expo Router, TypeScript, NativeWind |
| **State** | Zustand, TanStack Query (React Query) |
| **Forms** | React Hook Form + Zod validation |
| **Backend** | Next.js API Routes, TypeScript |
| **ORM** | Prisma 5 |
| **Database** | PostgreSQL 16 (Docker) |
| **Storage** | S3-compatible (luofuxiang/local-s3 in Docker) |
| **Realtime** | Socket.IO (activity chat, online status, notifications) |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Maps** | OpenStreetMap + React Leaflet (web) / react-native-maps (mobile) |
| **Routing** | OpenRouteService API |
| **Bot** | Telegram Bot (webhook) |

## Project Structure

```
summermate/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── prisma/             # Schema + migrations + seed
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router pages + API routes
│   │   │   │   ├── (auth)/     # Login, Register, Forgot Password
│   │   │   │   ├── (dashboard)/ # Feed, Map, Activities, Chat...
│   │   │   │   └── api/        # REST endpoints + Socket + Telegram
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # React Query hooks
│   │   │   ├── lib/            # DB, Auth, S3, Socket, Validation
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── types/          # TypeScript types + enums
│   │   └── server.ts           # Custom server with Socket.IO
│   └── mobile/                 # Expo mobile app
│       ├── app/
│       │   ├── (auth)/         # Login, Register
│       │   └── (tabs)/         # Feed, Map, Friends, Notifications, Profile
│       ├── stores/             # Zustand stores
│       └── lib/                # API client
├── packages/
│   ├── api-types/              # Shared TypeScript types
│   └── shared/                 # Shared utilities (dates, geo, labels)
├── infrastructure/
│   ├── docker-compose.yml      # PostgreSQL + local-s3
│   ├── postgres/init.sql       # DB extensions init
│   └── local-s3/config.json   # S3 buckets config
└── turbo.json                  # Turborepo config
```

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker + Docker Compose
- npm 10+

### 2. Clone & Install

```bash
git clone <repo>
cd summermate
npm install
```

### 3. Environment Setup

```bash
# Web app
cp apps/web/.env.example apps/web/.env

# Infrastructure
cp infrastructure/.env.example infrastructure/.env
```

Edit `apps/web/.env` with your secrets:
```env
DATABASE_URL="postgresql://summermate:summermate_secret@localhost:5432/summermate_db"
JWT_ACCESS_SECRET="change-this-to-a-secure-random-string"
JWT_REFRESH_SECRET="change-this-to-another-secure-random-string"
```

### 4. Start Infrastructure

```bash
npm run docker:up
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **local-s3** on `localhost:8080`

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
cd apps/web && npm run db:seed
```

Demo accounts created:
- `alice@demo.com` / `Demo1234!`
- `bob@demo.com` / `Demo1234!`

### 6. Start Development

```bash
npm run dev
```

- **Web app**: http://localhost:3000
- **Prisma Studio**: `npm run db:studio`

### 7. Mobile (Optional)

```bash
cd apps/mobile
npx expo start
```

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (revoke token) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |

### Activities
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/activities` | List activities (with filters) |
| POST | `/api/activities` | Create activity |
| GET | `/api/activities/:id` | Get activity detail |
| PATCH | `/api/activities/:id` | Update activity |
| DELETE | `/api/activities/:id` | Cancel activity |
| POST | `/api/activities/:id/join` | Join activity |
| POST | `/api/activities/:id/leave` | Leave activity |
| GET/POST | `/api/activities/:id/messages` | Activity chat messages |
| GET/POST | `/api/activities/:id/ratings` | Activity ratings |

### Social
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/friends` | List friends |
| GET/POST | `/api/friends/requests` | Friend requests |
| PATCH | `/api/friends/requests/:id` | Accept/reject request |
| DELETE | `/api/friends/:id` | Remove friend |

### Discovery
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/random-activity` | Random activity generator |
| GET | `/api/search?q=query` | Global search |
| GET/PUT | `/api/interests` | Browse/update interests |
| GET/POST | `/api/routes` | Route builder |
| GET/PATCH | `/api/notifications` | Notifications |

### Media
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload?bucket=avatars` | Upload avatar |
| POST | `/api/upload?bucket=galleries&activityId=:id` | Upload activity photo |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `room:join` | `activityId: string` | Join activity chat room |
| `room:leave` | `activityId: string` | Leave room |
| `message:send` | `{ activityId, content }` | Send message |
| `typing:start` | `activityId: string` | Start typing |
| `typing:stop` | `activityId: string` | Stop typing |
| `message:read` | `{ activityId, messageId }` | Mark as read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId, lastSeenAt }` | User went offline |
| `message:new` | `ActivityMessage` | New chat message |
| `typing:user` | `{ userId, username, isTyping }` | Typing indicator |
| `message:read_by` | `{ messageId, userId }` | Read receipt |

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + help |
| `/events` | List upcoming activities |
| `/random` | Random activity suggestion |
| `/random adventurous` | Random by mood |
| `/create` | Link to create activity |

Set up webhook: `GET /api/telegram` (configure `TELEGRAM_BOT_TOKEN` first)

## Features

- ✅ JWT auth with refresh token rotation
- ✅ Activity CRUD with geo-filtering
- ✅ Friend requests & social graph
- ✅ Interest matching
- ✅ Activity chat with Socket.IO
- ✅ Typing indicators & read receipts
- ✅ Online presence system
- ✅ Photo galleries (S3)
- ✅ Activity ratings (activity/organization/fun)
- ✅ Random activity generator (rule-based engine)
- ✅ Route builder with OpenRouteService
- ✅ Global search (users/activities/interests)
- ✅ Push notifications system
- ✅ OpenStreetMap + Leaflet integration
- ✅ Telegram bot
- ✅ Mobile app (Expo) with all screens
- ✅ Dark mode
- ✅ Mobile-first responsive design
