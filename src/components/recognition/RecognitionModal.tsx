/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getRecognitions, revokeRecognition } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { User, Recognition } from "@/types/user";
import AvatarGenerator from "@/components/user/AvatarGenerator";
import { Loader2, X } from "lucide-react";

interface RecognitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecognitionModal = ({ open, onOpenChange }: RecognitionModalProps) => {
  const [activeTab, setActiveTab] = useState("recognized");
  const [filter, setFilter] = useState("all");

  const {
    data: recognitionData,
    isLoading,
    refetch,
  } = useQuery<Recognition>({
    queryKey: ["recognitions", activeTab, filter],
    queryFn: () => getRecognitions(activeTab, filter),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleRevokeRecognition = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to revoke this recognition? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await revokeRecognition(userId);
      toast({
        title: "Recognition revoked",
        description: "The recognition has been successfully revoked.",
      });
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to revoke recognition",
      });
    }
  };

  const renderUserList = (users: User[] = []) => {
    if (users.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No users found</p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {users.map((user) => (
          <div
            key={user._id}
            className="flex items-center justify-between py-3"
          >
            <div className="flex items-center gap-3">
              <AvatarGenerator
                emoji={user.avatarEmoji}
                nickname={user.anonymousAlias}
                size="md"
              />
              <div>
                <p className="font-medium">{user.anonymousAlias}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            {activeTab === "recognized" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeRecognition(user._id)}
                className="text-destructive hover:text-destructive"
              >
                <X size={16} className="mr-1" />
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recognition Summary</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="border rounded-lg p-4">
                  <p className="text-lg font-semibold">
                    {recognitionData?.stats.totalRecognized || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Users you recognized
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-lg font-semibold">
                    {recognitionData?.stats.totalRecognizers || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Users who recognized you
                  </p>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Recognition Rate</p>
                  <p className="text-sm font-semibold">
                    {recognitionData?.stats.recognitionRate || 0}%
                  </p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <p>
                    {recognitionData?.stats.successfulRecognitions || 0}/
                    {recognitionData?.stats.recognitionAttempts || 0} guesses
                    correct
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="mutual">Mutual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs
              defaultValue="recognized"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="recognized">I've Recognized</TabsTrigger>
                <TabsTrigger value="recognizers">Recognized Me</TabsTrigger>
              </TabsList>
              <TabsContent value="recognized">
                {renderUserList(recognitionData?.recognized as User[])}
              </TabsContent>
              <TabsContent value="recognizers">
                {renderUserList(recognitionData?.recognizers as User[])}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecognitionModal;
