
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserReferralInfo, trackReferralShare } from "@/lib/api-referral";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, MessageCircle, Instagram, Facebook, Twitter, Share2, Check, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReferralShare = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const {
    data: referralInfo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["referralInfo"],
    queryFn: getUserReferralInfo,
  });


  const handleCopyCode = () => {
    if (referralInfo?.referralCode) {
      navigator.clipboard.writeText(referralInfo.referralCode);
      setCopied(true);
      toast({
        title: "Referral code copied!",
        description: "You can now share it with your friends.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const handleCopyLink = () => {
    if (referralInfo?.referralCode) {
      const referralUrl = `${getBaseUrl()}/invite?code=${referralInfo.referralCode}`;
      navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Referral link copied!",
        description: "You can now share it with your friends.",
      });
    }
  };

  const handleShare = async (platform: string) => {
    try {
      let shareUrl = "";
      const referralUrl = `${getBaseUrl()}/invite?code=${referralInfo?.referralCode}`;
      const shareText = "Unmask the fun—join me on Undercover with my code!";

      switch (platform) {
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralUrl}`)}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(shareText)}`;
          break;
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${referralUrl}`)}`;
          break;
        case "instagram":
          navigator.clipboard.writeText(`${shareText} ${referralUrl}`);
          toast({
            title: "Caption copied!",
            description: "Open Instagram and paste the caption with your referral link.",
          });
          await trackReferralShare("instagram");
          return;
        case "sms":
          shareUrl = `sms:?body=${encodeURIComponent(`${shareText} ${referralUrl}`)}`;
          break;
        default:
          if (navigator.share) {
            try {
              await navigator.share({
                title: "Join me on Undercover",
                text: shareText,
                url: referralUrl,
              });
              await trackReferralShare("native");
              return;
            } catch (err) {
              console.error("Error sharing:", err);
            }
          }
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank");
        await trackReferralShare(platform);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Unique Invite Code</CardTitle>
          <CardDescription>
            Share this code with friends to invite them to Undercover
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : isError ? (
            <div className="text-red-500">Failed to load your referral code.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralInfo?.referralCode || ""}
                  className="font-mono text-lg bg-muted"
                />
                <Button variant="outline" onClick={handleCopyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="pt-2">
                <p className="text-sm mb-2">Or share your invite link directly:</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${getBaseUrl()}/invite?code=${referralInfo?.referralCode || ""}`}
                    className="font-mono text-xs bg-muted"
                  />
                  <Button variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            When friends sign up using your code, you'll both receive tracking
            notifications.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Your Invite</CardTitle>
          <CardDescription>
            Choose how you want to share your invite code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="social" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="message">Direct Message</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col h-24 hover:bg-purple-900/20"
                  onClick={() => handleShare("instagram")}
                >
                  <Instagram className="h-8 w-8 mb-2 text-pink-500" />
                  <span>Instagram</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-24 hover:bg-purple-900/20"
                  onClick={() => handleShare("facebook")}
                >
                  <Facebook className="h-8 w-8 mb-2 text-blue-600" />
                  <span>Facebook</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-24 hover:bg-purple-900/20"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-8 w-8 mb-2 text-blue-400" />
                  <span>Twitter</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-24 hover:bg-purple-900/20"
                  onClick={() => handleShare("generic")}
                >
                  <Share2 className="h-8 w-8 mb-2 text-purple-500" />
                  <span>Other</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="message" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col h-24 hover:bg-purple-900/20"
                  onClick={() => handleShare("whatsapp")}
                >
                  <MessageCircle className="h-8 w-8 mb-2 text-green-500" />
                  <span>WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col h-24 hover:bg-purple-900/20"
                  onClick={() => handleShare("sms")}
                >
                  <Smartphone className="h-8 w-8 mb-2 text-blue-500" />
                  <span>SMS</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex gap-3">
              <div className="bg-purple-900/20 text-purple-400 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium mb-1">Share Your Code</h3>
                <p className="text-sm text-muted-foreground">
                  Send your unique invite code to friends through social media or direct messages.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-purple-900/20 text-purple-400 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium mb-1">Friend Joins</h3>
                <p className="text-sm text-muted-foreground">
                  When they sign up using your code and stay active for 7 days, your referral count increases.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="bg-purple-900/20 text-purple-400 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium mb-1">Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock badges, cash rewards, and premium features as you reach different milestones.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralShare;
