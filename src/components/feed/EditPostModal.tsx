
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updatePost } from "@/lib/api";
import MediaUpload from "@/components/ui/media-upload";

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: any;
  onSuccess: () => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ 
  open, 
  onOpenChange, 
  post,
  onSuccess
}) => {
  const [content, setContent] = useState(post?.content || "");
  const [images, setImages] = useState<string[]>(post?.images || []);
  const [videos, setVideos] = useState<any[]>(post?.videos || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    console.log('Image files selected for edit:', files);
    const validFiles = validateImageFiles(files);
    
    if (validFiles.length === 0) return;

    setImageFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      console.log('Updated image files:', newFiles);
      return newFiles;
    });
    
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
    console.log('Video files selected for edit:', files);
    const validFiles = validateVideoFiles(files);
    
    if (validFiles.length === 0) return;

    setVideoFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      console.log('Updated video files:', newFiles);
      return newFiles;
    });
    
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
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0 && videos.length === 0) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please add some content, image, or video to your post.",
      });
      return;
    }
    
    setIsSubmitting(true);
    let uploadedImageUrls = [...images.filter(img => img.startsWith('http'))];
    let uploadedVideoUrls = [...videos.filter(vid => vid.url?.startsWith('http'))];

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

      setIsUploading(false);
      
      await updatePost(post._id, content, uploadedImageUrls, uploadedVideoUrls);
      
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        variant: "destructive",
        title: "Error updating post",
        description: "Could not update your post. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const totalFiles = images.length + videos.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-purple-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-300">
            <Edit3 size={20} />
            Edit Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            placeholder="What's on your mind? Your identity will remain anonymous..."
            className="min-h-[120px] bg-gray-800 border-gray-600 focus:border-purple-500 text-white resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="mt-2 text-xs text-gray-400">
            {content.length}/500 characters
          </div>

          <div className="mt-4">
            <MediaUpload
              onImageSelect={handleImageSelect}
              onVideoSelect={handleVideoSelect}
              disabled={isSubmitting || isUploading}
              maxFiles={10}
              currentFileCount={totalFiles}
            />
          </div>

          {/* Preview Images */}
          {images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Images:</h4>
              <div className="grid grid-cols-2 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img src={image} alt={`Preview ${index}`} className="w-full h-20 object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Videos */}
          {videos.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Videos:</h4>
              <div className="grid grid-cols-2 gap-2">
                {videos.map((video, index) => (
                  <div key={index} className="relative">
                    <video src={video.url} className="w-full h-20 object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeVideo(index)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-4 bg-purple-900/20 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-300">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Uploading files... Please wait</span>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={(!content.trim() && images.length === 0 && videos.length === 0) || isSubmitting || isUploading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {isUploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
