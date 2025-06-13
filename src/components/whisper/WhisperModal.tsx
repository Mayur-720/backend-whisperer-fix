import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchUsers, sendWhisper } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import debounce from "lodash/debounce";
import { useNavigate } from "react-router-dom";

interface WhisperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WhisperModal: React.FC<WhisperModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [username, setUsername] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const maxWords = 20;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessage(text);
    setWordCount(text.trim() === "" ? 0 : text.trim().split(/\s+/).length);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setSelectedUser(null); // Clear selected user when typing a new username
    
    if (value.trim()) {
      setIsSearching(true);
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Failed to search for users. Please try again."
      });
    } finally {
      setIsSearching(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = React.useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 300),
    []
  );

  const sendWhisperMutation = useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string, content: string }) => 
      sendWhisper(receiverId, content),
    onSuccess: (data) => {
      toast({
        title: "Whisper sent",
        description: "Your anonymous whisper has been delivered."
      });
      setMessage("");
      setWordCount(0);
      setUsername("");
      setSelectedUser(null);
      setSearchResults([]); // Clear search results on success
      onOpenChange(false);
      
      if (data && data.receiver) {
        navigate("/whispers");
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send whisper",
        description: error.message || "Please try again later."
      });
    }
  });

  const handleSendWhisper = () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "No recipient selected",
        description: "Please select a user to whisper to."
      });
      return;
    }

    sendWhisperMutation.mutate({
      receiverId: selectedUser._id,
      content: message
    });
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setUsername(user.anonymousAlias);
    setSearchResults([]); // Clear search results immediately after selection
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-undercover-purple/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-undercover-light-purple flex items-center justify-center">
            <MessageSquare className="inline-block mr-2" size={18} />
            Whisper Mode
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Send an anonymous message to someone.
            <br />
            <span className="text-undercover-light-purple">
              They won't know who you are unless they guess correctly.
            </span>
          </p>
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center">
                <Input
                  placeholder="To: @username or anonymous alias"
                  value={username}
                  onChange={handleUsernameChange}
                  className="bg-background border-undercover-purple/30 pr-10"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0" 
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                </Button>
              </div>
              
              {searchResults.length > 0 && !selectedUser && (
                <div className="absolute z-20 mt-1 w-full bg-background border border-undercover-purple/30 rounded-md shadow-md max-h-60 overflow-auto">
                  {searchResults.map(user => (
                    <div 
                      key={user._id} 
                      className="p-2 hover:bg-undercover-purple/10 cursor-pointer flex items-center"
                      onClick={() => selectUser(user)}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-undercover-dark mr-2">
                        {user.avatarEmoji || "🎭"}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="mr-2">{user.anonymousAlias}</span>
                          {user.username && (
                            <span className="text-xs text-muted-foreground">@{user.username}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isSearching && (
                <div className="absolute z-20 mt-1 w-full text-center py-2 bg-background border border-undercover-purple/30 rounded-md shadow-md">
                  <Loader size={16} className="animate-spin inline mr-2" />
                  Searching...
                </div>
              )}
              
              {!isSearching && username && searchResults.length === 0 && !selectedUser && (
                <div className="absolute z-20 mt-1 w-full text-center py-2 bg-background border border-undercover-purple/30 rounded-md shadow-md">
                  No users found
                </div>
              )}
            </div>
            
            <div>
              <Input
                placeholder="Your anonymous whisper..."
                value={message}
                onChange={handleInputChange}
                className="bg-background border-undercover-purple/30"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${wordCount > maxWords ? "text-destructive" : "text-muted-foreground"}`}>
                  {wordCount}/{maxWords} words
                </span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendWhisper}
            className="bg-undercover-purple hover:bg-undercover-deep-purple"
            disabled={wordCount === 0 || wordCount > maxWords || !selectedUser || sendWhisperMutation.isPending}
          >
            {sendWhisperMutation.isPending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Whisper"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhisperModal;