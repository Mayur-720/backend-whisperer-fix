
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ghost, UserPlus, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { inviteToGhostCircle } from "@/lib/api";
import UserSearchInput from "./UserSearchInput";

const inviteSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

interface InviteToCircleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  circleName: string;
}

const InviteToCircleModal: React.FC<InviteToCircleModalProps> = ({
  open,
  onOpenChange,
  circleId,
  circleName,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      username: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof inviteSchema>) => {
    setIsSubmitting(true);
    try {
      await inviteToGhostCircle(circleId, values.username);
      
      toast({
        title: "Invitation sent",
        description: `${values.username} has been invited to ${circleName}`,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to invite user:", error);
      toast({
        variant: "destructive",
        title: "Failed to invite user",
        description: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUser = (username: string) => {
    form.setValue("username", username);
  };

  const inviteLink = `${window.location.origin}/invite?circleId=${circleId}&name=${encodeURIComponent(circleName)}`;

  const shareViaWhatsApp = () => {
    const message = `Join my Ghost Circle "${circleName}" on UnderCover: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareViaTelegram = () => {
    const message = `Join my Ghost Circle "${circleName}" on UnderCover: ${inviteLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(`Join my Ghost Circle "${circleName}" on UnderCover`)}`, "_blank");
  };

  const shareViaInstagram = () => {
    // Instagram doesn't support direct sharing via URL, so we'll copy to clipboard
    navigator.clipboard.writeText(`Join my Ghost Circle "${circleName}" on UnderCover: ${inviteLink}`);
    toast({
      title: "Link copied",
      description: "Share this link on Instagram to invite friends",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ghost className="h-5 w-5 text-purple-500" />
            Invite to Ghost Circle
          </DialogTitle>
          <DialogDescription>
            Invite a friend to join "{circleName}". They'll remain anonymous until they choose to reveal their identity.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Users</TabsTrigger>
            <TabsTrigger value="share">Share Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Find a Friend</FormLabel>
                      <FormControl>
                        <UserSearchInput onSelectUser={handleSelectUser} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Inviting..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="share" className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-md text-sm break-all">
                {inviteLink}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={shareViaWhatsApp}
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <i className="text-lg">📱</i>
                  </div>
                  <span className="text-xs">WhatsApp</span>
                </Button>
                
                <Button 
                  onClick={shareViaTelegram}
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <i className="text-lg">📨</i>
                  </div>
                  <span className="text-xs">Telegram</span>
                </Button>
                
                <Button 
                  onClick={shareViaInstagram}
                  variant="outline" 
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center">
                    <i className="text-lg">📷</i>
                  </div>
                  <span className="text-xs">Instagram</span>
                </Button>
              </div>
              
              <Button 
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Copy Invite Link
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteToCircleModal;
