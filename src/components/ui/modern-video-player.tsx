
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FullscreenVideoModal from './fullscreen-video-modal';

interface ModernVideoPlayerProps {
  src: string;
  thumbnail?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  onFullscreen?: () => void;
}

const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
  src,
  thumbnail,
  className,
  autoplay = false,
  muted = true,
  onFullscreen
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress || 0);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    setFullscreenOpen(true);
    if (onFullscreen) {
      onFullscreen();
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleFullscreen();
    } else {
      togglePlay();
    }
    setLastTap(now);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  return (
    <>
      <div
        className={cn("relative group cursor-pointer overflow-hidden rounded-xl bg-gray-900", className)}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onTouchStart={showControlsTemporarily}
      >
        <video
          ref={videoRef}
          src={src}
          poster={thumbnail}
          autoPlay={autoplay}
          muted={isMuted}
          loop
          playsInline
          className="w-full h-full object-cover aspect-video bg-gray-900"
          onClick={handleDoubleTap}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Loader2 size={32} className="text-white animate-spin" />
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200",
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Center Play Button */}
          {!isPlaying && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-16 w-16 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
              >
                <Play size={32} className="ml-1" />
              </Button>
            </div>
          )}

          {/* Top Right Controls */}
          <div className="absolute top-3 right-3 flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8 text-white hover:bg-black/50 bg-black/30 rounded-full backdrop-blur-sm"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="h-8 w-8 text-white hover:bg-black/50 bg-black/30 rounded-full backdrop-blur-sm"
            >
              <Maximize2 size={16} />
            </Button>
          </div>

          {/* Bottom Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <FullscreenVideoModal
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        src={src}
        thumbnail={thumbnail}
      />
    </>
  );
};

export default ModernVideoPlayer;
