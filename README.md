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

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**

   Create `frontend/.env`:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/farmhouse?schema=public"
   JWT_SECRET=your-strong-secret
   ```

   Make sure the `farmhouse` database exists and Postgres is running.

3. **Prisma generate & migrate**

   Common commands (run in `frontend`):

   ```bash
   # generate Prisma client (run after changing schema.prisma)
   npx prisma generate

   # create / apply migrations in development
   npx prisma migrate dev --name init

   # open Prisma Studio (GUI to inspect/edit data)
   npx prisma studio
   ```

4. **Run the app**

   ```bash
   cd frontend
   npm run dev
   ```

   The app will be available at `http://localhost:3001` (by default).

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
