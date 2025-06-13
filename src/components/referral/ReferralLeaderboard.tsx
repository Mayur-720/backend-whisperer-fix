
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getReferralLeaderboard } from "@/lib/api-referral";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import AvatarGenerator from "@/components/user/AvatarGenerator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

const ReferralLeaderboard = () => {
  const { toast } = useToast();

  const {
    data: leaderboard,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["referralLeaderboard"],
    queryFn: getReferralLeaderboard,
    meta: {
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to load leaderboard",
          description: "Could not retrieve the referral leaderboard data.",
        });
      },
    },
  });

  // Function to determine medal icon based on position
  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-sm font-bold">{position}</span>;
    }
  };

  // Function to determine style based on position
  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "border-yellow-500 shadow-md shadow-yellow-500/20";
      case 2:
        return "border-gray-400";
      case 3:
        return "border-amber-700";
      default:
        return "";
    }
  };
  
  // Function to get top user rewards
  const getTopReward = (position: number) => {
    switch (position) {
      case 1:
        return {
          icon: <Star className="h-4 w-4 mr-1 text-yellow-500" />,
          label: "₹1000 + Premium For Life",
          tooltip: "Top shadow gets ₹1000 cash reward and lifetime premium access"
        };
      case 2:
        return {
          icon: <Star className="h-4 w-4 mr-1 text-gray-400" />,
          label: "₹500 + 1 Year Premium",
          tooltip: "Second place shadow gets ₹500 cash reward and 1 year of premium access"
        };
      case 3:
        return {
          icon: <Star className="h-4 w-4 mr-1 text-amber-700" />,
          label: "₹250 + 6 Months Premium",
          tooltip: "Third place shadow gets ₹250 cash reward and 6 months of premium access"
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Shadows This Month</CardTitle>
          <CardDescription>
            The most successful shadow recruiters in the Undercover network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Failed to load leaderboard data. Please try again later.
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard?.map((entry) => {
                const topReward = getTopReward(entry.position);
                
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getPositionStyle(
                      entry.position
                    )} ${entry.position <= 3 ? "bg-purple-900/20" : "bg-card"}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex justify-center items-center w-8 h-8">
                        {getPositionBadge(entry.position)}
                      </div>
                      <AvatarGenerator
                        emoji={entry.avatarEmoji}
                        nickname={entry.anonymousAlias}
                        color="#6E59A5"
                        size="sm"
                      />
                      <div className="space-y-1">
                        <p className="font-medium">{entry.anonymousAlias}</p>
                        
                        {topReward && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-xs flex items-center text-purple-300">
                                  {topReward.icon} {topReward.label}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{topReward.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                      {entry.referralsCount} Referrals
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The leaderboard updates daily. Here's how you can climb the ranks:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Each verified referral earns you one point</li>
            <li>New users must complete profile setup and remain active for 7 days to count</li>
            <li>Monthly winners receive exclusive in-app rewards and community recognition</li>
            <li>Top 3 shadows receive special cash rewards and premium features</li>
            <li>The leaderboard resets on the 1st of each month</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralLeaderboard;
