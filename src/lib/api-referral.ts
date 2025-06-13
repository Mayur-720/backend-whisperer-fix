/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '@/lib/api';
import { LeaderboardEntry, ReferralProgram, ReferralStats } from '@/types/referral';

export const getUserReferralInfo = async (): Promise<ReferralProgram> => {
  try {
    const userResponse = await api.get('/api/users/profile');
    
    const user = userResponse.data;

    const referralCode = user.referralCode || (user._id ? generateStableCode(user._id) : 'SAMPLE');

    const referralsCount = user.referralCount || 0;

    const referralProgram: ReferralProgram = {
      referralCode,
      referralsCount,
      tiers: [
        {
          level: 1,
          requiredReferrals: 5,
          rewardType: 'badge',
          rewardDescription: 'Shadow Recruiter Badge',
          rewardIcon: '🥷',
          isUnlocked: referralsCount >= 5,
        },
        {
          level: 2,
          requiredReferrals: 10,
          rewardType: 'cash',
          rewardDescription: '₹100 Cash Reward',
          rewardIcon: '💰',
          isUnlocked: referralsCount >= 10,
        },
        {
          level: 3,
          requiredReferrals: 20,
          rewardType: 'premium',
          rewardDescription: 'Premium Features Access',
          rewardIcon: '⭐',
          isUnlocked: referralsCount >= 20,
        },
      ],
      claimedRewards: user.claimedRewards || [],
      leaderboardPosition: 0,
    };

    const leaderboard = await getReferralLeaderboard();
    const userPosition = leaderboard.findIndex((entry) => entry.userId === user._id) + 1;
    if (userPosition > 0) {
      referralProgram.leaderboardPosition = userPosition;
    }

    return referralProgram;
  } catch (error) {
    console.error('Error fetching referral info:', error);
    throw error;
  }
};

export const getReferralStats = async (): Promise<ReferralStats> => {
  try {
    const userResponse = await api.get('/api/users/profile');
    const user = userResponse.data;
    const referralsCount = user.referralCount || 0;

    const nextMilestone = referralsCount < 5 ? 5 : referralsCount < 10 ? 10 : referralsCount < 20 ? 20 : 25;
    const currentTier = referralsCount < 5 ? 0 : referralsCount < 10 ? 1 : referralsCount < 20 ? 2 : 3;

    return {
      totalReferrals: referralsCount,
      pendingReferrals: Math.min(1, Math.floor(referralsCount / 5)),
      completedReferrals: referralsCount - Math.min(1, Math.floor(referralsCount / 5)),
      nextMilestone,
      currentTier,
    };
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    throw error;
  }
};

export const getReferralLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await api.get('/api/users/referral-leaderboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

export const processReferral = async (referralCode: string): Promise<boolean> => {
  try {
    const userResponse = await api.get('/api/users/profile');
    const referredUserId = userResponse.data._id;

    const response = await api.post('/api/users/process-referral', { referralCode, referredUserId });
    return response.data.success;
  } catch (error) {
    console.error('Error processing referral:', error);
    return false;
  }
};

export const claimReward = async (tierId: number) => {
  try {
    const response = await api.post('/api/users/claim-reward', { tierLevel: tierId });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to claim reward');
  }
};

export const trackReferralShare = async (platform: string): Promise<void> => {
  try {
    console.log(`Shared referral code to ${platform}`);
  } catch (error) {
    console.error('Error tracking referral share:', error);
    throw error;
  }
};

const generateStableCode = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 6).toUpperCase().padEnd(6, '0');
};