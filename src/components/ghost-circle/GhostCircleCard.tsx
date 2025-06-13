
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ghost, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import InviteToCircleModal from "./InviteToCircleModal";

interface GhostCircleCardProps {
  circle: {
    _id: string;
    name: string;
    description?: string;
    createdAt: string;
    members: { userId: string; joinedAt: string }[];
  };
  onSelect: (id: string) => void;
}

const GhostCircleCard: React.FC<GhostCircleCardProps> = ({ circle, onSelect }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  
  return (
<Card className="rounded-xl overflow-hidden glassmorphism text-card-foreground transition-all duration-300 hover:shadow-lg">
<CardHeader className="bg-muted/50 pb-2 border-b border-border">
      <div className="flex items-center gap-2">
        <Ghost className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{circle.name}</h3>
      </div>
    </CardHeader>
  
    <CardContent className="pt-4">
      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
        {circle.description || "No description provided."}
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users size={14} />
        <span>{circle.members.length} members</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Created {formatDistanceToNow(new Date(circle.createdAt))} ago
      </div>
    </CardContent>
  
    <CardFooter className="flex justify-between items-center bg-muted/40 pt-3 px-4 pb-4 border-t border-border">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsInviteModalOpen(true)}
        className="text-xs border-border text-muted-foreground hover:text-primary"
      >
        Invite Friend
      </Button>
  
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs flex items-center gap-1 transition-all duration-200 glow-effect"
        onClick={() => onSelect(circle._id)}
      >
        View Circle
        <ArrowRight size={14} />
      </Button>
    </CardFooter>
  
    <InviteToCircleModal
      open={isInviteModalOpen}
      onOpenChange={setIsInviteModalOpen}
      circleId={circle._id}
      circleName={circle.name}
    />
  </Card>
  

  );
};

export default GhostCircleCard;
