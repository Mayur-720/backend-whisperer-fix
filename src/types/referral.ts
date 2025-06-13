// src/types/referral.ts
export interface ReferralTier {
  level: number;
  requiredReferrals: number;
  rewardType: 'badge' | 'cash' | 'premium';
  rewardDescription: string;
  rewardIcon: string;
  isUnlocked: boolean;
  isClaimed?: boolean; // Added for enhancedTiers
}

export interface RewardHistory {
  tierLevel: number; // Matches backend (userController.js)
  rewardType: 'badge' | 'cash' | 'premium';
  rewardDescription: string;
  status: 'pending' | 'completed'; // Matches backend
  claimedAt: string; // ISO date string
  paymentDetails?: string; // For cash rewards (Razorpay order ID)
}

export interface ReferralProgram {
  referralCode: string;
  referralsCount: number;
  tiers: ReferralTier[];
  claimedRewards: RewardHistory[]; // Renamed from rewards for clarity
  leaderboardPosition?: number;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  nextMilestone: number;
  currentTier: number;
}

export interface LeaderboardEntry {
  position: number;
  anonymousAlias: string;
  avatarEmoji: string;
  referralsCount: number;
  userId: string;
}