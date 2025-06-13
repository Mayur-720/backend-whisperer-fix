
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <Ghost className="mx-auto h-16 w-16 text-purple-500 mb-4" />
        <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-gray-300 mb-6">Oops! Page not found</p>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button 
          onClick={() => navigate("/")} 
          className="bg-purple-600 hover:bg-purple-700"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
