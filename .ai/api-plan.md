# REST API Plan - Kulkomat Loyalty System

## 1. Resources

### Core Resources

- **Profiles** - Customer profile data (`profiles` table)
- **Sellers** - Staff/seller accounts (`sellers` table)
- **Stamps** - Individual stamp records (`stamps` table)
- **Coupons** - Discount coupons (auto-generated and manual) (`coupons` table)
- **Reward Codes** - One-time promotional codes (`reward_codes` table)
- **Ice Cream Flavors** - Available flavor list (`ice_cream_flavors` table)
- **Contact Submissions** - Customer feedback/issues (`contact_submissions` table)
- **Activity History** - Combined view of stamps and coupons (database view)

## 2. Endpoints

### 2.1 Authentication & Authorization

**Note**: Authentication is handled by Supabase Auth (built-in). The API relies on Supabase JWT tokens for authentication. All authenticated endpoints require `Authorization: Bearer <token>` header.

#### User Registration

Handled by Supabase Auth client-side:

- `POST /auth/v1/signup` (Supabase endpoint)
- After successful registration, create profile via API

#### User Login

Handled by Supabase Auth client-side:

- `POST /auth/v1/token?grant_type=password` (Supabase endpoint)

#### Password Reset

Handled by Supabase Auth client-side:

- `POST /auth/v1/recover` (Supabase endpoint)

### 2.2 Profile Management

#### Get Current User Profile

```
GET /api/profiles/me
```

**Description**: Retrieve the authenticated user's profile  
**Authentication**: Required (customer)  
**Query Parameters**: None  
**Response Body**:

