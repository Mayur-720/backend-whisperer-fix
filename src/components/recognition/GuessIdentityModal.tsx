/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recognizeUser } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types/user";
import AvatarGenerator from "@/components/user/AvatarGenerator";

interface GuessIdentityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: User | null;
  onSuccess: () => void;
}

const GuessIdentityModal = ({
  open,
  onOpenChange,
  targetUser,
  onSuccess,
}: GuessIdentityModalProps) => {
  const [guessedIdentity, setGuessedIdentity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    setIsSubmitting(true);
    try {
      const result = await recognizeUser(targetUser._id, guessedIdentity);
      
      if (result.success) {
        toast({
          title: "Recognition successful! 🎉",
          description: `You correctly identified ${targetUser.anonymousAlias}!`,
        });
        setGuessedIdentity("");
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Recognition failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit recognition",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!targetUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Guess Identity</DialogTitle>
          <DialogDescription>
            Do you know who <span className="font-bold">{targetUser.anonymousAlias}</span> is? Enter their username to reveal their identity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <AvatarGenerator
            emoji={targetUser.avatarEmoji}
            nickname={targetUser.anonymousAlias}
            size="lg"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Input
                placeholder="Enter username..."
                value={guessedIdentity}
                onChange={(e) => setGuessedIdentity(e.target.value)}
                className="w-full"
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the real username (not the anonymous alias)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !guessedIdentity.trim()}>
              {isSubmitting ? "Submitting..." : "Guess Identity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuessIdentityModal;
