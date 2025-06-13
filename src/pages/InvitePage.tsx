
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Ghost, ArrowRight } from 'lucide-react';
import { joinGhostCircle } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { processReferral } from '@/lib/api-referral';

const InvitePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleId, setCircleId] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [inviteType, setInviteType] = useState<'circle' | 'referral' | 'unknown'>('unknown');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('circleId');
    const name = params.get('name');
    const code = params.get('code');
    
    if (id) {
      setCircleId(id);
      setInviteType('circle');
    }
    
    if (name) {
      setCircleName(decodeURIComponent(name));
    }
    
    if (code) {
      setReferralCode(code);
      setInviteType('referral');
    }

    // If user is authenticated and there's a referral code, process it immediately
    if (isAuthenticated && code) {
      handleProcessReferral(code);
    }
  }, [location.search, isAuthenticated]);

  const handleJoinCircle = async () => {
    if (!circleId) {
      toast({
        title: "Error",
        description: "Invalid invitation link",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await joinGhostCircle(circleId);
      toast({
        title: "Success!",
        description: `You've joined the Ghost Circle: ${circleName}`
      });
      navigate('/ghost-circles');
    } catch (error) {
      console.error("Error joining circle:", error);
      toast({
        title: "Failed to join circle",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReferral = async (code: string) => {
    setLoading(true);
    try {
      // Process the referral
      const success = processReferral(code);
      
      if (success) {
        toast({
          title: "Success!",
          description: "You've joined using a referral code. Both you and your referrer will receive benefits!"
        });
      }
      
      // Redirect to home regardless of referral success
      navigate('/');
    } catch (error) {
      console.error("Error processing referral:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (inviteType === 'circle') {
      navigate(`/login?redirect=${encodeURIComponent(`/invite?circleId=${circleId}&name=${encodeURIComponent(circleName || '')}`)}`);
    } else if (inviteType === 'referral') {
      navigate(`/login?redirect=${encodeURIComponent(`/invite?code=${referralCode}`)}`);
    } else {
      navigate('/login');
    }
  };
  
  const handleRegister = () => {
    if (inviteType === 'referral') {
      navigate(`/register?code=${referralCode}`);
    } else {
      navigate('/register');
    }
  };

  // If no valid parameters are provided
  if (inviteType === 'unknown' || (inviteType === 'circle' && !circleId) || (inviteType === 'referral' && !referralCode)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md">
          <Ghost className="mx-auto h-16 w-16 text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-gray-300 mb-6">This invitation link appears to be invalid or expired.</p>
          <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Handle referral type invite
  if (inviteType === 'referral') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
          <Ghost className="mx-auto h-16 w-16 text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            You've been invited to Undercover!
          </h1>
          
          <p className="text-gray-300 mb-6">
            Join this anonymous community where you can share without revealing your identity.
          </p>

          {isAuthenticated ? (
            <Button 
              onClick={() => handleProcessReferral(referralCode)} 
              className="bg-purple-600 hover:bg-purple-700 w-full"
              disabled={loading}
            >
              {loading ? "Processing..." : "Join Undercover"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-yellow-300">You need to login or create an account to use this referral</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleLogin} className="bg-purple-600 hover:bg-purple-700 flex-1">
                  Login
                </Button>
                <Button onClick={handleRegister} className="bg-indigo-600 hover:bg-indigo-700 flex-1">
                  Register
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle ghost circle type invite
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <Ghost className="mx-auto h-16 w-16 text-purple-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          You're invited to join a Ghost Circle!
        </h1>
        
        {circleName && (
          <h2 className="text-xl text-purple-300 mb-4">"{circleName}"</h2>
        )}
        
        <p className="text-gray-300 mb-6">
          Join this anonymous community where you can share without revealing your identity.
        </p>

        {isAuthenticated ? (
          <Button 
            onClick={handleJoinCircle} 
            className="bg-purple-600 hover:bg-purple-700 w-full"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Ghost Circle"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-yellow-300">You need to log in to join this Ghost Circle</p>
            <Button onClick={handleLogin} className="bg-purple-600 hover:bg-purple-700 w-full">
              Login to Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
