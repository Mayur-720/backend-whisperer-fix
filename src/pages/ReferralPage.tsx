
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReferralDashboard from "@/components/referral/ReferralDashboard";
import ReferralLeaderboard from "@/components/referral/ReferralLeaderboard";
import ReferralShare from "@/components/referral/ReferralShare";

const ReferralPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-500 mb-2">Referral Program</h1>
        <p className="text-muted-foreground">
          Invite friends to join Undercover and earn exclusive rewards!
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">My Progress</TabsTrigger>
          <TabsTrigger value="share">Invite Friends</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ReferralDashboard />
        </TabsContent>

        <TabsContent value="share">
          <ReferralShare />
        </TabsContent>

        <TabsContent value="leaderboard">
          <ReferralLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralPage;
