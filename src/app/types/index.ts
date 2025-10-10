/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 * 
 * This file contains all types used for API requests and responses.
 * All types are derived from database entity definitions to ensure type safety.
 */

import { Tables, TablesInsert, TablesUpdate, Enums } from '../../db/database.types';

// ============================================================================
// Re-export Database Enums
// ============================================================================

export type CouponStatus = Enums<'coupon_status'>;
export type CouponType = Enums<'coupon_type'>;
export type StampStatus = Enums<'stamp_status'>;

// ============================================================================
// Profile DTOs
// ============================================================================

/**
 * Profile DTO - User profile data
 * Derived from: profiles table Row type
 */
export type ProfileDTO = Tables<'profiles'>;

/**
 * Create Profile Command - Request to create a new profile
 * Derived from: profiles table Insert type
 * API: POST /api/profiles
 */
export type CreateProfileCommand = Pick<TablesInsert<'profiles'>, 'id'>;

// ============================================================================
// Stamp DTOs
// ============================================================================

/**
 * Stamp DTO - Individual stamp record
 * Derived from: stamps table Row type
 */
export type StampDTO = Tables<'stamps'>;

/**
 * Add Stamps Command - Request to add stamp(s) to customer account
 * API: POST /api/stamps
 */
export interface AddStampsCommand {
  user_id: string;
  count?: number; // Default: 1, Max: 10
}

/**
 * Add Stamps Response DTO - Response after adding stamps
 * API: POST /api/stamps
 */
export interface AddStampsResponseDTO {
  stamps_added: number;
  new_stamp_count: number;
  coupon_generated: boolean;
  stamps: StampDTO[];
}

/**
 * Stamps List DTO - Paginated list of stamps
 * API: GET /api/profiles/me/stamps, GET /api/stamps
 */
