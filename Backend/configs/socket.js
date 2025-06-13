// configs/socket.js
const { socketAuth } = require("../middleware/authMiddleware");
const asyncHandler = require("express-async-handler");
const { saveWhisper } = require("../controllers/whisperController");

module.exports = (io) => {
	io.use(socketAuth);

	io.on("connection", (socket) => {
		console.log(`User connected: ${socket.user._id}`);

		// Join individual user room for notifications
		socket.on("join", (userId) => {
			if (userId !== socket.user._id.toString()) {
				console.warn(
					`Unauthorized join attempt by ${socket.user._id} for room ${userId}`
				);
				return;
			}
			socket.join(userId);
			console.log(`User ${userId} joined individual room ${userId}`);
		});

		// Join conversation room for whispers
		socket.on("joinConversation", (partnerId) => {
			const room = [socket.user._id.toString(), partnerId].sort().join(":");
			socket.join(room);
			console.log(`User ${socket.user._id} joined conversation room ${room}`);
		});

		// Handle sending whispers
		socket.on(
			"sendWhisper",
			asyncHandler(async ({ receiverId, content }, callback) => {
				try {
					const whisper = await saveWhisper({
						senderId: socket.user._id,
						receiverId,
						content,
						senderAlias: socket.user.anonymousAlias,
						senderEmoji: socket.user.avatarEmoji,
					});

					const room = [socket.user._id.toString(), receiverId]
						.sort()
						.join(":");
					io.to(room).emit("receiveWhisper", whisper);
					callback({ status: "success", whisper });
				} catch (error) {
					console.error(
						`Error sending whisper for user ${socket.user._id}:`,
						error.message
					);
					callback({ status: "error", message: error.message });
				}
			})
		);

		socket.on("disconnect", () => {
			console.log(`User disconnected: ${socket.user._id}`);
		});
	});
};
