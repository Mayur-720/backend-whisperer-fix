
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { createPost } from "@/lib/api";
import { Ghost, Loader2, X, Upload } from "lucide-react";
import ImageSlider from "@/components/ui/image-slider";
import MediaUpload from "@/components/ui/media-upload";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  ghostCircleId?: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  ghostCircleId,
}) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<Array<{url: string, thumbnail?: string, duration?: number}>>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const validateImageFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        continue;
      }
      
      const maxSize = isMobile ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is ${isMobile ? '10MB' : '5MB'}.`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const validateVideoFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a video file.`,
          variant: "destructive",
        });
        continue;
      }
      
      const maxSize = isMobile ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Video too large",
          description: `${file.name} is too large. Maximum size is ${isMobile ? '100MB' : '50MB'}.`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const handleImageSelect = (files: File[]) => {
    console.log('Image files selected:', files);
    const validFiles = validateImageFiles(files);
    
    if (validFiles.length === 0) return;

    // Add to state
    setImageFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      console.log('Updated image files:', newFiles);
      return newFiles;
    });
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => {
          const newImages = [...prev, reader.result as string];
          console.log('Updated image previews:', newImages);
          return newImages;
        });
      };
      reader.onerror = () => {
        toast({
          title: "File read error",
          description: `Could not read ${file.name}. Please try again.`,
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoSelect = (files: File[]) => {
    console.log('Video files selected:', files);
    const validFiles = validateVideoFiles(files);
    
    if (validFiles.length === 0) return;

    // Add to state
    setVideoFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      console.log('Updated video files:', newFiles);
      return newFiles;
    });
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setVideos(prev => {
          const newVideos = [...prev, { url: reader.result as string }];
          console.log('Updated video previews:', newVideos);
          return newVideos;
        });
      };
      reader.onerror = () => {
        toast({
          title: "File read error",
          description: `Could not read ${file.name}. Please try again.`,
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllMedia = () => {
    setImageFiles([]);
    setImages([]);
    setVideoFiles([]);
    setVideos([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0 && videoFiles.length === 0) {
      return toast({
        title: "Content required",
        description: "Please add some text, images, or videos to your post.",
        variant: "destructive",
      });
    }

    setIsSubmitting(true);
    let uploadedImageUrls: string[] = [];
    let uploadedVideoUrls: Array<{url: string, thumbnail?: string, duration?: number}> = [];

    try {
      if (imageFiles.length > 0) {
        setIsUploading(true);
        
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "undercover");

          const res = await fetch("https://api.cloudinary.com/v1_1/ddtqri4py/image/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const data = await res.json();
          uploadedImageUrls.push(data.secure_url);
        }
      }

      if (videoFiles.length > 0) {
        for (const file of videoFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "undercover");
          formData.append("resource_type", "video");

          const res = await fetch("https://api.cloudinary.com/v1_1/ddtqri4py/video/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const data = await res.json();
          uploadedVideoUrls.push({
            url: data.secure_url,
            thumbnail: data.eager?.[0]?.secure_url || data.secure_url.replace(/\.[^/.]+$/, ".jpg"),
            duration: data.duration
          });
        }
      }

      console.log("Media uploaded:", { images: uploadedImageUrls, videos: uploadedVideoUrls });
      setIsUploading(false);

      await createPost(content, ghostCircleId, uploadedImageUrls[0], uploadedImageUrls, uploadedVideoUrls);
      
      // Reset form
      setContent("");
      setImages([]);
      setVideos([]);
      setImageFiles([]);
      setVideoFiles([]);

      toast({
        title: "Post created",
        description: ghostCircleId
          ? "Your anonymous post has been shared in the Ghost Circle."
          : "Your anonymous post has been shared.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Failed to create post",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const totalFiles = imageFiles.length + videoFiles.length;
  const totalSize = [...imageFiles, ...videoFiles].reduce((total, file) => total + file.size, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gray-800 text-white border-purple-600">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-300">
            {ghostCircleId ? (
              <>
                <Ghost className="w-5 h-5 text-purple-500" />
                Create Ghost Circle Post
              </>
            ) : (
              "Create Anonymous Post"
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {ghostCircleId
              ? "This post will be visible only within this Ghost Circle."
              : "Your identity will remain hidden."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            className="min-h-[120px] bg-gray-700 border-gray-600 focus:border-purple-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {(images.length > 0 || videos.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-purple-300">
                  Selected Media ({totalFiles}/10)
                </h4>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={removeAllMedia}
                  className="text-xs"
                >
                  <X size={12} className="mr-1" />
                  Remove All
                </Button>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-3">
                <ImageSlider 
                  images={images} 
                  videos={videos}
                  className="max-h-[300px] mb-3" 
                />
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[150px] overflow-y-auto">
                  {images.map((image, index) => (
                    <div key={`image-${index}`} className="relative group">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-16 object-cover rounded border-2 border-gray-600"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-80 hover:opacity-100"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                  {videos.map((video, index) => (
                    <div key={`video-${index}`} className="relative group">
                      <video
                        src={video.url}
                        className="w-full h-16 object-cover rounded border-2 border-gray-600"
                        muted
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeVideo(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-80 hover:opacity-100"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <MediaUpload
            onImageSelect={handleImageSelect}
            onVideoSelect={handleVideoSelect}
            disabled={isUploading || isSubmitting}
            maxFiles={10}
            currentFileCount={totalFiles}
          />

          {totalFiles > 0 && (
            <div className="text-xs text-gray-400">
              Total size: {totalSize > 1024 * 1024 
                ? `${(totalSize / (1024 * 1024)).toFixed(1)}MB` 
                : `${Math.round(totalSize / 1024)}KB`}
            </div>
          )}

          {isUploading && (
            <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-300">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Uploading files... Please wait</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-600 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
              disabled={(!content.trim() && totalFiles === 0) || isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Posting...
                </>
              ) : isUploading ? (
                <>
                  <Upload size={16} className="animate-pulse mr-2" />
                  Uploading...
                </>
              ) : (
                "Post Anonymously"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
