/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Shield,
	Users,
	FileText,
	Trash2,
	Edit,
	Eye,
	LogOut,
	Search,
	Ban,
	UserCheck,
	AlertTriangle,
	BarChart3,
	Bell,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AdminPost {
	_id: string;
	content: string;
	anonymousAlias: string;
	avatarEmoji: string;
	likes: any[];
	comments: any[];
	createdAt: string;
	expiresAt: string;
	shareCount: number;
	user: {
		_id: string;
		username: string;
		email: string;
		fullName: string;
		anonymousAlias: string;
	} | null;
}

interface AdminUser {
	_id: string;
	username: string;
	email: string;
	fullName: string;
	anonymousAlias: string;
	avatarEmoji: string;
	posts: string[];
	createdAt: string;
	banned?: boolean;
	isActive?: boolean;
}

const AdminPanel = () => {
	const { logout } = useAdmin();
	const navigate = useNavigate();
	const [posts, setPosts] = useState<AdminPost[]>([]);
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
	const [editContent, setEditContent] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [stats, setStats] = useState({
		totalUsers: 0,
		totalPosts: 0,
		activeUsers: 0,
		bannedUsers: 0,
		postsToday: 0,
	});

	useEffect(() => {
		fetchData();
	}, []);

	const calculateStats = (
		fetchedPosts: AdminPost[],
		fetchedUsers: AdminUser[]
	) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const postsToday = fetchedPosts.filter(
			(post) => new Date(post.createdAt) >= today
		).length;

		const activeUsers = fetchedUsers.filter((user) => !user.banned).length;
		const bannedUsers = fetchedUsers.filter((user) => user.banned).length;

		return {
			totalUsers: fetchedUsers.length,
			totalPosts: fetchedPosts.length,
			activeUsers,
			bannedUsers,
			postsToday,
		};
	};

	const fetchData = async () => {
		try {
			setLoading(true);

			const token = localStorage.getItem("adminAuth");
			if (token) {
				api.defaults.headers["Authorization"] = `Bearer admin-${token}`;
			}

			console.log("Fetching admin data...");

			const [postsResponse, usersResponse] = await Promise.all([
				api.get("/api/admin/posts"),
				api.get("/api/admin/users"),
			]);

			const fetchedPosts = postsResponse.data || [];
			const fetchedUsers = usersResponse.data || [];

			setPosts(fetchedPosts);
			setUsers(fetchedUsers);

			// Calculate and set stats
			const calculatedStats = calculateStats(fetchedPosts, fetchedUsers);
			setStats(calculatedStats);

			console.log(
				`Loaded ${fetchedPosts.length} posts and ${fetchedUsers.length} users`
			);
		} catch (error) {
			console.error("Error fetching admin data:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description:
					"Failed to fetch data. Please check your admin credentials.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDeletePost = async (postId: string) => {
		if (!confirm("Are you sure you want to delete this post?")) return;

		try {
			await api.delete(`/api/admin/posts/${postId}`);
			const updatedPosts = posts.filter((post) => post._id !== postId);
			setPosts(updatedPosts);

			// Recalculate stats
			const updatedStats = calculateStats(updatedPosts, users);
			setStats(updatedStats);

			toast({
				title: "Post deleted",
				description: "Post has been successfully deleted.",
			});
		} catch (error) {
			console.error("Error deleting post:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to delete post. Please try again.",
			});
		}
	};

	const handleBanUser = async (userId: string, banned: boolean) => {
		const action = banned ? "ban" : "unban";
		if (!confirm(`Are you sure you want to ${action} this user?`)) return;

		try {
			await api.put(`/api/admin/users/${userId}/ban`, { banned });

			const updatedUsers = users.map((user) =>
				user._id === userId ? { ...user, banned } : user
			);
			setUsers(updatedUsers);

			// Recalculate stats after user ban/unban
			const updatedStats = calculateStats(posts, updatedUsers);
			setStats(updatedStats);

			toast({
				title: `User ${action}ned`,
				description: `User has been successfully ${action}ned.`,
			});
		} catch (error) {
			console.error(`Error ${action}ning user:`, error);
			toast({
				variant: "destructive",
				title: "Error",
				description: `Failed to ${action} user. Please try again.`,
			});
		}
	};

	const handleEditPost = (post: AdminPost) => {
		setEditingPost(post);
		setEditContent(post.content);
	};

	const handleSaveEdit = async () => {
		if (!editingPost) return;

		try {
			const response = await api.put(`/api/admin/posts/${editingPost._id}`, {
				content: editContent,
			});

			setPosts(
				posts.map((post) =>
					post._id === editingPost._id
						? { ...post, content: editContent }
						: post
				)
			);

			setEditingPost(null);
			setEditContent("");

			toast({
				title: "Post updated",
				description: "Post has been successfully updated.",
			});
		} catch (error) {
			console.error("Error updating post:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to update post. Please try again.",
			});
		}
	};

	const handleLogout = () => {
		logout();
		navigate("/admin/login");
	};

	const filteredPosts = posts.filter(
		(post) =>
			post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(post.user?.username || "")
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(post.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
	);

	const filteredUsers = users.filter(
		(user) =>
			user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
	);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Header */}
			<div className="bg-gray-800 border-b border-gray-700 p-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Shield className="h-8 w-8 text-purple-500" />
						<h1 className="text-2xl font-bold">Admin Panel</h1>
					</div>
					<Button
						onClick={handleLogout}
						variant="outline"
						className="border-gray-600"
					>
						<LogOut className="h-4 w-4 mr-2" />
						Logout
					</Button>
				</div>
			</div>

			<div className="max-w-7xl mx-auto p-6">
				{/* Stats Dashboard */}
				<div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-500/20 rounded-full">
									<Users className="h-6 w-6 text-blue-400" />
								</div>
								<div>
									<p className="text-2xl font-bold text-white">
										{stats.totalUsers}
									</p>
									<p className="text-gray-400">Total Users</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-500/20 rounded-full">
									<FileText className="h-6 w-6 text-green-400" />
								</div>
								<div>
									<p className="text-2xl font-bold text-white">
										{stats.totalPosts}
									</p>
									<p className="text-gray-400">Total Posts</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-emerald-500/20 rounded-full">
									<UserCheck className="h-6 w-6 text-emerald-400" />
								</div>
								<div>
									<p className="text-2xl font-bold text-white">
										{stats.activeUsers}
									</p>
									<p className="text-gray-400">Active Users</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-red-500/20 rounded-full">
									<Ban className="h-6 w-6 text-red-400" />
								</div>
								<div>
									<p className="text-2xl font-bold text-white">
										{stats.bannedUsers}
									</p>
									<p className="text-gray-400">Banned Users</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-yellow-500/20 rounded-full">
									<BarChart3 className="h-6 w-6 text-yellow-400" />
								</div>
								<div>
									<p className="text-2xl font-bold text-white">
										{stats.postsToday}
									</p>
									<p className="text-gray-400">Posts Today</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Search */}
				<div className="mb-6">
					<div className="relative max-w-md">
						<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search posts, users, emails..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 bg-gray-800 border-gray-600 text-white"
						/>
					</div>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="posts" className="space-y-4">
					<TabsList className="bg-gray-800 border-gray-700">
						<TabsTrigger
							value="posts"
							className="data-[state=active]:bg-purple-600"
						>
							Posts Management
						</TabsTrigger>
						<TabsTrigger
							value="users"
							className="data-[state=active]:bg-purple-600"
						>
							Users Management
						</TabsTrigger>
						<TabsTrigger
							value="notifications"
							className="data-[state=active]:bg-purple-600"
						>
							<Bell className="h-4 w-4 mr-2" />
							Push Notifications
						</TabsTrigger>
					</TabsList>

					<TabsContent value="posts">
						<Card className="bg-gray-800 border-gray-700">
							<CardHeader>
								<CardTitle className="text-white">Posts Management</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="border-gray-700">
												<TableHead className="text-gray-300">Content</TableHead>
												<TableHead className="text-gray-300">Author</TableHead>
												<TableHead className="text-gray-300">
													Real User
												</TableHead>
												<TableHead className="text-gray-300">
													Anonymous
												</TableHead>
												<TableHead className="text-gray-300">
													Engagement
												</TableHead>
												<TableHead className="text-gray-300">Created</TableHead>
												<TableHead className="text-gray-300">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredPosts.map((post) => (
												<TableRow key={post._id} className="border-gray-700">
													<TableCell className="text-white max-w-xs">
														<p className="truncate">{post.content}</p>
													</TableCell>
													<TableCell className="text-white">
														<div>
															<p className="font-medium">
																{post.user?.username || "Unknown"}
															</p>
															<p className="text-sm text-gray-400">
																{post.user?.email || "N/A"}
															</p>
														</div>
													</TableCell>
													<TableCell className="text-white">
														<Badge
															variant="outline"
															className="border-blue-500 text-blue-400"
														>
															{post.user?.fullName || "Unknown"}
														</Badge>
													</TableCell>
													<TableCell className="text-white">
														<div className="flex items-center gap-2">
															<span>{post.avatarEmoji}</span>
															<span>{post.anonymousAlias}</span>
														</div>
													</TableCell>
													<TableCell className="text-white">
														<div className="text-sm">
															<div>❤️ {post.likes?.length || 0}</div>
															<div>💬 {post.comments?.length || 0}</div>
															<div>📤 {post.shareCount || 0}</div>
														</div>
													</TableCell>
													<TableCell className="text-gray-400">
														{new Date(post.createdAt).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<div className="flex gap-2">
															<Button
																size="sm"
																variant="outline"
																onClick={() => handleEditPost(post)}
																className="border-gray-600"
															>
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																size="sm"
																variant="destructive"
																onClick={() => handleDeletePost(post._id)}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="users">
						<Card className="bg-gray-800 border-gray-700">
							<CardHeader>
								<CardTitle className="text-white">Users Management</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="border-gray-700">
												<TableHead className="text-gray-300">User</TableHead>
												<TableHead className="text-gray-300">Email</TableHead>
												<TableHead className="text-gray-300">
													Anonymous Alias
												</TableHead>
												<TableHead className="text-gray-300">
													Posts Count
												</TableHead>
												<TableHead className="text-gray-300">Status</TableHead>
												<TableHead className="text-gray-300">Joined</TableHead>
												<TableHead className="text-gray-300">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredUsers.map((user) => (
												<TableRow key={user._id} className="border-gray-700">
													<TableCell className="text-white">
														<div className="flex items-center gap-3">
															<span className="text-lg">
																{user.avatarEmoji || "🎭"}
															</span>
															<div>
																<p className="font-medium">{user.fullName}</p>
																<p className="text-sm text-gray-400">
																	@{user.username}
																</p>
															</div>
														</div>
													</TableCell>
													<TableCell className="text-white">
														{user.email}
													</TableCell>
													<TableCell className="text-white">
														{user.anonymousAlias}
													</TableCell>
													<TableCell className="text-white">
														{user.posts?.length || 0}
													</TableCell>
													<TableCell>
														{user.banned ? (
															<Badge variant="destructive">Banned</Badge>
														) : (
															<Badge variant="default" className="bg-green-500">
																Active
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-gray-400">
														{new Date(user.createdAt).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<div className="flex gap-2">
															<Button
																size="sm"
																variant="outline"
																className="border-gray-600"
															>
																<Eye className="h-4 w-4" />
															</Button>
															<Button
																size="sm"
																variant={
																	user.banned ? "default" : "destructive"
																}
																onClick={() =>
																	handleBanUser(user._id, !user.banned)
																}
															>
																{user.banned ? (
																	<UserCheck className="h-4 w-4" />
																) : (
																	<Ban className="h-4 w-4" />
																)}
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Edit Post Modal */}
				{editingPost && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<Card className="w-full max-w-2xl bg-gray-800 border-gray-700">
							<CardHeader>
								<CardTitle className="text-white">Edit Post</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label className="text-sm font-medium text-gray-300">
										Content
									</label>
									<Textarea
										value={editContent}
										onChange={(e) => setEditContent(e.target.value)}
										className="mt-1 bg-gray-700 border-gray-600 text-white"
										rows={6}
									/>
								</div>
								<div className="flex gap-3 justify-end">
									<Button
										variant="outline"
										onClick={() => {
											setEditingPost(null);
											setEditContent("");
										}}
										className="border-gray-600"
									>
										Cancel
									</Button>
									<Button
										onClick={handleSaveEdit}
										className="bg-purple-600 hover:bg-purple-700"
									>
										Save Changes
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminPanel;
