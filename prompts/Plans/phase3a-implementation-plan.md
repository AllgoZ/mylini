# Phase 3A Implementation Plan — Phone Identity MVP

**Date:** 2026-06-01  
**Scope:** Lean phone-based authentication (unverified)  
**Duration:** 1 session  
**Review Status:** ✅ APPROVED

---

## Review Findings

### Current State Analysis

**Users Table:**
- ✅ Has `id` (UUID PK)
- ✅ Has `phone` (TEXT, nullable)
- ❌ Has `email` (NOT NULL UNIQUE) — BLOCKING for phone-only auth

**Cart System:**
- ✅ XOR constraint: user_id XOR session_id
- ✅ Merge pattern ready (comment already explains guest-to-user flow)
- ✅ CartRepository has both `findOrCreateBySession()` and `findByUserId()`

**Repositories:**
- ✅ CartRepository ready for merge operations
- ❌ NO userRepository — needs creation

**Services:**
- ✅ CartService exists
- ❌ NO authService — needs creation

**API Routes:**
- ✅ /api/cart exists
- ❌ NO /api/auth endpoints

---

## Critical Blocker

**Users table must be migrated to make phone the primary identity:**

Current:
```sql
email TEXT NOT NULL UNIQUE,
phone TEXT,
```

Required:
```sql
phone TEXT NOT NULL UNIQUE,
email TEXT,  -- NULLABLE, optional
```

This migration is BREAKING for existing records (none exist yet, so safe).

---

## Implementation Tasks

### Phase 1: Database Preparation

**Task 1.1: Add `sessions` table**

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX (user_id, expires_at)
);
```

**Task 1.2: Modify `users` table**

```sql
ALTER TABLE users 
DROP CONSTRAINT users_email_key,
MODIFY email TEXT,  -- Make nullable
ADD CONSTRAINT users_phone_key UNIQUE (phone),
ADD COLUMN phone_verified BOOLEAN DEFAULT false,
ADD COLUMN phone_verified_method TEXT,
ADD COLUMN last_login_at TIMESTAMPTZ;
```

**Blocking issue:** Email is NOT NULL. Must update users migration (009) to make email nullable BEFORE this change.

**Migration file:** `023_phase3_authentication.sql`

---

### Phase 2: Backend Services & Repositories

**Task 2.1: Create `userRepository.ts`**

```typescript
export const UserRepository = {
  async findByPhone(phone: string): Promise<User | null>,
  async findById(id: string): Promise<User | null>,
  async createOrUpdateByPhone(phone: string): Promise<User>,
  async updateLastLogin(userId: string): Promise<void>,
};
```

**Task 2.2: Create `authService.ts`**

```typescript
export const AuthService = {
  async authenticateByPhone(phone: string): Promise<{
    user: User;
    session: Session;
  }>,
  async createSession(userId: string): Promise<Session>,
  async validateSession(token: string): Promise<User | null>,
  async logout(sessionId: string): Promise<void>,
};
```

**Task 2.3: Update `cartService.ts`**

Add method:
```typescript
async mergeGuestCartToUser(
  guestSessionId: string,
  userId: string
): Promise<CartWithItems>
```

Logic:
1. Get guest cart items (by session_id)
2. Get/create user cart (by user_id)
3. For each guest item:
   - Check inventory
   - Merge quantity if variant exists
   - Or insert new item
4. Delete guest cart
5. Return user cart

---

### Phase 3: API Routes

**Task 3.1: Create `/api/auth/login`**

```typescript
POST /api/auth/login
{
  phone: "9876543210"
}

Response:
{
  data: {
    user: User,
    session: { token, expiresAt }
  },
  error: null,
  status: 200
}
```

Flow:
1. Validate phone (Zod schema)
2. UserRepository.createOrUpdateByPhone()
3. CartService.mergeGuestCartToUser() (if session_id provided)
4. AuthService.createSession()
5. Set httpOnly cookie
6. Return user + session

**Task 3.2: Create `/api/auth/logout`**

```typescript
POST /api/auth/logout

Response: { data: null, error: null, status: 200 }
```

Flow:
1. Get session token from cookie
2. AuthService.logout(token)
3. Clear cookie

**Task 3.3: Create `/api/auth/me`**

```typescript
GET /api/auth/me

Response:
{
  data: User | null,  // null if no session
  error: null,
  status: 200
}
```

Flow:
1. Extract session token from cookie
2. AuthService.validateSession(token)
3. Return user or null

---

### Phase 4: Middleware & Session Validation

**Task 4.1: Create session middleware**

```typescript
// src/lib/middleware/auth.ts
export async function getSessionUser(
  request: Request
): Promise<User | null> {
  const token = request.cookies.get('session')?.value;
  if (!token) return null;
  return AuthService.validateSession(token);
}