```json
{
  "id": "uuid",
  "short_id": "ABC123",
  "stamp_count": 5,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Success Codes**:

- `200 OK` - Profile retrieved successfully

**Error Codes**:

- `401 Unauthorized` - No valid authentication token
- `404 Not Found` - Profile not found

---

#### Create Profile

```
POST /api/profiles
```

**Description**: Create a profile after Supabase auth registration  
**Authentication**: Required (new user)  
**Request Body**:

```json
{
  "user_id": "uuid"
}
```

**Response Body**:

```json
{
  "id": "uuid",
  "short_id": "ABC123",
  "stamp_count": 0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Success Codes**:

- `201 Created` - Profile created successfully

**Error Codes**:

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - No valid authentication token
- `409 Conflict` - Profile already exists for this user

**Validation**:

- Generate unique `short_id` (6-8 character alphanumeric code)
- Initialize `stamp_count` to 0

---

#### Get Profile by Short ID (Seller Only)

```
GET /api/profiles/by-short-id/{short_id}
```

**Description**: Retrieve a customer profile by their short ID  
**Authentication**: Required (seller)  
**Path Parameters**:

- `short_id` (string, required) - Customer's short identifier

**Response Body**:

```json
{
  "id": "uuid",
  "short_id": "ABC123",
  "stamp_count": 5,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Success Codes**:

- `200 OK` - Profile retrieved successfully

**Error Codes**:

- `401 Unauthorized` - Not authenticated as seller
- `403 Forbidden` - Not authorized (not a seller)
- `404 Not Found` - Profile not found

---

### 2.3 Stamp Management

#### Add Stamps to Customer (Seller Only)

```
POST /api/stamps
```

**Description**: Add stamp(s) to a customer's account  
**Authentication**: Required (seller)  
**Request Body**:

```json
{
  "user_id": "uuid",
  "count": 1
}
```

**Response Body**:

```json
{
  "stamps_added": 1,
  "new_stamp_count": 6,
  "coupon_generated": false,
  "stamps": [
    {
      "id": 123,
      "user_id": "uuid",
      "seller_id": "uuid",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Success Codes**:

- `201 Created` - Stamps added successfully

**Error Codes**:

- `400 Bad Request` - Invalid count or user_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)
- `404 Not Found` - User profile not found

**Business Logic**:

- Database trigger automatically generates `free_scoop` coupon when stamp_count reaches 10
- Trigger resets `stamp_count` to 0 after coupon generation
- Trigger marks 10 stamps as `redeemed` and links them to the generated coupon
- Default `count` is 1 if not specified
- Maximum `count` per request is 10

**Validation**:

- `count` must be positive integer (1-10)
- `user_id` must exist in profiles table

---

#### Get My Stamps (Customer)

```
GET /api/profiles/me/stamps
```

**Description**: Retrieve authenticated user's stamp history  
**Authentication**: Required (customer)  
**Query Parameters**:

- `status` (string, optional) - Filter by status: `active`, `redeemed`
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**:

```json
{
  "stamps": [
    {
      "id": 123,
      "seller_id": "uuid",
      "status": "active",
      "redeemed_for_coupon_id": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

**Success Codes**:

- `200 OK` - Stamps retrieved successfully

**Error Codes**:

- `401 Unauthorized` - Not authenticated

---

#### Get Customer Stamps (Seller Only)

```
GET /api/stamps
```

**Description**: Retrieve stamps for a specific customer  
**Authentication**: Required (seller)  
**Query Parameters**:

- `user_id` (uuid, required) - Customer's user ID
- `status` (string, optional)
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**: Same as "Get My Stamps"

**Success Codes**:

- `200 OK` - Stamps retrieved successfully

**Error Codes**:

- `400 Bad Request` - Missing user_id parameter
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

---

### 2.4 Coupon Management

#### Get My Coupons (Customer)

```
GET /api/profiles/me/coupons
```

**Description**: Retrieve authenticated user's coupons  
**Authentication**: Required (customer)  
**Query Parameters**:

- `status` (string, optional) - Filter by status: `active`, `used`, `expired`
- `type` (string, optional) - Filter by type: `free_scoop`, `percentage`, `amount`
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**:

```json
{
  "coupons": [
    {
      "id": 456,
      "type": "free_scoop",
      "value": null,
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "used_at": null,
      "expires_at": "2024-02-15T23:59:59Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

**Success Codes**:

- `200 OK` - Coupons retrieved successfully

**Error Codes**:

- `401 Unauthorized` - Not authenticated

---

#### Get Customer Coupons (Seller Only)

```
GET /api/coupons
```

**Description**: Retrieve coupons for a specific customer  
**Authentication**: Required (seller)  
**Query Parameters**:

- `user_id` (uuid, required)
- `status` (string, optional)
- `type` (string, optional)
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**: Same as "Get My Coupons"

**Success Codes**:

- `200 OK` - Coupons retrieved successfully

**Error Codes**:

- `400 Bad Request` - Missing user_id parameter
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

---

#### Add Manual Coupon (Seller Only)

```
POST /api/coupons
```

**Description**: Manually add a coupon to a customer's account  
**Authentication**: Required (seller)  
**Request Body**:

```json
{
  "user_id": "uuid",
  "type": "percentage",
  "value": 10.0,
  "expires_at": "2024-02-15T23:59:59Z"
}
```

**Response Body**:

```json
{
  "id": 458,
  "user_id": "uuid",
  "type": "percentage",
  "value": 10.0,
  "status": "active",
  "created_at": "2024-01-16T15:00:00Z",
  "used_at": null,
  "expires_at": "2024-02-15T23:59:59Z"
}
```

**Success Codes**:

- `201 Created` - Coupon created successfully

**Error Codes**:

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)
- `404 Not Found` - User profile not found

**Validation**:

- `type` must be one of: `free_scoop`, `percentage`, `amount`
- `value` required for `percentage` and `amount` types, must be null for `free_scoop`
- `value` must be > 0 for percentage (typically 1-100) or amount (typically > 0)
- `expires_at` must be in the future
- Default `status` is `active`

---

#### Mark Coupon as Used (Seller Only)

```
PATCH /api/coupons/{coupon_id}/use
```

**Description**: Mark a coupon as used after customer redeems it  
**Authentication**: Required (seller)  
**Path Parameters**:

- `coupon_id` (integer, required) - Coupon ID

**Request Body**:

```json
{
  "user_id": "uuid"
}
```

**Response Body**:

```json
{
  "id": 458,
  "user_id": "uuid",
  "type": "percentage",
  "value": 10.0,
  "status": "used",
  "created_at": "2024-01-16T15:00:00Z",
  "used_at": "2024-01-17T12:30:00Z",
  "expires_at": "2024-02-15T23:59:59Z"
}
```

**Success Codes**:

- `200 OK` - Coupon marked as used successfully

**Error Codes**:

- `400 Bad Request` - Coupon already used or expired
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller) or coupon doesn't belong to user_id
- `404 Not Found` - Coupon not found

**Validation**:

- Coupon must belong to the specified `user_id`
- Coupon must have `status` = `active`
- Current timestamp must be before `expires_at`

---

### 2.5 Customer Management (Seller Only)

#### List Customers

```
GET /api/customers
```

**Description**: Retrieve list of all registered customers  
**Authentication**: Required (seller)  
**Query Parameters**:

- `search` (string, optional) - Search by short_id
- `sort` (string, optional, default: `created_at`)
- `order` (string, optional, default: `desc`)
- `limit` (integer, optional, default: 50, max: 100)
- `offset` (integer, optional, default: 0)

**Response Body**:

```json
{
  "customers": [
    {
      "id": "uuid",
      "short_id": "ABC123",
      "stamp_count": 5,
      "active_coupons_count": 2,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Success Codes**:

- `200 OK` - Customers retrieved successfully

**Error Codes**:

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

---

### 2.6 Activity History

#### Get My Activity History (Customer)

```
GET /api/profiles/me/activity-history
```

**Description**: Retrieve authenticated user's activity history  
**Authentication**: Required (customer)  
**Query Parameters**:

- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**:

```json
{
  "activities": [
    {
      "type": "coupon_generated",
      "id": 456,
      "details": { "coupon_type": "free_scoop" },
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "type": "stamp_added",
      "id": 123,
      "details": { "status": "active" },
      "created_at": "2024-01-15T10:25:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

**Success Codes**:

- `200 OK` - Activity history retrieved successfully

**Error Codes**:

- `401 Unauthorized` - Not authenticated

**Business Logic**:

- Returns unified view combining stamps and coupons
- Ordered by timestamp (most recent first)
- Activity types: `stamp_added`, `coupon_generated`, `coupon_used`, `coupon_expired`

---

#### Get Customer Activity History (Seller Only)

```
GET /api/activity-history
```

**Description**: Retrieve activity history for a specific customer  
**Authentication**: Required (seller)  
**Query Parameters**:

- `user_id` (uuid, required)
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**: Same as "Get My Activity History"

**Success Codes**:

- `200 OK` - Activity history retrieved successfully

**Error Codes**:

- `400 Bad Request` - Missing user_id parameter
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

---

### 2.7 Ice Cream Flavors

#### List Available Flavors (Public)

```
GET /api/flavors
```

**Description**: Retrieve list of available ice cream flavors  
**Authentication**: Optional  
**Query Parameters**:

- `available_only` (boolean, optional, default: true)

**Response Body**:

```json
{
  "flavors": [
    {
      "id": 1,
      "name": "Vanilla",
      "is_available": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Success Codes**:

- `200 OK` - Flavors retrieved successfully

**Error Codes**: None (public endpoint)

---

#### Create Flavor (Seller Only)

```
POST /api/flavors
```

**Description**: Add a new ice cream flavor  
**Authentication**: Required (seller)  
**Request Body**:

```json
{
  "name": "Strawberry",
  "is_available": true
}
```

**Response Body**:

```json
{
  "id": 3,
  "name": "Strawberry",
  "is_available": true,
  "created_at": "2024-01-16T10:00:00Z"
}
```

**Success Codes**:

- `201 Created` - Flavor created successfully

**Error Codes**:

- `400 Bad Request` - Invalid name or missing required fields
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

**Validation**:

- `name` is required, max 100 characters
- `is_available` defaults to true if not provided

---

#### Update Flavor Availability (Seller Only)

```
PATCH /api/flavors/{flavor_id}
```

**Description**: Update flavor availability status  
**Authentication**: Required (seller)  
**Path Parameters**:

- `flavor_id` (integer, required)

**Request Body**:

```json
{
  "is_available": false
}
```

**Response Body**:

```json
{
  "id": 3,
  "name": "Strawberry",
  "is_available": false,
  "created_at": "2024-01-16T10:00:00Z"
}
```

**Success Codes**:

- `200 OK` - Flavor updated successfully

**Error Codes**:

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)
- `404 Not Found` - Flavor not found

---

### 2.8 Reward Codes

#### Generate Reward Code (Seller Only)

```
POST /api/reward-codes
```

**Description**: Generate a new one-time reward code  
**Authentication**: Required (seller)  
**Request Body**:

```json
{
  "expires_at": "2024-02-15T23:59:59Z"
}
```

**Response Body**:

```json
{
  "id": 789,
  "code": "REWARD2024ABC",
  "is_used": false,
  "created_at": "2024-01-16T10:00:00Z",
  "expires_at": "2024-02-15T23:59:59Z"
}
```

**Success Codes**:

- `201 Created` - Reward code generated successfully

**Error Codes**:

- `400 Bad Request` - Invalid expires_at (must be in future)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

**Business Logic**:

- Generate unique code (12-16 character alphanumeric, uppercase)
- Ensure uniqueness in database
- Default `is_used` to false

**Validation**:

- `expires_at` must be in the future

---

#### List Reward Codes (Seller Only)

```
GET /api/reward-codes
```

**Description**: Retrieve list of generated reward codes  
**Authentication**: Required (seller)  
**Query Parameters**:

- `is_used` (boolean, optional)
- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**:

```json
{
  "codes": [
    {
      "id": 789,
      "code": "REWARD2024ABC",
      "is_used": false,
      "created_at": "2024-01-16T10:00:00Z",
      "expires_at": "2024-02-15T23:59:59Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

**Success Codes**:

- `200 OK` - Codes retrieved successfully

**Error Codes**:

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

---

#### Redeem Reward Code (Customer)

```
POST /api/reward-codes/{code}/redeem
```

**Description**: Redeem a reward code  
**Authentication**: Required (customer)  
**Path Parameters**:

- `code` (string, required)

**Request Body**: None

**Response Body**:

```json
{
  "success": true,
  "reward": {
    "type": "coupon",
    "details": {
      "coupon_id": 460,
      "type": "amount",
      "value": 5.0,
      "expires_at": "2024-02-15T23:59:59Z"
    }
  }
}
```

**Success Codes**:

- `200 OK` - Code redeemed successfully

**Error Codes**:

- `400 Bad Request` - Code already used
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Code not found or expired

**Business Logic**:

- Mark code as used (`is_used` = true)
- Generate a coupon for the customer (amount type, e.g., $5 off)
- Coupon expires at the same time as the code

**Validation**:

- Code must exist and not be used
- Current timestamp must be before `expires_at`

---

### 2.9 Contact Submissions

#### Submit Contact Form (Public/Authenticated)

```
POST /api/contact
```

**Description**: Submit a message via contact form  
**Authentication**: Optional (if authenticated, user_id is captured automatically)  
**Request Body**:

```json
{
  "email": "customer@example.com",
  "message": "I have a question about..."
}
```

**Response Body**:

```json
{
  "id": 123,
  "message": "Message submitted successfully",
  "created_at": "2024-01-16T10:00:00Z"
}
```

**Success Codes**:

- `201 Created` - Message submitted successfully

**Error Codes**:

- `400 Bad Request` - Invalid email or missing message

**Validation**:

- If user is authenticated, capture `user_id` automatically; `email` field is optional
- If user is not authenticated, `email` field is required and must be valid email format
- `message` is required, max 2000 characters

---

#### List Contact Submissions (Seller Only)

```
GET /api/contact-submissions
```

**Description**: Retrieve list of contact form submissions  
**Authentication**: Required (seller)  
**Query Parameters**:

- `limit` (integer, optional, default: 50)
- `offset` (integer, optional, default: 0)

**Response Body**:

```json
{
  "submissions": [
    {
      "id": 123,
      "user_id": "uuid",
      "email": "customer@example.com",
      "message": "I have a question...",
      "created_at": "2024-01-16T10:00:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

**Success Codes**:

- `200 OK` - Submissions retrieved successfully

**Error Codes**:

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a seller)

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The application uses **Supabase Authentication** with JWT (JSON Web Tokens).

#### Implementation Details:

1. **User Registration/Login**: Handled by Supabase Auth API (client-side)
   - Endpoint: Supabase Auth endpoints (`/auth/v1/*`)
   - Returns JWT access token and refresh token
   - Tokens are stored client-side (secure storage)

2. **API Authentication**: All protected endpoints require JWT token
   - Header: `Authorization: Bearer <access_token>`
   - Token verification via Supabase JWT validation
   - Token contains user claims including `user_id` and `role`

3. **Token Refresh**: Automatic token refresh via Supabase client
   - Refresh token used to obtain new access token
   - Handled transparently by Supabase client SDK

4. **Row-Level Security (RLS)**: PostgreSQL RLS policies enforce data access
   - Customers can only access their own data
   - Sellers have read access to all customer data for operational purposes
   - All policies use `auth.uid()` to identify the authenticated user

### 3.2 Authorization Roles

Two primary roles:

- **Customer** (default) - Regular users who collect stamps and use coupons
- **Seller** - Staff/owner who can add stamps, coupons, manage flavors, etc.

Role determination:

- Role is stored in Supabase `auth.users` metadata or custom claims
- Presence of record in `sellers` table indicates seller role
- API checks role before allowing seller-only operations

### 3.3 Security Considerations

1. **HTTPS Only**: All API communication must use HTTPS
2. **Token Expiry**: Access tokens expire after 1 hour, refresh tokens after 30 days
3. **Rate Limiting**: Implement rate limiting per IP/user:
   - Public endpoints: 100 requests/minute
   - Authenticated endpoints: 300 requests/minute
4. **Input Validation**: All inputs validated server-side
5. **SQL Injection Prevention**: Use parameterized queries (handled by Supabase SDK)
6. **CORS Configuration**: Restrict to application domain only
7. **Audit Logging**: Log all seller actions (stamp additions, coupon usage, etc.)

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Profiles

- `short_id`: Must be unique, 6-8 alphanumeric characters, auto-generated
- `stamp_count`: Must be >= 0 AND < 10 (enforced by database constraint)

#### Stamps

- `count`: Must be positive integer (1-10) when adding stamps
- `user_id`: Must reference existing profile
- `status`: Must be one of `active`, `redeemed`

#### Coupons

- `type`: Must be one of `free_scoop`, `percentage`, `amount` (ENUM validation)
- `value`:
  - Required for `percentage` and `amount` types
  - Must be NULL for `free_scoop` type
  - For `percentage`: typically 1-100
  - For `amount`: must be > 0
- `status`: Must be one of `active`, `used`, `expired` (ENUM validation)
- `expires_at`: Must be in the future when creating
- Cannot mark coupon as used if already used or expired

#### Reward Codes

- `code`: Must be unique, 12-16 uppercase alphanumeric characters, auto-generated
- `expires_at`: Must be in the future when creating
- Cannot redeem if already used or expired

#### Ice Cream Flavors

- `name`: Required, non-empty string, max 100 characters
- `is_available`: Boolean, defaults to true

#### Contact Submissions

- `email`: Required if user not authenticated, must be valid email format
- `message`: Required, non-empty, max 2000 characters

### 4.2 Business Logic Implementation

#### Automatic Coupon Generation

**Implementation**: PostgreSQL database trigger on `stamps` table

**Logic**:

1. After INSERT on `stamps`, check if user's `stamp_count` + new stamps >= 10
2. If true:
   - Insert new coupon record with `type` = 'free_scoop'
   - Set `expires_at` to 30 days from creation
   - Update the 10 most recent `active` stamps:
     - Set `status` = 'redeemed'
     - Set `redeemed_for_coupon_id` = new coupon id
   - Reset user's `stamp_count` to remaining stamps
3. If false:
   - Increment user's `stamp_count` by number of stamps added

**Database Function**:

```sql
CREATE OR REPLACE FUNCTION process_stamp_addition()
RETURNS TRIGGER AS $$
DECLARE
  stamps_needed INT := 10;
  current_count INT;
  new_coupon_id BIGINT;
BEGIN
  SELECT stamp_count INTO current_count FROM profiles WHERE id = NEW.user_id;

  IF current_count >= stamps_needed THEN
    INSERT INTO coupons (user_id, type, status, expires_at)
    VALUES (NEW.user_id, 'free_scoop', 'active', NOW() + INTERVAL '30 days')
    RETURNING id INTO new_coupon_id;

    UPDATE stamps
    SET status = 'redeemed', redeemed_for_coupon_id = new_coupon_id
    WHERE id IN (
      SELECT id FROM stamps
      WHERE user_id = NEW.user_id AND status = 'active'
      ORDER BY created_at ASC
      LIMIT stamps_needed
    );

    UPDATE profiles
    SET stamp_count = stamp_count - stamps_needed
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_stamps
AFTER INSERT ON stamps
FOR EACH ROW
EXECUTE FUNCTION process_stamp_addition();
```

#### Stamp Count Management

**Database Trigger**:

```sql
CREATE OR REPLACE FUNCTION update_stamp_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET stamp_count = stamp_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stamp_count
AFTER INSERT ON stamps
FOR EACH ROW
EXECUTE FUNCTION update_stamp_count();
```

#### Coupon Expiration

Scheduled job (daily cron or Supabase Edge Function):

```sql
UPDATE coupons
SET status = 'expired'
WHERE expires_at < NOW() AND status = 'active';
```

#### Reward Code Redemption Logic

1. Verify code exists and not used
2. Verify code not expired
3. Mark code as used
4. Generate $5 amount coupon for user
5. Set coupon expiry to match code expiry

---

## 5. Error Handling Standards

### 5.1 Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### 5.2 Common Error Codes

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but not authorized for this resource
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Unexpected server error

---

## 6. Performance Considerations

### 6.1 Caching Strategy

- **Flavors List**: Cache for 5 minutes
- **User Profile**: Cache for 1 minute
- **Activity History**: No caching (real-time data)

### 6.2 Database Optimization

- Use indexes on frequently queried fields (already defined in DB schema)
- Denormalize `stamp_count` for fast reads
- Use database views for complex queries (activity_history)
- Implement pagination for all list endpoints

### 6.3 Rate Limiting

- Implement using Supabase Edge Functions or API Gateway
- Track requests per user/IP
- Return `429 Too Many Requests` with `Retry-After` header

---

## 7. Testing Requirements

### 7.1 Unit Tests

- Validation logic for all input fields
- Business logic functions (coupon generation, stamp counting)
- Error handling scenarios

### 7.2 Integration Tests

- Full API endpoint flows
- Authentication and authorization
- Database trigger functionality
- RLS policy enforcement

### 7.3 Load Tests

- Simulate concurrent stamp additions
- Test rate limiting effectiveness
- Verify database performance under load

---
