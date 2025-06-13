/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Trash,
  Edit,
  Send,
  Eye,
  Share2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AvatarGenerator from '../user/AvatarGenerator';
import { useAuth } from '@/context/AuthContext';
import {
  likePost,
  addComment,
  getComments,
  editComment,
  deleteComment,
  replyToComment,
  incrementShareCount,
} from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import EditPostModal from './EditPostModal';
import DeletePostDialog from './DeletePostDialog';
import CommentItem from './CommentItem';
import GuessIdentityModal from '@/components/recognition/GuessIdentityModal';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import ModernImageSlider from '@/components/ui/modern-image-slider';
import { cn } from '@/lib/utils';

interface Post {
  _id: string;
  user: string;
  username?: string;
  anonymousAlias: string;
  avatarEmoji: string;
  content: string;
  imageUrl?: string;
  images?: string[];
  videos?: Array<{
    url: string;
    thumbnail?: string;
    duration?: number;
    size?: number;
  }>;
  likes: { user: string }[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
  shareCount?: number;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onRefresh?: () => void;
  showOptions?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onRefresh,
  showOptions = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like) => like.user === currentUserId)
  );
  const [isLiking, setIsLiking] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const isOwnPost = post.user === currentUserId;

  const handleAliasClick = (userId: string, alias: string) => {
    navigate(`/profile/${userId}`, { state: { anonymousAlias: alias } });
  };

  const handleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      const response = await likePost(post._id);

      setLikeCount(response.likes.length);
      setIsLiked(!isLiked);

      // Like animation
      if (!isLiked) {
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not like this post. Please try again.',
      });
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!isLiked) {
        handleLike();
      }
    }
    setLastTap(now);
  };

  const handleShare = async (platform?: 'whatsapp' | 'instagram' | 'link') => {
    try {
      setIsSharing(true);

      const postUrl = `${window.location.origin}/post/${post._id}`;
      const shareText = `${post.anonymousAlias}'s post: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`;

      switch (platform) {
        case 'whatsapp': {
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`;
          window.open(whatsappUrl, '_blank');
          break;
        }

        case 'instagram': {
          const instagramUrl = `https://www.instagram.com/?url=${encodeURIComponent(postUrl)}`;
          window.open(instagramUrl, '_blank');
          break;
        }

        case 'link':
        default:
          if (navigator.share) {
            await navigator.share({
              title: `${post.anonymousAlias}'s post`,
              text: shareText,
              url: postUrl,
            });
            toast({
              title: 'Post shared',
              description: 'The post has been shared successfully!',
            });
          } else {
            await navigator.clipboard.writeText(postUrl);
            toast({
              title: 'Link copied',
              description: 'Post link has been copied to clipboard!',
            });
          }
          break;
      }

      const response = await incrementShareCount(post._id);
      setShareCount(response.shareCount);

    } catch (error) {
      console.error('Error sharing post:', error);

      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not share this post. Please try again.',
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const loadComments = async () => {
    if (isLoadingComments) return;

    try {
      setIsLoadingComments(true);
      const fetchedComments = await getComments(post._id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load comments. Please try again.',
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addComment(
        post._id,
        newComment.trim(),
        user.anonymousAlias
      );

      setNewComment('');
      loadComments();

      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully!',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not post your comment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await editComment(post._id, commentId, content);
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully!',
      });
      loadComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not edit your comment. Please try again.',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(post._id, commentId);
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully!',
      });
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete your comment. Please try again.',
      });
    }
  };

  const handleReplyToComment = async (commentId: string, content: string) => {
    try {
      await replyToComment(post._id, commentId, content, user.anonymousAlias);
      toast({
        title: 'Reply added',
        description: 'Your reply has been posted successfully!',
      });
      loadComments();
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not post your reply. Please try again.',
      });
    }
  };

  const postTime = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : 'Unknown time';

  const identity = {
    emoji: post.avatarEmoji || '🎭',
    nickname: post.anonymousAlias || 'Anonymous',
    color: '#9333EA',
  };

  const targetUser: User = {
    _id: post.user,
    anonymousAlias: post.anonymousAlias,
    avatarEmoji: post.avatarEmoji,
    username: post.username || '',
    email: '',
    fullName: '',
    recognitionAttempts: 0,
    successfulRecognitions: 0,
    recognizedUsers: [],
    identityRecognizers: [],
  };

  // Handle both old imageUrl and new images/videos arrays
  const displayImages = post.images && post.images.length > 0 
    ? post.images 
    : post.imageUrl 
      ? [post.imageUrl] 
      : [];

  const displayVideos = post.videos || [];

  return (
    <Card className="border border-gray-800 bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-200 mb-6 mx-auto max-w-lg rounded-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="p-4 pb-3 cursor-pointer" onClick={() => handleAliasClick(post.user, post.anonymousAlias)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <AvatarGenerator
              emoji={identity.emoji}
              nickname={identity.nickname}
              color={identity.color}
              size="md"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-gray-100">{identity.nickname}</span>
              <span className="text-xs text-gray-400">{postTime}</span>
            </div>
          </div>

          {showOptions && isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800 rounded-full text-gray-400">
                  <MoreVertical size={16} />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => setEditModalOpen(true)} className="text-gray-200 hover:bg-gray-700">
                  <Edit size={16} className="mr-2" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-400 focus:text-red-400 hover:bg-gray-700"
                >
                  <Trash size={16} className="mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0 relative" onTouchEnd={handleDoubleTap} onClick={handleDoubleTap}>
        {/* Text Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-gray-200 leading-relaxed">{post.content}</p>
          </div>
        )}

        {/* Media Content */}
        {(displayImages.length > 0 || displayVideos.length > 0) && (
          <ModernImageSlider 
            images={displayImages}
            videos={displayVideos}
            className="mb-0" 
          />
        )}

        {/* Like Animation */}
        {showLikeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/10">
            <div className="bg-gray-800 rounded-full p-4 shadow-lg animate-pulse">
              <Heart 
                size={48} 
                className="text-red-500 fill-red-500" 
              />
            </div>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-4 pt-3 flex flex-col space-y-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-6">
            {/* Like Button */}
            <button
              className="flex items-center space-x-2 group"
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart
                size={24}
                className={cn(
                  "transition-all duration-200",
                  isLiked 
                    ? 'fill-red-500 text-red-500 scale-110' 
                    : 'text-gray-400 group-hover:text-red-500 group-active:scale-110'
                )}
              />
              <span className={cn(
                "text-sm font-medium transition-colors",
                isLiked ? 'text-red-500' : 'text-gray-400'
              )}>
                {likeCount}
              </span>
            </button>

            {/* Comment Button */}
            <button
              className="flex items-center space-x-2 group"
              onClick={handleToggleComments}
            >
              <MessageCircle size={24} className="text-gray-400 group-hover:text-blue-400 group-active:scale-110 transition-all duration-200" />
              <span className="text-sm font-medium text-gray-400">
                {comments.length || post.comments?.length || 0}
              </span>
            </button>

            {/* Share Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center space-x-2 group"
                  disabled={isSharing}
                >
                  <Share2 size={24} className="text-gray-400 group-hover:text-green-400 group-active:scale-110 transition-all duration-200" />
                  <span className="text-sm font-medium text-gray-400">{shareCount}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="text-gray-200 hover:bg-gray-700">
                  Share via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('instagram')} className="text-gray-200 hover:bg-gray-700">
                  Share via Instagram
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('link')} className="text-gray-200 hover:bg-gray-700">
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Guess Identity Button */}
          {!isOwnPost && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGuessModalOpen(true)}
              className="px-4 py-2 text-sm border-purple-500 text-purple-400 hover:bg-purple-900/20 hover:border-purple-400 rounded-full font-medium bg-transparent"
            >
              <Eye size={16} className="mr-1" /> 
              Guess?
            </Button>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="w-full border-t border-gray-700 pt-4 mt-2">
            {isLoadingComments ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-6 w-6 border-2 border-purple-500 rounded-full border-t-transparent"></div>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    postId={post._id}
                    onDelete={handleDeleteComment}
                    onEdit={handleEditComment}
                    onReply={handleReplyToComment}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-4">
                No comments yet
              </p>
            )}

            {/* Add Comment */}
            <div className="mt-4 flex space-x-3">
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="resize-none border-gray-700 bg-gray-800 text-gray-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:ring-purple-500/20 placeholder:text-gray-500"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSubmitComment}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-3 self-end"
                disabled={!newComment.trim() || isSubmitting}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>

      {/* Modals */}
      {isOwnPost && (
        <>
          <EditPostModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            post={post}
            onSuccess={() => {
              if (onRefresh) onRefresh();
            }}
          />

          <DeletePostDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            postId={post._id}
            onSuccess={() => {
              if (onRefresh) onRefresh();
            }}
          />
        </>
      )}

      {!isOwnPost && (
        <GuessIdentityModal
          open={guessModalOpen}
          onOpenChange={setGuessModalOpen}
          targetUser={targetUser}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            toast({
              title: 'Recognition successful! 🎉',
              description: `You correctly identified ${post.anonymousAlias}!`,
            });
          }}
        />
      )}
    </Card>
  );
};

export default PostCard;
