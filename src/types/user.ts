
// types/user.ts
export interface User {
    _id: string;
    username: string;
    fullName: string;
    email: string;
    anonymousAlias: string;
    avatarEmoji: string;
    bio?: string;
    referralCount?: number;
    referralCode?: string;
    referredBy?: string;
    identityRecognizers?: string[] | User[]; // Array of user IDs who recognized this user
    recognizedUsers?: string[] | User[]; // Array of user IDs this user recognized
    recognitionAttempts?: number;
    successfulRecognitions?: number;
    recognitionRate?: number;
    claimedRewards?: Array<{
      tierLevel: number;
      rewardType: 'badge' | 'cash' | 'premium';
      claimedAt: string;
      paymentMethod?: 'paypal' | 'venmo' | 'giftcard';
      paymentDetails?: string;
      status: 'pending' | 'completed' | 'failed';
    }>;
    friends?: string[]; // For addFriend feature
    [x: string]: string | number | string[] | Array<{ tierLevel: number; rewardType: 'badge' | 'cash' | 'premium'; claimedAt: string; paymentMethod?: 'paypal' | 'venmo' | 'giftcard'; paymentDetails?: string; status: 'pending' | 'completed' | 'failed'; }> | undefined | User[]; // Permissive index signature
  }

  export interface Post {
    _id: string;
    content: string;
    imageUrl?: string;
    images?: string[];
    ghostCircleId?: string;
    userId: string;
    likes: string[];
    createdAt: string;
    updatedAt: string;
  }

  export interface Recognition {
    stats: {
      recognitionRate: number;
      totalRecognized: number;
      totalRecognizers: number;
      successfulRecognitions: number;
      recognitionAttempts: number;
    };
    recognized?: User[];
    recognizers?: User[];
  }
