## Farmhouse Monolith (Next.js + Prisma + Postgres)

Full-stack admin panel and API for managing farms, users, photography, and decorations with RBAC, implemented entirely in **Next.js App Router** using **Prisma** and **Postgres**.

> Note: The old `api/` NestJS backend is now **legacy** and not used. All APIs live under `frontend/app/api`. You can delete the `api` folder if you no longer need it.

### Tech stack

- **Frontend / Backend**: Next.js 14 (App Router, TypeScript)
- **Database access**: Prisma 6, Postgres
- **Auth**: JWT (HTTP `Authorization: Bearer <token>`)
- **RBAC roles**:
  - **Owner**: Full access, can manage users and all entities.
  - **Admin**: Same as Owner (can manage users and all entities).
  - **User**: Read-only access to farms, photography, decorations.

### Data model (Prisma)

Defined in `frontend/prisma/schema.prisma`:

- **User**: `id`, `email`, `name`, `password`, `role`, timestamps, relation to `Farm`.
- **Farm**: `id`, `name`, `location`, `description`, `ownerId`, timestamps, relations to `Photography`, `Decoration`.
- **Photography**: `id`, `title`, `description`, `imageUrl`, `farmId`, timestamps.
- **Decoration**: `id`, `name`, `description`, `price`, `farmId`, timestamps.

### Setup

#### 1. New Project Setup (Fresh Installation)

```bash
# Clone or navigate to the project
cd /path/to/Farmhouse

# Install dependencies
npm install

# Configure environment variables
# Copy or create .env.local with your database credentials
# Example:
# DATABASE_URL="postgresql://user:password@localhost:5432/farmhouse?sslmode=require"
# JWT_SECRET=your-strong-secret-key
# PORT=3000

# Generate Prisma Client
npx prisma generate

# Create and apply initial migration
npx prisma migrate dev --name init

# Seed database with initial data (if seed script exists)
# npx ts-node prisma/seed.ts

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000` (or your configured PORT).

#### 2. Database Setup & Configuration

**Prerequisites:**
- PostgreSQL 12+ running locally or remote
- Database credentials (host, port, user, password, database name)

**Environment Variables (`.env.local`):**

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?sslmode=require"
JWT_SECRET=your-very-strong-secret-key
PORT=3000
```

**Verify Database Connection:**

```bash
# Open Prisma Studio to view/edit data
npx prisma studio

# Check connection and current schema
npx prisma db execute --stdin < /dev/null
```

#### 3. Adding New Fields to Schema (Without Losing Data)

When you need to add new columns, fields, or make schema changes, follow these steps to preserve existing data:

**Step 1: Update Schema**

Edit `prisma/schema.prisma` and add your new fields to the appropriate model:

```prisma
model Farm {
  id              String   @id @default(uuid())
  name            String
  // ... existing fields ...
  
  // Add your new fields here
  newField1       String?
  newField2       Int?
  weekday6hPrice  String?
  weekend6hPrice  String?
}
```

**Step 2: Push Changes to Database (Recommended for Development)**

```bash
# This applies schema changes directly without strict migration history
# All existing data is preserved
npx prisma db push
```

**Step 3: Generate Updated Prisma Client**

```bash
npx prisma generate
```

**Step 4: (Optional) Create a Proper Migration**

If you want to create a formal migration file for version control:

```bash
# Create and apply migration in one command
npx prisma migrate dev --name describe_your_changes

# Example:
npx prisma migrate dev --name add_price_durations_6h_12h
```

**Step 5: Verify Changes**

```bash
# Check current schema matches Prisma schema
npx prisma db execute --stdin < /dev/null

# View data in Studio
npx prisma studio
```

#### 4. Common Prisma Commands

```bash
# Generate Prisma Client (run after schema changes)
npx prisma generate

# Push schema to database (development - no strict migration history)
npx prisma db push

# Create and apply migration (production-ready)
npx prisma migrate dev --name migration_name

# Deploy migrations (apply pending migrations)
npx prisma migrate deploy

# Resolve failed migrations (if migration fails)
npx prisma migrate resolve --rolled-back migration_name

# Open Prisma Studio UI
npx prisma studio

# Show migration history
npx prisma migrate status

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Seed database with sample data
npx ts-node prisma/seed.ts
```

#### 5. Development Workflow

```bash
# After cloning or getting fresh code
npm install
npx prisma generate

# When you modify prisma/schema.prisma
npx prisma db push          # For development (preserves data)
# OR
npx prisma migrate dev --name description  # For production (creates migration file)

# After any schema changes, regenerate types
npx prisma generate

# Restart dev server
npm run dev
```

#### 6. Troubleshooting

**Database connection issues:**
```bash
# Test connection string format
# PostgreSQL: postgresql://user:password@host:port/dbname?sslmode=require
```

**Migration conflicts:**
```bash
# If migration fails, mark it as rolled back
npx prisma migrate resolve --rolled-back migration_name

# Then create a new migration
npx prisma migrate dev --name fix_description
```

**Data out of sync:**
```bash
# If database schema doesn't match Prisma schema
npx prisma db push  # Safe for development
```

### Auth & login

- **Endpoint**: `POST /api/auth/login`
- **Body**:

  ```json
  {
    "email": "owner@farmhouse.local",
    "password": "owner123"
  }
  ```

- **Response**:

  ```json
  {
    "accessToken": "JWT_TOKEN",
    "user": {
      "id": "USER_ID",
      "email": "owner@farmhouse.local",
      "name": "Default Owner",
      "role": "OWNER"
    }
  }
  ```

The frontend stores `accessToken` and includes it as `Authorization: Bearer <token>` for all protected calls.

### Core API endpoints

All routes are implemented as Next.js route handlers under `frontend/app/api` and are consumed by the Next.js admin UI.

- **Users** (`Owner` / `Admin` only)
  - `GET /api/users`
  - `GET /api/users/:id`
  - `POST /api/users`
  - `PATCH /api/users/:id`
  - `DELETE /api/users/:id`

- **Farms**
  - `GET /api/farms` (any authenticated role)
  - `GET /api/farms/:id` (any authenticated role)
  - `POST /api/farms` (Owner/Admin) — **bulk create**, body:

    ```json
    {
      "farms": [
        { "name": "Farm 1", "location": "City", "description": "..." },
        { "name": "Farm 2", "location": "Village", "description": "..." }
      ]
    }
    ```

    The `ownerId` is taken from the JWT of the logged-in Owner/Admin.

- **Photography**
  - `GET /api/photography` (any authenticated role)
  - `GET /api/photography/:id` (any authenticated role)
  - `POST /api/photography` (Owner/Admin)
  - `PATCH /api/photography/:id` (Owner/Admin)
  - `DELETE /api/photography/:id` (Owner/Admin)

- **Decorations**
  - `GET /api/decorations` (any authenticated role)
  - `GET /api/decorations/:id` (any authenticated role)
  - `POST /api/decorations` (Owner/Admin)
  - `PATCH /api/decorations/:id` (Owner/Admin)
  - `DELETE /api/decorations/:id` (Owner/Admin)

### Admin UI

Implemented in `frontend/app` using App Router:

- `/login`: auth page (no sidebar).
- `/dashboard`: simple analytics (counts of farms, users, photos, decorations).
- `/farms`: list and bulk create farms.
- `/users`: list and create users (Owner/Admin).
- `/photography`: list and create photography records.
- `/decorations`: list and create decorations.


npm install --legacy-peer-deps && npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm run build 