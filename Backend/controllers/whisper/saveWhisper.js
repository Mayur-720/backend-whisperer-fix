const User = require("../../models/userModel");
const Whisper = require("../../models/whisperModel");

const saveWhisper = async ({
	senderId,
	receiverId,
	content,
	senderAlias,
	senderEmoji,
}) => {
	try {
		const receiver = await User.findById(receiverId);
		if (!receiver) {
			console.error(`Receiver not found for ID: ${receiverId}`);
			throw new Error("Receiver not found");
		}

		const messageCount = await Whisper.countDocuments({
			$or: [
				{ sender: senderId, receiver: receiverId },
				{ sender: receiverId, receiver: senderId },
			],
		});

		const visibilityLevel = Math.min(3, Math.floor(messageCount / 10));

		const whisper = await Whisper.create({
			sender: senderId,
			receiver: receiverId,
			content,
			senderAlias,
			senderEmoji,
			read: false,
			visibilityLevel,
		});

		// Push notification, socket events
		if (receiver.oneSignalPlayerId && global.oneSignalClient) {
			try {
				await global.oneSignalClient.createNotification({
					include_player_ids: [receiver.oneSignalPlayerId],
					headings: { en: "New Whisper" },
					contents: { en: `${senderAlias}: ${content}` },
					data: {
						type: "whisper",
						senderId: senderId.toString(),
						senderAlias,
						conversationId: receiverId.toString()
					},
					url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/whispers`
				});
				console.log(`Push notification sent to ${receiver.oneSignalPlayerId}`);
			} catch (notificationError) {
				console.error("Failed to send push notification:", notificationError);
			}
		}

		if (global.io) {
			const room = [senderId.toString(), receiverId.toString()].sort().join(":");
			global.io.to(receiverId.toString()).emit("receiveWhisper", whisper);
			global.io.to(room).emit("receiveWhisper", whisper);
			console.log(`Whisper emitted to ${receiverId} and room ${room}`);
		}

		return whisper;
	} catch (error) {
		console.error(
			`Error saving whisper from ${senderId} to ${receiverId}:`,
			error.message
		);
		throw error;
	}
};

module.exports = { saveWhisper };
