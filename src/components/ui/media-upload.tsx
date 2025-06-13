
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, FolderOpen, Video } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onImageSelect: (files: File[]) => void;
  onVideoSelect: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  currentFileCount?: number;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onImageSelect,
  onVideoSelect,
  disabled = false,
  maxFiles = 10,
  currentFileCount = 0,
}) => {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const imageCameraRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const videoCameraRef = useRef<HTMLInputElement>(null);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      console.log('Selected image files:', files);
      onImageSelect(files);
    }
    // Clear input
    e.target.value = '';
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      console.log('Selected video files:', files);
      onVideoSelect(files);
    }
    // Clear input
    e.target.value = '';
  };

  const triggerImageGallery = () => {
    if (currentFileCount >= maxFiles) {
      toast({
        title: "Maximum files reached",
        description: `You can only upload ${maxFiles} files per post.`,
        variant: "destructive",
      });
      return;
    }
    imageFileRef.current?.click();
  };

  const triggerImageCamera = () => {
    if (currentFileCount >= maxFiles) {
      toast({
        title: "Maximum files reached",
        description: `You can only upload ${maxFiles} files per post.`,
        variant: "destructive",
      });
      return;
    }
    imageCameraRef.current?.click();
  };

  const triggerVideoGallery = () => {
    if (currentFileCount >= maxFiles) {
      toast({
        title: "Maximum files reached",
        description: `You can only upload ${maxFiles} files per post.`,
        variant: "destructive",
      });
      return;
    }
    videoFileRef.current?.click();
  };

  const triggerVideoCamera = () => {
    if (currentFileCount >= maxFiles) {
      toast({
        title: "Maximum files reached",
        description: `You can only upload ${maxFiles} files per post.`,
        variant: "destructive",
      });
      return;
    }
    videoCameraRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Photo Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-purple-300">Photo</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerImageCamera}
            disabled={disabled || currentFileCount >= maxFiles}
            className="text-purple-300 border-purple-700 hover:bg-purple-900/20"
          >
            <Camera size={16} className="mr-2" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerImageGallery}
            disabled={disabled || currentFileCount >= maxFiles}
            className="text-purple-300 border-purple-700 hover:bg-purple-900/20"
          >
            <FolderOpen size={16} className="mr-2" />
            Choose Photos
          </Button>
        </div>
      </div>

      {/* Video Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-purple-300">Video</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerVideoCamera}
            disabled={disabled || currentFileCount >= maxFiles}
            className="text-purple-300 border-purple-700 hover:bg-purple-900/20"
          >
            <Video size={16} className="mr-2" />
            Record Video
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerVideoGallery}
            disabled={disabled || currentFileCount >= maxFiles}
            className="text-purple-300 border-purple-700 hover:bg-purple-900/20"
          >
            <FolderOpen size={16} className="mr-2" />
            Choose Videos
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageFileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        ref={imageCameraRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
        capture="environment"
      />
      <input
        ref={videoFileRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleVideoFileChange}
        className="hidden"
      />
      <input
        ref={videoCameraRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFileChange}
        className="hidden"
        capture="environment"
      />

      {/* File count indicator */}
      <div className="text-xs text-gray-400">
        {currentFileCount}/{maxFiles} files selected
      </div>
    </div>
  );
};

export default MediaUpload;
