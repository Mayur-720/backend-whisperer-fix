import React, { useContext, useEffect } from "react";
import ProfileComponent from "@/components/user/ProfileComponent";
import { Button } from "@/components/ui/button";
import { Gift, MessageSquare, Send } from "lucide-react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const ProfilePage = () => {
  const { userId } = useParams(); // Get userId from URL
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get authenticated user from context

  // Determine anonymousAlias based on userId and state
  const anonymousAlias = userId
    ? state?.anonymousAlias || "Unknown User" // Use state for target user
    : user?.anonymousAlias || "Unknown User"; // Use auth user for own profile

  const handleWhisperClick = () => {
    if (userId) {
      navigate(`/chat/${userId}`);
    }
  };

  return (
    <div>
      <div className="flex justify-end px-4 py-2 gap-2">
       
        <Button
          variant="outline"
          className="flex items-center gap-2 border-purple-500/30 hover:bg-purple-500/10"
          onClick={() => navigate("/referrals")}
        >
          <Gift className="h-4 w-4 text-purple-400" />
          Refer & Earn ₹100
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-purple-500/30 hover:bg-purple-500/10"
          onClick={handleWhisperClick}
        >
          <Send className="h-4 w-4 text-purple-400" />
          Whisper
        </Button>
      </div>
      <ProfileComponent userId={userId} anonymousAlias={anonymousAlias} /> {/* Pass props */}
    </div>
  );
};

export default ProfilePage;