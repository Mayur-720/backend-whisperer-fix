/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReferralTier } from '@/types/referral';
import { useMutation } from '@tanstack/react-query';
import { claimReward } from '@/lib/api-referral';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Loader2, Gift } from 'lucide-react';

interface ClaimRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: ReferralTier;
  onSuccess?: () => void;
}

const ClaimRewardModal: React.FC<ClaimRewardModalProps> = ({ open, onOpenChange, tier, onSuccess }) => {
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ tierId }: { tierId: number }) => claimReward(tierId),
    onSuccess: (data: { success: boolean; message: string; razorpayOrder?: { orderId: string; amount: number; currency: string } }) => {
      if (tier.rewardType === 'cash' && data.razorpayOrder) {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXX',
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          name: 'Undercover Rewards',
          description: `Claim ₹100 for ${tier.requiredReferrals} referrals`,
          order_id: data.razorpayOrder.orderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api.post('/api/users/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setClaimSubmitted(true);
              toast({
                title: 'Reward Claimed!',
                description: 'Your cash reward has been processed successfully.',
              });
              onSuccess?.();
            } catch (error: any) {
              toast({
                variant: 'destructive',
                title: 'Payment Verification Failed',
                description: error.response?.data?.message || 'Please contact support.',
              });
            }
          },
          theme: {
            color: '#9333EA',
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        setClaimSubmitted(true);
        toast({
          title: 'Reward Claimed!',
          description: data.message,
        });
        onSuccess?.();
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Claim Reward',
        description: error.response?.data?.message || 'Please try again later.',
      });
    },
  });

  const handleClaim = () => {
    if (!tier.isUnlocked) {
      toast({
        variant: 'destructive',
        title: 'Reward Not Unlocked',
        description: `You need ${tier.requiredReferrals} referrals to claim this reward.`,
      });
      return;
    }
    mutate({ tierId: tier.level });
  };

  const closeAndReset = () => {
    setClaimSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent className="sm:max-w-[425px] bg-card border-undercover-purple/30">
        {!claimSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center text-undercover-light-purple">
                <span className="text-2xl mr-2">{tier.rewardIcon}</span>
                Claim Your {tier.rewardDescription}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {tier.rewardType === 'cash'
                  ? 'You will be redirected to Razorpay to complete your ₹100 reward payment.'
                  : `Claim your ${tier.rewardDescription} now.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <Button
                onClick={handleClaim}
                disabled={isPending || !tier.isUnlocked}
                className="w-full bg-undercover-purple hover:bg-undercover-deep-purple"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                Claim Reward
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-5xl mb-4">{tier.rewardIcon}</div>
                <DialogTitle className="text-2xl mb-2 text-undercover-light-purple">Reward Claimed!</DialogTitle>
                <DialogDescription className="text-center text-muted-foreground">
                  {tier.rewardType === 'cash'
                    ? 'Your ₹100 reward has been processed. You will receive it within 3-5 business days.'
                    : tier.rewardType === 'badge'
                    ? 'Your badge is now unlocked and visible on your profile!'
                    : 'Your premium features have been activated!'}
                </DialogDescription>
              </div>
            </DialogHeader>
            <div className="flex justify-center">
              <Button
                onClick={closeAndReset}
                className="bg-undercover-purple hover:bg-undercover-deep-purple"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClaimRewardModal;