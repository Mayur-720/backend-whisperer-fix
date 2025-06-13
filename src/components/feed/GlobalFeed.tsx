import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader, Plus, TrendingUp } from "lucide-react";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import { getAllPosts } from "@/lib/api";
import { Post } from "@/types/index";

const GlobalFeed = () => {
	const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
	const queryClient = useQueryClient();

	const {
		data: posts = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["posts"],
		queryFn: getAllPosts,
		refetchInterval: 30000,
	});

	const handlePostCreated = () => {
		queryClient.invalidateQueries({ queryKey: ["posts"] });
		setIsCreatePostOpen(false);
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center space-y-4 text-muted-foreground">
					<Loader className="h-8 w-8 animate-spin text-purple-500" />
					<p className="animate-pulse">Loading the underground feed...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<div className="text-center space-y-4">
					<p className="text-destructive">Failed to load posts</p>
					<Button
						onClick={() => refetch()}
						variant="outline"
						className="hover-scale"
					>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background relative">
			{/* Header */}
			<div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
				<div className="flex items-center justify-between max-w-2xl mx-auto p-4">
					<div className="flex items-center space-x-2">
						<TrendingUp className="h-5 w-5 text-purple-500" />
						<h1 className="text-xl font-bold text-foreground">Feed</h1>
					</div>

					{/* Desktop Create Post Button */}
					<Button
						onClick={() => setIsCreatePostOpen(true)}
						className="sm:flex bg-purple-600 hover:bg-purple-700 text-white hover-scale glow-effect"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</div>
			<div className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6">
				{Array.isArray(posts) && posts.length === 0 ? (
					<div className="text-center py-16 space-y-4">
						<div className="text-6xl mb-4 animate-bounce">👻</div>
						<h2 className="text-2xl font-bold text-foreground">
							The underground is quiet...
						</h2>
						<p className="text-muted-foreground">
							Be the first to share something mysterious
						</p>
						<Button
							onClick={() => setIsCreatePostOpen(true)}
							className="bg-purple-600 hover:bg-purple-700 text-white hover-scale"
						>
							<Plus className="h-4 w-4 mr-2" />
							Create First Post
						</Button>
					</div>
				) : (
					<div className="space-y-6">
						{Array.isArray(posts) &&
							posts.map((post: any, index: number) => (
								<div
									key={post._id}
									className="animate-fade-in opacity-100"
									style={{ animationDelay: `${index * 0.1}s` }}
								>
									<PostCard post={post} />
								</div>
							))}
					</div>
				)}
			</div>

			<CreatePostModal
				open={isCreatePostOpen}
				onOpenChange={setIsCreatePostOpen}
				onSuccess={handlePostCreated}
			/>
		</div>
	);
};

export default GlobalFeed;
