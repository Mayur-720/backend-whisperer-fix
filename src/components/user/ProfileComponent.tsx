import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserRound,
  Settings,
  LogOut,
  Image,
  Grid,
  Edit,
  MessageSquare,
  Trash2,
  Award,
  Eye,
  Send,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile, getUserPosts, deletePost } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import EditProfileModal from "./EditProfileModal";
import EditPostModal from "@/components/feed/EditPostModal";
import DeletePostDialog from "@/components/feed/DeletePostDialog";
import RecognitionModal from "@/components/recognition/RecognitionModal";
import { toast } from "@/hooks/use-toast";
import { User, Post } from "@/types/user";

interface ProfileComponentProps {
  userId?: string;
  anonymousAlias?: string;
}

const ProfileComponent = ({
  userId: targetUserId,
  anonymousAlias: targetAlias,
}: ProfileComponentProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [recognitionModalOpen, setRecognitionModalOpen] = useState(false);
  const [editPostModalOpen, setEditPostModalOpen] = useState(false);
  const [deletePostDialogOpen, setDeletePostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const isOwnProfile = !targetUserId || targetUserId === user?._id;
  const currentUserId = isOwnProfile ? user?._id : targetUserId;

  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery<User>({
    queryKey: ["userProfile", targetUserId || user?._id],
    queryFn: () => getUserProfile(currentUserId!),
    enabled: !!currentUserId,
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: "Could not retrieve profile information.",
        });
      },
    },
  });

  const {
    data: userPosts,
    isLoading: postsLoading,
    refetch,
  } = useQuery<Post[]>({
    queryKey: ["userPosts", currentUserId],
    queryFn: () => getUserPosts(currentUserId!),
    enabled: !!currentUserId,
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load posts",
          description: "Could not retrieve posts.",
        });
      },
    },
  });

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setEditPostModalOpen(true);
  };

  const handleDeletePost = (post: Post) => {
    setSelectedPost(post);
    setDeletePostDialogOpen(true);
  };

  const handlePostUpdated = () => {
    refetch();
    setEditPostModalOpen(false);
    setSelectedPost(null);
  };

  const handlePostDeleted = () => {
    refetch();
    setDeletePostDialogOpen(false);
    setSelectedPost(null);
  };

  const handleWhisperClick = () => {
    if (targetUserId && targetUserId !== user?._id) {
      navigate(`/chat/${targetUserId}`);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Whisper",
        description: "You cannot whisper to yourself!",
      });
    }
  };

  const isLoading = profileLoading || postsLoading;

  if (!user) return null;

  const displayedAlias = isOwnProfile
    ? profileData?.anonymousAlias || user.anonymousAlias || "Unknown User"
    : targetAlias || profileData?.anonymousAlias || "Unknown User";

  const userStats = {
    posts: userPosts?.length || 0,
    recognizedBy: profileData?.identityRecognizers?.length || 0,
    recognized: profileData?.recognizedUsers?.length || 0,
    recognitionRate:
      profileData?.identityRecognizers?.length &&
      profileData.recognizedUsers?.length
        ? Math.round(
            (profileData.recognizedUsers.length /
              profileData.identityRecognizers.length) *
              100
          ) || 0
        : 0,
  };

  const claimedBadges =
    profileData?.claimedRewards?.filter(
      (reward) => reward.rewardType === "badge" && reward.status === "completed"
    ) || [];

  return (
    <div className="max-w-4xl w-full mx-auto px-2 py-2 sm:px-4 sm:py-4">
      <Card className="bg-card shadow-md border border-undercover-purple/20 mb-4">
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-full bg-undercover-dark text-2xl sm:text-3xl">
                  {profileData?.avatarEmoji || user.avatarEmoji || "🎭"}
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-undercover-light-purple">
                    {displayedAlias}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    @{profileData?.username || user.username}
                  </p>
                  {claimedBadges.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {claimedBadges.map((reward) => (
                        <span
                          key={reward.tierLevel}
                          className="text-lg"
                          title="Shadow Recruiter Badge"
                        >
                          {reward.tierLevel === 1 ? "🥷" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {isOwnProfile && (
                <div className="sm:hidden">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    <Edit size={16} />
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden sm:flex gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/whispers")}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Messages
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecognitionModalOpen(true)}
                  >
                    <Eye size={16} className="mr-2" />
                    Recognitions
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhisperClick}
                >
                  <Send size={16} className="mr-2" />
                  Whisper
                </Button>
              )}
            </div>
            
            {isOwnProfile && (
              <div className="flex sm:hidden gap-2 mt-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate("/whispers")}
                >
                  <MessageSquare size={16} className="mr-2" />
                  Messages
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setRecognitionModalOpen(true)}
                >
                  <Eye size={16} className="mr-2" />
                  Recognitions
                </Button>
              </div>
            )}
            
            {!isOwnProfile && (
              <div className="flex sm:hidden mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleWhisperClick}
                >
                  <Send size={16} className="mr-2" />
                  Whisper
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 md:p-6 pt-3">
          <div className="border-t border-border my-2 sm:my-3"></div>

          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-medium">
              Your Anonymous Identity
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {profileData?.bio ||
                user.bio ||
                `In Undercover, you're known as ${displayedAlias}. This identity stays consistent throughout your experience.`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatsCard
                icon={<Grid size={16} className="text-undercover-purple" />}
                value={userStats.posts}
                label="Posts"
              />
              <StatsCard
                icon={<Eye size={16} className="text-undercover-purple" />}
                value={userStats.recognizedBy}
                label="Recognized by"
                onClick={() => setRecognitionModalOpen(true)}
                clickable
              />
              <StatsCard
                icon={<Eye size={16} className="text-undercover-purple" />}
                value={userStats.recognized}
                label="Recognized"
                onClick={() => setRecognitionModalOpen(true)}
                clickable
              />
              <StatsCard  
                icon={<Grid size={16} className="text-undercover-purple" />}
                value={`${userStats.recognitionRate}%`}
                label="Recognition rate"
              />
            </div>
          </div>

          {profileData?.claimedRewards?.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h3 className="text-sm sm:text-base font-medium flex items-center mb-2">
                <Award size={16} className="mr-2" />
                Your Rewards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {profileData.claimedRewards.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground p-2 bg-card/50 rounded-md hover:bg-card transition-colors"
                  >
                    <span>
                      {reward.rewardType === "badge"
                        ? "🥷"
                        : reward.rewardType === "cash"
                        ? "💰"
                        : "⭐"}
                    </span>
                    <p>
                      {reward.rewardType === "badge"
                        ? "Shadow Recruiter Badge"
                        : reward.rewardType === "cash"
                        ? "₹100 Cash Reward"
                        : "Premium Features"}{" "}
                      - {reward.status === "completed" ? "Claimed" : "Pending"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger
            value="posts"
            className="text-sm data-[state=active]:bg-undercover-purple data-[state=active]:text-white transition-colors"
          >
            <Grid size={16} className="mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="text-sm data-[state=active]:bg-undercover-purple data-[state=active]:text-white transition-colors"
          >
            <Settings size={16} className="mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 sm:h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : userPosts && userPosts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {userPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  isOwnProfile={isOwnProfile}
                  onEdit={() => handleEditPost(post)}
                  onDelete={() => handleDeletePost(post)}
                />
              ))}
            </div>
          ) : (
            <EmptyPostsState onCreatePost={() => navigate("/")} />
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-1">
                <h4 className="text-base font-medium">Account Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your account settings and preferences.
                </p>
              </div>

              <div className="border-t border-border my-3"></div>

              <div className="space-y-2">
                {isOwnProfile && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/profile/settings")}
                      className="justify-start text-sm w-full hover:bg-gray-100 transition-colors py-2 px-3 rounded-md"
                    >
                      <Settings size={16} className="mr-2" />
                      Account Settings
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to log out?")) {
                          logout();
                        }
                      }}
                      className="justify-start text-sm w-full transition-colors py-2 px-3 rounded-md"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditProfileModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />
      <RecognitionModal
        open={recognitionModalOpen}
        onOpenChange={setRecognitionModalOpen}
      />
      
      {selectedPost && (
        <>
          <EditPostModal
            open={editPostModalOpen}
            onOpenChange={setEditPostModalOpen}
            post={selectedPost}
            onSuccess={handlePostUpdated}
          />
          <DeletePostDialog
            open={deletePostDialogOpen}
            onOpenChange={setDeletePostDialogOpen}
            postId={selectedPost._id}
            onSuccess={handlePostDeleted}
          />
        </>
      )}
    </div>
  );
};

const StatsCard = ({ icon, value, label, onClick = () => {}, clickable = false }) => {
  const baseClasses = "text-center p-2 border border-undercover-purple/20 rounded-md bg-undercover-dark/10";
  const hoverClasses = clickable
    ? "hover:cursor-pointer hover:border-undercover-purple/50 hover:bg-undercover-dark/20 hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all duration-300"
    : "";

  return (
    <div
      className={`${baseClasses} ${hoverClasses}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="font-bold text-sm sm:text-base">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

const PostCard = ({ post, isOwnProfile, onEdit, onDelete }) => {
  return (
    <div className="relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt="Post"
          className="w-full h-32 sm:h-44 object-cover"
        />
      ) : (
        <div className="p-3 h-32 sm:h-28 flex items-center justify-center">
          <p className="text-sm line-clamp-4 overflow-hidden">
            {post.content || "No content"}
          </p>
        </div>
      )}
      {isOwnProfile && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/70 hover:bg-white w-7 h-7 rounded-full"
            onClick={onEdit}
          >
            <Edit className="text-black h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/70 hover:bg-white w-7 h-7 rounded-full"
            onClick={onDelete}
          >
            <Trash2 className="text-black h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

const EmptyPostsState = ({ onCreatePost }) => {
  return (
    <div className="text-center py-8 border border-dashed rounded-lg bg-card">
      <Image className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium mb-1">No Posts Yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Share your thoughts anonymously!
      </p>
      <Button
        onClick={onCreatePost}
        className="bg-undercover-purple hover:bg-undercover-deep-purple"
      >
        <Plus size={16} className="mr-2" />
        Create your first post
      </Button>
    </div>
  );
};

export default ProfileComponent;
