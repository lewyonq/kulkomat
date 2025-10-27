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

// ============================================================================
// Coupons View Models
// ============================================================================

import { CouponType, CouponStatus, ActivityType } from './index';

/**
 * Coupon Card View Model - Model widoku dla pojedynczego kuponu
 * Rozszerza CouponDTO o computed properties dla UI
 */
export interface CouponCardViewModel {
  /** ID kuponu */
  id: number;
  /** Typ kuponu */
  type: CouponType;
  /** Wartość rabatu (null dla free_scoop) */
  value: number | null;
  /** Status kuponu */
  status: CouponStatus;
  /** Data utworzenia (ISO string) */
  createdAt: string;
  /** Data wygaśnięcia (ISO string) */
  expiresAt: string;
  /** Czy kupon jest aktywny (computed) */
  isActive: boolean;
  /** Czy kupon wygasł (computed) */
  isExpired: boolean;
  /** Czy kupon został wykorzystany (computed) */
  isUsed: boolean;
  /** Sformatowany tytuł kuponu (np. "Darmowa gałka", "Rabat 15%") */
  title: string;
  /** Opis kuponu */
  description: string;
  /** Sformatowana data wygaśnięcia (np. "Ważny do 31.12.2024") */
  formattedExpiryDate: string;
  /** Kolor gradientu dla ikony (zależny od typu) */
  iconGradient: string;
  /** Nazwa ikony SVG (zależna od typu) */
  iconName: 'ticket' | 'percent' | 'coins';
}

/**
 * Coupons View Model - Model widoku dla strony kuponów
 */
export interface CouponsViewModel {
  /** Lista kuponów (posortowana) */
  coupons: CouponCardViewModel[];
  /** Liczba aktywnych kuponów */
  activeCouponsCount: number;
  /** Liczba wykorzystanych kuponów */
  usedCouponsCount: number;
  /** Czy lista jest pusta */
  isEmpty: boolean;
}

// ============================================================================
// Ice Cream Flavors View Models
// ============================================================================

/**
 * Flavor View Model - Model widoku dla pojedynczego smaku lodów
 */
export interface FlavorVM {
  /** Unikalny identyfikator smaku */
  id: number;
  /** Nazwa smaku (np. "Czekoladowy", "Waniliowy") */
  name: string;
  /** Status dostępności smaku */
  isAvailable: boolean;
}

/**
 * Activity Item View Model - Model widoku dla pojedynczej aktywności
 * Wzbogaca ActivityItemDTO o pola potrzebne do renderowania w UI
 */
export interface ActivityItemViewModel {
  /** ID aktywności */
  id: number;
  /** Typ aktywności */
  type: ActivityType;
  /** Tytuł aktywności (np. "Dodano pieczątkę") */
  title: string;
  /** Opis aktywności (np. "Otrzymano w zamian za 10 pieczątek") */
  description: string;
  /** Sformatowana data (np. "14 października 2025") */
  date: string;
  /** Nazwa ikony do wyświetlenia (np. "stamp-plus", "coupon-generated") */
  icon: string;
  /** Kolor ikony/aktywności (do customizacji wyglądu) */
  color: string;
}

/**
 * Activity History View Model - Model widoku dla strony historii aktywności
 */
export interface ActivityHistoryViewModel {
  /** Lista aktywności użytkownika */
  activities: ActivityItemViewModel[];
  /** Całkowita liczba aktywności */
  total: number;
  /** Czy są dostępne kolejne strony do pobrania */
  hasMore: boolean;
}
