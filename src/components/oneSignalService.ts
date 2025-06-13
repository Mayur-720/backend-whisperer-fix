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
		} catch (error) {
			console.error("Failed to setup event listeners:", error);
		}
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
		if (event.result?.url) {
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
