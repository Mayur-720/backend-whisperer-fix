
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGhostCirclePosts } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PostCard from "@/components/feed/PostCard";
import { Loader, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreatePostModal from "@/components/feed/CreatePostModal";
import { toast } from "@/hooks/use-toast";
import { Post } from "@/types";

interface CircleFeedViewProps {
  circleId: string;
  circleName: string;
  onBack?: () => void;
}

const CircleFeedView: React.FC<CircleFeedViewProps> = ({ circleId, circleName, onBack }) => {
  const { user } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['ghostCirclePosts', circleId],
    queryFn: () => getGhostCirclePosts(circleId),
    meta: {
      onError: (error) => {
        console.error("Error fetching circle posts:", error);
        toast({
          variant: "destructive",
          title: "Error loading posts",
          description: "Could not load the latest posts. Please try again later."
        });
      }
    }
  });

  const handleRefresh = () => {
    refetch();
  };

  const handlePostCreated = () => {
    setIsCreatePostOpen(false);
    refetch();
    toast({
      title: "Post created",
      description: "Your post has been shared in the Ghost Circle!"
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4 text-center">
        <p className="text-red-400">Failed to load posts. Please try again later.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-300">{circleName}</h2>
        <Button 
          variant="secondary" 
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setIsCreatePostOpen(true)}
        >
          <Plus size={16} className="mr-1" />
          New Post
        </Button>
      </div>
      
      {posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post: any) => {
            // Transform the post to match the Post interface
            const transformedPost: Post = {
              _id: post._id,
              user: typeof post.user === 'string' ? post.user : post.user?._id || post.userId || '',
              anonymousAlias: post.anonymousAlias || 'Anonymous',
              avatarEmoji: post.avatarEmoji || '🎭',
              content: post.content || '',
              imageUrl: post.imageUrl,
              images: post.images || [],
              videos: post.videos || [],
              likes: post.likes || [],
              comments: post.comments || [],
              shareCount: post.shareCount || 0,
              expiresAt: post.expiresAt || '',
              createdAt: post.createdAt || '',
              updatedAt: post.updatedAt || '',
              ghostCircle: post.ghostCircle
            };

            return (
              <PostCard 
                key={post._id} 
                post={transformedPost} 
                currentUserId={user?._id}
                onRefresh={handleRefresh}
                showOptions={true}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-400">No posts found. Be the first to post in this circle!</p>
      )}

      <CreatePostModal 
        open={isCreatePostOpen} 
        onOpenChange={setIsCreatePostOpen}
        onSuccess={handlePostCreated}
        ghostCircleId={circleId}
      />
    </div>
  );
};

export default CircleFeedView;
