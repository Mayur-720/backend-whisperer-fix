
import React from 'react';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

interface AvatarGeneratorProps {
  emoji: string;
  nickname: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xs";
}

const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ 
  emoji, 
  nickname, 
  color = "#9333EA", 
  size = "md" 
}) => {
  const navigate = useNavigate();
  const sizeClasses = {
    "xs": "h-6 w-6 text-xs",
    "sm": "h-8 w-8 text-sm",
    "md": "h-10 w-10 text-base",
    "lg": "h-12 w-12 text-lg"
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-bold",
        sizeClasses[size]
      )}
      style={{ backgroundColor: color }}
      title={nickname}
    >
      {emoji}
    </div>
  );
};

export default AvatarGenerator;
