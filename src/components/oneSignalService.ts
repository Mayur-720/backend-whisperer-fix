/* eslint-disable @typescript-eslint/no-explicit-any */
import OneSignal from "react-onesignal";

interface OneSignalConfig {
	appId: string;
}

interface NotificationPayload {
	title: string;
	message: string;
	url?: string;
	imageUrl?: string;
	data?: Record<string, any>;
}

interface TargetOptions {
	userIds?: string[];
	segments?: string[];
	platform?: "web" | "android" | "all";
}

class OneSignalService {
	private isInitialized = false;
	private config: OneSignalConfig;

	constructor(config: OneSignalConfig) {
		this.config = config;
		console.log("OneSignal App ID:", this.config.appId);
		console.log("NODE_ENV:", process.env.NODE_ENV);
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.log("OneSignal already initialized");
			return;
		}

		try {
			await OneSignal.init({
				appId: this.config.appId,
				allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
				autoRegister: false,
				autoResubscribe: true,
				persistNotification: true,
				showCredit: false,
			});

			this.isInitialized = true;
			console.log("OneSignal initialized successfully");
			this.setupEventListeners();
		} catch (error) {
			console.error("Failed to initialize OneSignal:", error);
			throw new Error("OneSignal initialization failed");
		}
	}

	private setupEventListeners(): void {
		try {
			OneSignal.User.PushSubscription.addEventListener("change", (event) => {
				console.log("Subscription changed:", event);
				this.handleSubscriptionChange(event.current.optedIn);
			});

			OneSignal.Notifications.addEventListener("click", (event) => {
				console.log("Notification clicked:", event);
				this.handleNotificationClick(event);
			});

			// Handle foreground notifications for whispers
			OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
				console.log("Foreground notification received:", event);
				const notificationData = event.notification.additionalData;
				
				if (notificationData?.type === 'whisper') {
					// Show custom in-app notification for whispers
					this.showInAppWhisperNotification(event.notification);
				}
			});
		} catch (error) {
			console.error("Failed to setup event listeners:", error);
		}
	}

	private showInAppWhisperNotification(notification: any): void {
		// Create custom toast notification for whispers
		const toast = document.createElement('div');
		toast.className = 'fixed top-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
		toast.innerHTML = `
			<div class="flex items-center">
				<div class="flex-1">
					<div class="font-semibold">${notification.title}</div>
					<div class="text-sm opacity-90">${notification.body}</div>
				</div>
				<button class="ml-2 text-white hover:text-gray-300" onclick="this.parentElement.parentElement.remove()">×</button>
			</div>
		`;
		
		// Add click handler to navigate to whispers
		toast.onclick = () => {
			const data = notification.additionalData;
			if (data?.senderId) {
				window.location.href = `/whispers?conversation=${data.senderId}`;
			} else {
				window.location.href = '/whispers';
			}
			toast.remove();
		};
		
		document.body.appendChild(toast);
		
		// Auto remove after 5 seconds
		setTimeout(() => {
			if (toast.parentElement) {
				toast.remove();
			}
		}, 5000);
	}

	async requestPermissionAndSubscribe(): Promise<{
		success: boolean;
		playerId?: string;
		error?: string;
	}> {
		try {
			if (!this.isInitialized) {
				await this.initialize();
			}

			const isSubscribed = OneSignal.User.PushSubscription.optedIn;
			if (isSubscribed) {
				const playerId = OneSignal.User.PushSubscription.id;
				return { success: true, playerId: playerId || undefined };
			}

			await OneSignal.Notifications.requestPermission();
			const permissionGranted = OneSignal.Notifications.permission;
			if (!permissionGranted) {
				return { success: false, error: "Permission denied" };
			}

			OneSignal.User.PushSubscription.optIn();
			const playerId = OneSignal.User.PushSubscription.id;

			if (!playerId) {
				return { success: false, error: "Failed to get player ID" };
			}

			console.log("Successfully subscribed with player ID:", playerId);
			return { success: true, playerId };
		} catch (error) {
			console.error("Failed to subscribe to notifications:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async unsubscribe(): Promise<{ success: boolean; error?: string }> {
		try {
			OneSignal.User.PushSubscription.optOut();
			console.log("Successfully unsubscribed from notifications");
			return { success: true };
		} catch (error) {
			console.error("Failed to unsubscribe:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async getSubscriptionStatus(): Promise<{
		isSubscribed: boolean;
		playerId?: string;
		permission?: NotificationPermission;
	}> {
		try {
			const isSubscribed = OneSignal.User.PushSubscription.optedIn;
			const playerId = OneSignal.User.PushSubscription.id;

			let permission: NotificationPermission = "default";
			try {
				const permissionStatus = OneSignal.Notifications.permission;
				if (permissionStatus === true) {
					permission = "granted";
				} else if (permissionStatus === false) {
					permission = "denied";
				} else {
					permission = "default";
				}
			} catch (permError) {
				console.warn("Could not get permission status:", permError);
				permission = "default";
			}

			return {
				isSubscribed: Boolean(isSubscribed),
				playerId: playerId || undefined,
				permission,
			};
		} catch (error) {
			console.error("Failed to get subscription status:", error);
			return { isSubscribed: false, permission: "default" };
		}
	}

	isSupported(): boolean {
		return (
			typeof window !== "undefined" &&
			"serviceWorker" in navigator &&
			"PushManager" in window
		);
	}

	async setExternalUserId(
		userId: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			await OneSignal.login(userId);
			console.log("External user ID set:", userId);
			return { success: true };
		} catch (error) {
			console.error("Failed to set external user ID:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async addTags(
		tags: Record<string, string>
	): Promise<{ success: boolean; error?: string }> {
		try {
			OneSignal.User.addTags(tags);
			console.log("User tags set:", tags);
			return { success: true };
		} catch (error) {
			console.error("Failed to set user tags:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private async handleSubscriptionChange(isSubscribed: boolean): Promise<void> {
		if (isSubscribed) {
			const playerId = OneSignal.User.PushSubscription.id;
			console.log("User subscribed with player ID:", playerId);
			
			// Send player ID to backend to store in user profile
			try {
				const token = localStorage.getItem('token');
				if (token && playerId) {
					await fetch('/api/users/update-onesignal-id', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ oneSignalPlayerId: playerId })
					});
				}
			} catch (error) {
				console.error('Failed to update OneSignal player ID:', error);
			}
			
			window.dispatchEvent(
				new CustomEvent("onesignal:subscribed", {
					detail: { playerId },
				})
			);
		} else {
			console.log("User unsubscribed");
			window.dispatchEvent(new CustomEvent("onesignal:unsubscribed"));
		}
	}

	private handleNotificationClick(event: any): void {
		console.log("Notification clicked:", event);
		const data = event.notification.additionalData;
		
		if (data?.type === 'whisper') {
			if (data.senderId) {
				window.location.href = `/whispers?conversation=${data.senderId}`;
			} else {
				window.location.href = '/whispers';
			}
		} else if (event.result?.url) {
			window.open(event.result.url, "_blank");
		}
		
		window.dispatchEvent(
			new CustomEvent("onesignal:notificationClick", {
				detail: event,
			})
		);
	}
}

const oneSignalConfig: OneSignalConfig = {
	appId:
		import.meta.env.VITE_ONESIGNAL_APP_ID ||
		"6c404389-4e1b-4fde-b2e0-6c95c9483f00",
};

export const oneSignalService = new OneSignalService(oneSignalConfig);
export default oneSignalService;
export type { NotificationPayload, TargetOptions };