// Usage in protected routes:
const user = await getSessionUser(request);
if (!user) return errorResponse(new Error('Not authenticated'), 401);
```

**Task 4.2: Protect wishlist, checkout, orders endpoints**

Add middleware check to:
- GET /api/wishlist
- POST /api/wishlist
- POST /api/orders
- GET /api/cart (optional — could allow session carts)

---

### Phase 5: Frontend Integration (Minimal)

**Task 5.1: Update cart routes**

When adding to cart, if no session:
1. Prompt for phone
2. POST /api/auth/login
3. Cookie set automatically
4. Merge cart items
5. Continue

**Task 5.2: Add logout button**

Call POST /api/auth/logout, clear frontend state, redirect to home.

---

### Phase 6: Validation & Testing

**Task 6.1: Create auth schemas**

```typescript
// src/lib/validations/authSchema.ts
export const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Invalid phone'),
});
```

**Task 6.2: Test scenarios**

- [ ] Phone entry → User created → Session created
- [ ] Phone entry again → Existing user → New session
- [ ] Guest cart → Merge on login
- [ ] Session expiry (7 days)
- [ ] Logout clears session
- [ ] Protected routes return 401 without session
- [ ] Build passes (0 errors)

---

## File Structure

```
src/lib/
├── repositories/
│   └── userRepository.ts  (NEW)
├── services/
│   ├── authService.ts  (NEW)
│   └── cartService.ts  (MODIFY - add merge logic)
├── middleware/
│   └── auth.ts  (NEW)
└── validations/
    └── authSchema.ts  (NEW)

src/app/api/auth/
├── login/
│   └── route.ts  (NEW)
├── logout/
│   └── route.ts  (NEW)
└── me/
    └── route.ts  (NEW)

src/lib/db/migrations/
├── 023_phase3_authentication.sql  (NEW)
```

---

## Database Migration Order

1. ✅ Migration 023: Create sessions table + modify users table
2. ✅ Regenerate types: `npx supabase gen types typescript ...`

---

## Dependencies Between Tasks

```
1.1 (sessions table)
    ↓
1.2 (users migration)
    ↓
2.1 (userRepository)
    ↓
2.2 (authService) ← depends on userRepository
    ↓
2.3 (cartService merge)
    ↓
3.1 (login route) ← depends on all services
3.2 (logout route)
3.3 (me route)
    ↓
4.1 (session middleware)
    ↓
4.2 (protect routes)
```

---

## Success Criteria (from auth_plan.md)

After implementation:

✅ Phone identity works (POST /api/auth/login with phone)
✅ Session persists (httpOnly cookies work)
✅ Current user endpoint works (GET /api/auth/me)
✅ Logout works (POST /api/auth/logout)
✅ Cart merge works (guest → user)
✅ Wishlist can be protected (requires user)
✅ Checkout can be protected (requires user)
✅ Orders can be protected (requires user)
✅ Build passes (`npx tsc --noEmit && npm run build`)

---

## Out of Scope (Explicitly per auth_plan.md)

❌ Redis rate limiting
❌ OTP/SMS integration
❌ Advanced fraud detection
❌ Account recovery
❌ Multi-device management
❌ JWT auth
❌ OAuth / Social login
❌ Email authentication
❌ Supabase Auth

---

## Implementation Sequence

1. **Review phase** (COMPLETE) ✅
2. **Implement database changes** (1.1, 1.2)
3. **Implement repositories & services** (2.1, 2.2, 2.3)
4. **Implement API routes** (3.1, 3.2, 3.3)
5. **Implement middleware** (4.1, 4.2)
6. **Test & verify** (6.1, 6.2)
7. **Commit to GitHub**

---

## Estimated Effort

- Database: 30 min
- Repositories: 45 min
- Services: 1 hour
- Routes: 1 hour
- Middleware: 30 min
- Testing: 30 min
- **Total: ~4 hours**

---

## Notes

- **Keep it lean:** Phone-only for MVP. No fancy features.
- **Security practical:** Secure tokens, httpOnly cookies, session expiry.
- **Future-proof:** Design allows MSG91 OTP to be plugged in Phase 3.1.
- **Follow patterns:** Use existing repo → service → route architecture.
- **No overengineering:** Skip Redis, advanced fraud detection, etc.

---

## Ready to Implement?

After approval, proceed with Phase 1 (database changes).

**Plan approved by:** Audit document phase3-auth-audit.md
**Reference:** prompts/auth_plan.md
