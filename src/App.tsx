import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import SmoothScrollProvider from "./components/providers/SmoothScrollProvider";
import LoginSuccessAnimation from "./components/animations/LoginSuccessAnimation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import ProfilePage from "./pages/ProfilePage";
import ReferralPage from "./pages/ReferralPage";
import RecognitionsPage from "./pages/RecognitionsPage";
import GhostCircles from "./pages/GhostCircles";
import WhispersPage from "./pages/WhispersPage";
import InvitePage from "./pages/InvitePage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AppShell from "./components/layout/AppShell";
import "./App.css";
import oneSignalService from "./components/oneSignalService";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 2,
			refetchOnWindowFocus: false,
		},
	},
});

const AppContent: React.FC = () => {
	const { showLoginAnimation, setShowLoginAnimation } = useAuth();
	useEffect(() => {
		const initOneSignal = async () => {
			try {
				await oneSignalService.initialize();
			} catch (error) {
				console.error("OneSignal initialization error:", error);
			}
		};
		initOneSignal();
	}, []);

	return (
		<>
			{showLoginAnimation && (
				<LoginSuccessAnimation
					onComplete={() => setShowLoginAnimation(false)}
				/>
			)}

			<SmoothScrollProvider>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/admin/login" element={<AdminLogin />} />
					<Route
						path="/admin"
						element={
							<ProtectedAdminRoute>
								<AdminPanel />
							</ProtectedAdminRoute>
						}
					/>
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<AppShell>
									<Index />
								</AppShell>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/profile/:userId?"
						element={
							<ProtectedRoute>
								<AppShell>
									<ProfilePage />
								</AppShell>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/referral"
						element={
							<ProtectedRoute>
								<AppShell>
									<ReferralPage />
								</AppShell>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/recognitions"
						element={
							<ProtectedRoute>
								<AppShell>
									<RecognitionsPage />
								</AppShell>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/ghost-circles"
						element={
							<ProtectedRoute>
								<AppShell>
									<GhostCircles />
								</AppShell>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/whispers"
						element={
							<ProtectedRoute>
								<AppShell>
									<WhispersPage />
								</AppShell>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/invite/:circleId"
						element={
							<ProtectedRoute>
								<AppShell>
									<InvitePage />
								</AppShell>
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</SmoothScrollProvider>
		</>
	);
};

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<Router>
				<AuthProvider>
					<AdminProvider>
						<AppContent />
						<Toaster />
					</AdminProvider>
				</AuthProvider>
			</Router>
		</QueryClientProvider>
	);
}

export default App;
