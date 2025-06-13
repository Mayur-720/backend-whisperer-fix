/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserReferralInfo, getReferralStats } from '@/lib/api-referral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Progress  from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Gift, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReferralTierCard from './ReferralTierCard';

const ReferralDashboard = () => {
  const { toast } = useToast();

  const {
    data: referralInfo,
    isLoading: isLoadingReferralInfo,
    isError: isErrorReferralInfo,
  } = useQuery({
    queryKey: ['referralInfo'],
    queryFn: getUserReferralInfo,
  });

  const {
    data: referralStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
  } = useQuery({
    queryKey: ['referralStats'],
    queryFn: getReferralStats,
  });

  if (isErrorReferralInfo || isErrorStats) {
    toast({
      variant: 'destructive',
      title: 'Error Loading Referral Information',
      description: 'Please try again later.',
    });
  }

  const isLoading = isLoadingReferralInfo || isLoadingStats;

  const calculateProgressToNextTier = () => {
    if (!referralInfo || !referralStats) return 0;
    const nextMilestone = referralStats.nextMilestone;
    const currentReferrals = referralInfo.referralsCount;
    const currentTier = referralInfo.tiers.find(
      (tier) => tier.requiredReferrals > currentReferrals
    );
    if (!currentTier) return 100;
    const previousTierReferrals = currentTier.level > 1
      ? referralInfo.tiers[currentTier.level - 2].requiredReferrals
      : 0;
    const tierProgress =
      ((currentReferrals - previousTierReferrals) /
        (currentTier.requiredReferrals - previousTierReferrals)) *
      100;
    return Math.round(tierProgress);
  };

  const enhancedTiers = referralInfo?.tiers.map((tier) => ({
    ...tier,
    isUnlocked: referralInfo.referralsCount >= tier.requiredReferrals,
    isClaimed: referralInfo.claimedRewards?.some(
      (r: any) => r.tierLevel === tier.level && r.status === 'completed'
    ) || false,
  }));

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Referral Progress</span>
            {!isLoading && referralInfo && (
              <Badge variant="outline" className="bg-undercover-purple/10 text-undercover-light-purple">
                {referralInfo.referralsCount} Referrals
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Invite friends and earn rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{referralInfo?.referralsCount || 0} Shadows Recruited</span>
                  <span>Next Milestone: {referralStats?.nextMilestone || 5} Referrals</span>
                </div>
                <Progress
                  value={calculateProgressToNextTier()}
                  className="w-full"
                  indicatorClassName="bg-undercover-purple"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center p-4 bg-card border rounded-lg">
                  <Users className="w-8 h-8 text-undercover-purple mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                    <p className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-card border rounded-lg">
                  <Gift className="w-8 h-8 text-undercover-purple mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{referralStats?.completedReferrals || 0}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-card border rounded-lg">
                  <Award className="w-8 h-8 text-undercover-purple mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Leaderboard</p>
                    <p className="text-2xl font-bold">
                      #{referralInfo?.leaderboardPosition || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div>
        <h2 className="text-xl font-bold mb-4">Reward Tiers</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {enhancedTiers?.map((tier) => (
              <ReferralTierCard
                key={tier.level}
                tier={tier}
                currentReferrals={referralInfo.referralsCount}
                isClaimed={tier.isClaimed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboard;