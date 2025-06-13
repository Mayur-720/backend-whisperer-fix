
export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  anonymousAlias: string;
  avatarEmoji: string;
  recognitionAttempts: number;
  successfulRecognitions: number;
  recognizedUsers: Array<{
    userId: string;
    recognizedAt: string;
  }>;
  identityRecognizers: Array<{
    userId: string;
    recognizedAt: string;
  }>;
}

export interface Video {
  url: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
}

export interface Post {
  _id: string;
  user: string;
  username?: string;
  anonymousAlias: string;
  avatarEmoji: string;
  content: string;
  imageUrl?: string;
  images?: string[];
  videos?: Video[];
  likes: { user: string }[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
  shareCount?: number;
  expiresAt: string;
  ghostCircle?: string;
}

export interface GhostCircle {
  _id: string;
  name: string;
  description: string;
  creator: string;
  members: Array<{
    userId: string;
    joinedAt: string;
  }>;
  posts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: string;
  anonymousAlias: string;
  avatarEmoji: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}
