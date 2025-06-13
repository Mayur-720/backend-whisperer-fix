import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyWhispers } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader, MessageSquare, Search, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WhisperConversation from "@/components/whisper/WhisperConversation";
import WhisperModal from "@/components/whisper/WhisperModal";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import AvatarGenerator from "@/components/user/AvatarGenerator";

const WhispersPage = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isWhisperModalOpen, setIsWhisperModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['whispers'],
    queryFn: getMyWhispers,
    enabled: !!user,
    refetchInterval: 15000,
    meta: {
      onError: (error) => {
        console.error("Error fetching whispers:", error);
        toast({
          variant: "destructive",
          title: "Error loading whispers",
          description: "Could not load your whispers. Please try again later."
        });
      }
    }
  });

  const filteredConversations = React.useMemo(() => {
    if (!conversations) return [];
    if (!searchTerm.trim()) return conversations;
    
    return conversations.filter(convo => 
      convo.partner.anonymousAlias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (convo.partner.username && convo.partner.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [conversations, searchTerm]);

  const handleSelectConversation = (convo) => {
    setSelectedConversation(convo);
  };

  const getLastMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date > weekAgo) {
      return format(date, 'EEE');
    }
    
    return format(date, 'MMM d');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen">
      <div className="flex-1 flex flex-col md:flex-row">
        <div className={`md:w-1/3 max-w-md border-r border-border flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-undercover-light-purple">Whispers</h2>
            <p className="text-sm text-muted-foreground">Anonymous messages</p>
          </div>
          
          <div className="p-2 sticky top-0 bg-background z-10">
            <div className="relative">
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-card"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
          
          {filteredConversations && filteredConversations.length > 0 ? (
            <div className="divide-y divide-border overflow-auto flex-1">
              {filteredConversations.map((convo) => (
                <div 
                  key={convo._id}
                  className={`p-3 hover:bg-undercover-purple/5 cursor-pointer ${
                    selectedConversation && selectedConversation._id === convo._id 
                      ? 'bg-undercover-purple/10' 
                      : ''
                  }`}
                  onClick={() => handleSelectConversation(convo)}
                >
                  <div className="flex items-center space-x-3">
                    <AvatarGenerator
                      emoji={convo.partner.avatarEmoji || "🎭"} 
                      nickname={convo.partner.anonymousAlias}
                      color="#6E59A5"
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate">
                          {convo.partner.anonymousAlias || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {getLastMessageTime(convo.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate pr-2">
                          {convo.lastMessage.content}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-undercover-purple text-white text-xs">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center flex-1">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-center text-muted-foreground">
                {searchTerm ? "No matching conversations" : "No whispers yet."}
              </p>
              <Button className="mt-4 bg-undercover-purple" onClick={() => setIsWhisperModalOpen(true)}>
                Start a whisper
              </Button>
            </div>
          )}
          
          <div className="p-4 border-t border-border">
            <Button 
              className="w-full bg-undercover-purple hover:bg-undercover-deep-purple"
              onClick={() => setIsWhisperModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Whisper
            </Button>
          </div>
        </div>
        
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <WhisperConversation 
              partnerId={selectedConversation._id} 
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-undercover-light-purple mb-2">
                Your Whispers
              </h3>
              <p className="text-center text-muted-foreground max-w-md">
                Select a conversation to view your whispers. 
                All messages are anonymous until someone correctly guesses your identity.
              </p>
            </div>
          )}
        </div>
      </div>

      <WhisperModal
        open={isWhisperModalOpen}
        onOpenChange={setIsWhisperModalOpen}
      />
    </div>
  );
};

export default WhispersPage;
