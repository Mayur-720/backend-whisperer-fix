import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPostById } from '@/lib/api'; // Assume this API exists
import PostCard from './PostCard';
import AppShell from '../layout/AppShell';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: () => getPostById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className='text-2xl flex flex-row min-h-screen justify-center items-center'>Loading...</div>;
  if (error) return <div className='text-red-500 flex flex-row min-h-screen justify-center items-center'>Error loading post</div>;
  if (!post) return <div className='text-red-500 flex flex-row min-h-screen justify-center items-center'>Post not found</div>;

  return(
<>
<AppShell>
<div className="max-w-4xl relative mx-auto mt-4 mb-8 p-4 rounded-lg">
<PostCard post={{ ...post, user: '', anonymousAlias: '', avatarEmoji: '', comments: [], likes: post.likes.map(userId => ({ user: userId })) }} currentUserId={''} onRefresh={() => {}} showOptions={false} />
</div>
</AppShell>
</>
)
    
};

export default PostDetail;