export interface StampsListDTO {
  stamps: StampDTO[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Coupon DTOs
// ============================================================================

/**
 * Coupon DTO - Discount coupon data
 * Derived from: coupons table Row type
 */
export type CouponDTO = Tables<'coupons'>;

/**
 * Create Coupon Command - Request to manually create a coupon
 * Derived from: coupons table Insert type
 * API: POST /api/coupons
 */
export interface CreateCouponCommand {
  user_id: string;
  type: CouponType;
  value: number | null;
  expires_at: string;
}

/**
 * Use Coupon Command - Request to mark coupon as used
 * API: PATCH /api/coupons/{coupon_id}/use
 */
export interface UseCouponCommand {
  user_id: string;
}

/**
 * Coupons List DTO - Paginated list of coupons
 * API: GET /api/profiles/me/coupons, GET /api/coupons
 */
export interface CouponsListDTO {
  coupons: CouponDTO[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Customer DTOs (Seller View)
// ============================================================================

/**
 * Customer DTO - Extended profile data with coupon count
 * Derived from: profiles table Row type with additional computed field
 * API: GET /api/customers
 */
export interface CustomerDTO extends ProfileDTO {
  active_coupons_count: number;
}

/**
 * Customers List DTO - Paginated list of customers
 * API: GET /api/customers
 */
export interface CustomersListDTO {
  customers: CustomerDTO[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Activity History DTOs
// ============================================================================

/**
 * Activity Type - Types of activities in history
 */
export type ActivityType = 
  | 'stamp_added' 
  | 'coupon_generated' 
  | 'coupon_used' 
  | 'coupon_expired';

/**
 * Activity Details - Type-specific activity details
 */
export type ActivityDetails = 
  | { status: StampStatus }
  | { coupon_type: CouponType }
  | Record<string, never>;

/**
 * Activity Item DTO - Single activity record
 * API: GET /api/profiles/me/activity-history, GET /api/activity-history
 */
export interface ActivityItemDTO {
  type: ActivityType;
  id: number;
  details: ActivityDetails;
  created_at: string;
}

/**
 * Activity History DTO - Paginated activity history
 * API: GET /api/profiles/me/activity-history, GET /api/activity-history
 */
export interface ActivityHistoryDTO {
  activities: ActivityItemDTO[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Ice Cream Flavor DTOs
// ============================================================================

/**
 * Flavor DTO - Ice cream flavor data
 * Note: ice_cream_flavors table not present in database.types.ts
 * Type definition based on API plan
 * API: GET /api/flavors
 */
// export interface FlavorDTO {
//   id: number;
//   name: string;
//   is_available: boolean;
//   created_at: string;
// }

// /**
//  * Create Flavor Command - Request to create a new flavor
//  * API: POST /api/flavors
//  */
// export interface CreateFlavorCommand {
//   name: string;
//   is_available?: boolean; // Default: true
// }

// /**
//  * Update Flavor Command - Request to update flavor availability
//  * API: PATCH /api/flavors/{flavor_id}
//  */
// export interface UpdateFlavorCommand {
//   is_available: boolean;
// }

// /**
//  * Flavors List DTO - List of ice cream flavors
//  * API: GET /api/flavors
//  */
// export interface FlavorsListDTO {
//   flavors: FlavorDTO[];
// }

// ============================================================================
// Reward Code DTOs
// ============================================================================

/**
 * Reward Code DTO - One-time promotional code
 * Note: reward_codes table not present in database.types.ts
 * Type definition based on API plan
 * API: GET /api/reward-codes, POST /api/reward-codes
 */
export interface RewardCodeDTO {
  id: number;
  code: string;
  is_used: boolean;
  used_by_user_id?: string | null;
  created_at: string;
  expires_at: string;
}

/**
 * Create Reward Code Command - Request to generate a reward code
 * API: POST /api/reward-codes
 */
export interface CreateRewardCodeCommand {
  expires_at: string;
}

/**
 * Reward Details - Details about the reward received from code redemption
 */
export interface RewardDetails {
  coupon_id: number;
  type: CouponType;
  value: number | null;
  expires_at: string;
}

/**
 * Redeem Reward Code Response DTO - Response after redeeming a code
 * API: POST /api/reward-codes/{code}/redeem
 */
export interface RedeemRewardCodeResponseDTO {
  success: boolean;
  reward: {
    type: 'coupon';
    details: RewardDetails;
  };
}

/**
 * Reward Codes List DTO - Paginated list of reward codes
 * API: GET /api/reward-codes
 */
export interface RewardCodesListDTO {
  codes: RewardCodeDTO[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Contact Submission DTOs
// ============================================================================

/**
 * Contact Submission DTO - Customer feedback/issue submission
 * Derived from: contact_submissions table Row type
 */
export type ContactSubmissionDTO = Tables<'contact_submissions'>;

/**
 * Create Contact Submission Command - Request to submit contact form
 * Derived from: contact_submissions table Insert type
 * API: POST /api/contact
 */
export interface CreateContactSubmissionCommand {
  email?: string | null; // Required if user not authenticated
  message: string;
}

/**
 * Create Contact Submission Response DTO - Response after submission
 * API: POST /api/contact
 */
export interface CreateContactSubmissionResponseDTO {
  id: number;
  message: string;
  created_at: string;
}

/**
 * Contact Submissions List DTO - Paginated list of submissions
 * API: GET /api/contact-submissions
 */
export interface ContactSubmissionsListDTO {
  submissions: ContactSubmissionDTO[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Common/Utility Types
// ============================================================================

/**
 * Generic Paginated Response - Base type for paginated endpoints
 * Used as a template for list DTOs
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * API Error Response - Standard error format
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Query Pagination Parameters - Common query parameters for list endpoints
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Stamp Query Parameters - Query parameters for stamp endpoints
 * API: GET /api/profiles/me/stamps, GET /api/stamps
 */
export interface StampQueryParams extends PaginationParams {
  status?: StampStatus;
  user_id?: string; // Required for seller endpoint
}

/**
 * Coupon Query Parameters - Query parameters for coupon endpoints
 * API: GET /api/profiles/me/coupons, GET /api/coupons
 */
export interface CouponQueryParams extends PaginationParams {
  status?: CouponStatus;
  type?: CouponType;
  user_id?: string; // Required for seller endpoint
}

/**
 * Customer Query Parameters - Query parameters for customer list endpoint
 * API: GET /api/customers
 */
export interface CustomerQueryParams extends PaginationParams {
  search?: string;
  sort?: 'created_at' | 'stamp_count' | 'short_id';
  order?: 'asc' | 'desc';
}

/**
 * Activity History Query Parameters - Query parameters for activity history
 * API: GET /api/profiles/me/activity-history, GET /api/activity-history
 */
export interface ActivityHistoryQueryParams extends PaginationParams {
  user_id?: string; // Required for seller endpoint
}

/**
 * Flavor Query Parameters - Query parameters for flavor list endpoint
 * API: GET /api/flavors
 */
// export interface FlavorQueryParams {
//   available_only?: boolean; // Default: true
// }

/**
 * Reward Code Query Parameters - Query parameters for reward code list
 * API: GET /api/reward-codes
 */
export interface RewardCodeQueryParams extends PaginationParams {
  is_used?: boolean;
}

/**
 * Contact Submission Query Parameters - Query parameters for contact submissions
 * API: GET /api/contact-submissions
 */
export interface ContactSubmissionQueryParams extends PaginationParams {
  // No additional filters specified in API plan
}
