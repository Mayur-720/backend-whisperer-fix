
import React from "react";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { Eye, EyeOff, BarChart3 } from "lucide-react";

interface RecognitionStatsProps {
  profile: User;
  onOpenRecognitionModal: () => void;
}

const RecognitionStats = ({ profile, onOpenRecognitionModal }: RecognitionStatsProps) => {
  const recognizersCount = profile.identityRecognizers?.length || 0;
  const recognizedCount = profile.recognizedUsers?.length || 0;
  const recognitionRate = profile.recognitionAttempts && profile.recognitionAttempts > 0
    ? Math.round((profile.successfulRecognitions || 0) / profile.recognitionAttempts * 100)
    : 0;

  return (
    <div className="mt-4 space-y-4">
      <h3 className="font-medium text-sm flex items-center gap-2">
        <BarChart3 size={16} className="text-muted-foreground" />
        Recognition Stats
      </h3>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 border border-undercover-purple/20 rounded-md bg-undercover-dark/10">
          <div className="flex justify-center mb-1">
            <Eye size={16} className="text-undercover-purple" />
          </div>
          <p className="font-bold">{recognizersCount}</p>
          <p className="text-xs text-muted-foreground">Recognized you</p>
        </div>
        
        <div className="text-center p-2 border border-undercover-purple/20 rounded-md bg-undercover-dark/10">
          <div className="flex justify-center mb-1">
            <EyeOff size={16} className="text-undercover-purple" />
          </div>
          <p className="font-bold">{recognizedCount}</p>
          <p className="text-xs text-muted-foreground">You recognized</p>
        </div>
        
        <div className="text-center p-2 border border-undercover-purple/20 rounded-md bg-undercover-dark/10">
          <div className="flex justify-center mb-1">
            <BarChart3 size={16} className="text-undercover-purple" />
          </div>
          <p className="font-bold">{recognitionRate}%</p>
          <p className="text-xs text-muted-foreground">Recognition rate</p>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        onClick={onOpenRecognitionModal}
        className="w-full border-undercover-purple/30 text-undercover-light-purple hover:bg-undercover-purple/10"
      >
        View Recognition Details
      </Button>
    </div>
  );
};

export default RecognitionStats;
