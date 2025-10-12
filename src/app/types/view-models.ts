/**
 * View Model Type Definitions
 *
 * This file contains all view model types used in components.
 * View models transform DTOs into component-specific formats.
 */

import { ProfileDTO } from './index';

// ============================================================================
// Dashboard View Models
// ============================================================================

/**
 * Stamp Progress View Model - Computed state for stamp progress visualization
 */
export interface StampProgressViewModel {
  /** Current number of stamps collected */
  current: number;
  /** Maximum number of stamps (always 10) */
  total: number;
  /** Percentage progress: (current / total) * 100 */
  percentage: number;
  /** Remaining stamps to reward: total - current */
  stampsToReward: number;
  /** Whether all stamps have been collected: current === total */
  isComplete: boolean;
}

/**
 * Dashboard View Model - Main view model for Dashboard page
 */
export interface DashboardViewModel {
  /** User profile data */
  profile: ProfileDTO;
  /** Computed stamp progress state */
  stampProgress: StampProgressViewModel;
  /** Optional: Number of active coupons (for future implementation) */
  activeCouponsCount?: number;
}

/**
 * User ID Display View Model - View model for UserIdDisplayComponent
 */
export interface UserIdDisplayViewModel {
  /** User's short ID (6-8 character alphanumeric code) */
  shortId: string;
  /** Optional: Pre-generated QR code data URL */
  qrCodeDataUrl?: string;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * User ID Display Props - Input properties for UserIdDisplayComponent
 */
export interface UserIdDisplayProps {
  /** User's short ID to display */
  shortId: string;
  /** Whether to show QR code (default: true) */
  showQRCode?: boolean;
}

/**
 * Stamp Progress Props - Input properties for StampProgressComponent
 */
export interface StampProgressProps {
  /** Current number of stamps collected */
  stampCount: number;
  /** Maximum number of stamps (default: 10) */
  maxStamps?: number;
}

/**
 * Coupon Navigation Card Props - Input properties for CouponNavigationCardComponent
 */
export interface CouponNavigationCardProps {
  /** Optional: Number of active coupons to display in badge */
  activeCouponsCount?: number;
}
