
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from '@/types/user';
import AvatarGenerator from './AvatarGenerator';
import { Eye, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GuessIdentityModal from '@/components/recognition/GuessIdentityModal';

interface UserCardProps {
  user: User;
  isCurrentUser?: boolean;
  onRecognitionSuccess?: () => void;
}

const UserCard = ({ user, isCurrentUser = false, onRecognitionSuccess }: UserCardProps) => {
  const navigate = useNavigate();
  const [guessModalOpen, setGuessModalOpen] = useState(false);

  const handleWhisperClick = () => {
    navigate(`/whispers?userId=${user._id}`);
  };

  const handleRecognitionSuccess = () => {
    if (onRecognitionSuccess) {
      onRecognitionSuccess();
    }
  };

  return (
    <Card className="hover:border-undercover-purple/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AvatarGenerator emoji={user.avatarEmoji} nickname={user.anonymousAlias} size="md" />
          <div className="flex-1">
            <h3 className="font-medium">{user.anonymousAlias}</h3>
            {/* Only show username if this is the current user */}
            {isCurrentUser && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
          </div>
          
          {!isCurrentUser && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setGuessModalOpen(true)}
                title="Guess identity"
                className="border-undercover-purple/20 hover:bg-undercover-purple/10"
              >
                <Eye size={16} />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleWhisperClick}
                title="Send whisper"
                className="border-undercover-purple/20 hover:bg-undercover-purple/10"
              >
                <Send size={16} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {!isCurrentUser && (
        <GuessIdentityModal
          open={guessModalOpen}
          onOpenChange={setGuessModalOpen}
          targetUser={user}
          onSuccess={handleRecognitionSuccess}
        />
      )}
    </Card>
  );
};

export default UserCard;
