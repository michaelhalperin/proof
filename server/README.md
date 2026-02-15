# Proof Backend Server

Backend API server for the Proof app using Express and MongoDB Atlas.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set at least:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/proof?retryWrites=true&w=majority
   JWT_SECRET=your-secret-at-least-32-chars-long
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:8081
   ```
   **Important:** Set a strong random `JWT_SECRET` in production.

3. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   # Production
   npm start
   
   # Development (with auto-reload)
   npm run dev
   ```

## API Endpoints

### Records (all require `Authorization: Bearer <token>`)
- `GET /api/records` - Get all records for the authenticated user
- `GET /api/records/:dateKey` - Get a specific record
- `GET /api/records/:dateKey/exists` - Check if record exists
- `POST /api/records` - Create a new record
- `PUT /api/records/:dateKey` - Update a record
- `DELETE /api/records/:dateKey` - Delete a record
- `DELETE /api/records` - Delete all records
- `PATCH /api/records/:dateKey/toggle-pinned` - Toggle pinned status
- `GET /api/records/pinned/all` - Get all pinned records

### Authentication
- `POST /api/auth/login` - Login with email + password; returns JWT and user
- `GET /api/auth/me` - Get current user (requires JWT)
- `DELETE /api/auth/me` - Delete current user (requires JWT)
- `POST /api/auth/signup` - Create a new user
- `GET /api/auth/user/:email` - Get user by email (safe fields only)
- `POST /api/auth/verify-password` - Verify password
- `PUT /api/auth/change-password` - Change user password
- `DELETE /api/auth/user/:email` - Delete user by email
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/password-reset/set` - Set password reset token
- `POST /api/auth/password-reset/verify` - Verify password reset PIN
- `POST /api/auth/password-reset/reset` - Reset password with token
- `POST /api/auth/email-verification/generate` - Generate email verification PIN

## Data Migration

To migrate data from SQLite to MongoDB:

1. **Export SQLite data** (you'll need to adapt the export script for your environment)
2. **Place JSON files in `migration-data/` folder:**
   - `records.json`
   - `users.json`
3. **Run the import script** (set `RECORD_USER_ID` to a user id from your users collection so records are assigned to that user):
   ```bash
   RECORD_USER_ID=your-user-id npm run migrate
   ```

## Development

The server uses:
- **Express** for the web framework
- **Mongoose** for MongoDB ODM
- **TypeScript** for type safety
- **CORS** enabled for cross-origin requests

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string (required)
- `JWT_SECRET` - Secret for signing JWTs (required; use a long random string in production)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin for frontend (avoid `*` in production)
- `RECORD_USER_ID` - When running the import script, assign imported records to this user id
