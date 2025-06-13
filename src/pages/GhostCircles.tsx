
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ghost, Plus, Users, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMyGhostCircles } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import CreateGhostCircleModal from "@/components/ghost-circle/CreateGhostCircleModal";
import GhostCircleCard from "@/components/ghost-circle/GhostCircleCard";
import CircleFeedView from "@/components/ghost-circle/CircleFeedView";

const GhostCircles = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  const { data: ghostCircles = [], isLoading, refetch } = useQuery({
    queryKey: ["ghostCircles"],
    queryFn: getMyGhostCircles,
  });

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
  };

  const handleCircleSelect = (circleId: string) => {
    setSelectedCircleId(circleId);
  };

  const handleBackToCircles = () => {
    setSelectedCircleId(null);
  };

  // Custom ghost SVG for illustrations
  const GhostIllustration = () => (
    <svg
      className="h-12 w-12 text-purple-300 opacity-70"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 8C20 8 16 16 16 24V48C16 52 20 56 24 56C28 56 28 52 32 52C36 52 36 56 40 56C44 56 48 52 48 48V24C48 16 44 8 32 8Z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="4" fill="#1a1a1a" />
      <circle cx="40" cy="24" r="4" fill="#1a1a1a" />
      <path
        d="M24 40C24 44 28 48 32 48C36 48 40 44 40 40"
        stroke="#1a1a1a"
        strokeWidth="2"
      />
    </svg>
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.05, boxShadow: "0 8px 16px rgba(147, 51, 234, 0.3)" },
  };

  const buttonVariants = {
    hover: { scale: 1.1, boxShadow: "0 0 15px rgba(147, 51, 234, 0.5)" },
    tap: { scale: 0.95 },
  };

  if (isLoading) {
    return (
      <div className="relative container mx-auto px-4 py-6  bg-gradient-to-b from-gray-900 to-black min-h-screen">
        {/* Animated fog background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="fog animate-fog"></div>
          <div className="fog animate-fog-delayed"></div>
        </div>
        <div className="relative flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-40 bg-gray-700" />
          <Skeleton className="h-10 w-32 bg-gray-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4 bg-gray-700" />
                <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
                <Skeleton className="h-4 w-2/3 mb-4 bg-gray-700" />
                <div className="flex justify-between">
                  <Skeleton className="h-9 w-24 bg-gray-700" />
                  <Skeleton className="h-9 w-24 bg-gray-700" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (selectedCircleId) {
    // Find the selected circle to get its name
    const selectedCircle = ghostCircles.find(circle => circle._id === selectedCircleId);
    const circleName = selectedCircle?.name || "Ghost Circle";

    return (
      <motion.div
        className="relative container mx-auto px-4 py-6  bg-gradient-to-b from-gray-900 to-black min-h-screen"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated fog background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="fog animate-fog"></div>
          <div className="fog animate-fog-delayed"></div>
        </div>
        <div className="relative mb-4 flex items-center">
          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
            <Button
              variant="ghost"
              className="flex items-center text-purple-300 hover:text-purple-100 hover:bg-purple-900/50"
              onClick={handleBackToCircles}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Circles
            </Button>
          </motion.div>
        </div>
        <CircleFeedView 
          circleId={selectedCircleId} 
          circleName={circleName}
          onBack={handleBackToCircles} 
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative container mx-auto px-4 py-6  bg-gradient-to-b from-gray-900 to-black min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated fog background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="fog animate-fog"></div>
        <div className="fog animate-fog-delayed"></div>
      </div>
      <style>{`
        .fog {
          position: absolute;
          width: 200%;
          height: 100%;
          background: radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 100%);
          opacity: 0.2;
          filter: blur(50px);
        }
        .animate-fog {
          animation: drift 20s linear infinite;
        }
        .animate-fog-delayed {
          animation: drift 20s linear infinite;
          animation-delay: -10s;
        }
        @keyframes drift {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .glow-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(147, 51, 234, 0.5); }
          50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.8); }
        }
      `}</style>
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <GhostIllustration />
            </motion.div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Ghost Circles
            </h1>
          </div>
          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white glow-pulse"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Circle
            </Button>
          </motion.div>
        </div>

        {ghostCircles.length === 0 ? (
          <motion.div variants={cardVariants}>
            <Card className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <GhostIllustration />
                </motion.div>
                <h3 className="text-xl font-medium text-purple-300 mb-2">
                  No Ghost Circles Yet
                </h3>
                <p className="text-gray-400 mb-4 max-w-md">
                  Create your first anonymous circle to connect with friends in a private, secret space.
                </p>
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white glow-pulse"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Circle
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            <AnimatePresence>
              {ghostCircles.map((circle) => (
                <motion.div
                  key={circle._id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  exit="hidden"
                >
                  <GhostCircleCard
                    circle={circle}
                    onSelect={handleCircleSelect}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CreateGhostCircleModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </motion.div>
  );
};

export default GhostCircles;
