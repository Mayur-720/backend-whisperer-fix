
import React, { useState } from "react";
import { Trash2, Edit2, Reply, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AvatarGenerator from "../user/AvatarGenerator";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";

interface CommentItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comment: any;
  postId: string;
  onDelete: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onReply: (commentId: string, content: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onDelete,
  onEdit,
  onReply
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isOwnComment = user && comment.user === user._id;
  
  const handleEdit = async () => {
    if (!editContent.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await onEdit(comment._id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
    if (!confirmDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(comment._id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await onReply(comment._id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to reply to comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <AvatarGenerator
          emoji={comment.avatarEmoji || "🎭"}
          nickname={comment.anonymousAlias || "Anonymous"}
          size="sm"
          color="#9333EA"
        />
        <div className="bg-muted p-2 rounded-md text-sm flex-1">
          <div className="flex justify-between">
            <span className="font-medium text-xs">{comment.anonymousAlias || "Anonymous"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="resize-none min-h-[60px]"
              />
              <div className="flex space-x-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleEdit}
                  disabled={!editContent.trim() || isLoading}
                >
                  <Send size={14} className="mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex gap-2 mt-2 justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply size={14} className="mr-1" />
                Reply
              </Button>
              
              {isOwnComment && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 size={14} className="mr-1" />
                    Edit
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs text-red-500"
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isReplying && (
        <div className="ml-8 mt-2 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="resize-none min-h-[60px]"
          />
          <div className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsReplying(false)}
              disabled={isLoading}
            >
              <X size={14} className="mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleReply}
              disabled={!replyContent.trim() || isLoading}
            >
              <Send size={14} className="mr-1" />
              Reply
            </Button>
          </div>
        </div>
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply._id}
              comment={reply}
              postId={postId}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
