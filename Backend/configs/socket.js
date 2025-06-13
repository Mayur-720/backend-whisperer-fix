
// configs/socket.js
const { socketAuth } = require("../middleware/authMiddleware");
const asyncHandler = require("express-async-handler");
const { saveWhisper } = require("../controllers/whisperController");

module.exports = (io) => {
	io.use(socketAuth);

	io.on("connection", (socket) => {
		console.log(`User connected: ${socket.user._id}, Socket ID: ${socket.id}`);

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

		// Automatically join user to their own room
		socket.join(socket.user._id.toString());
		console.log(`User ${socket.user._id} auto-joined their room`);

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
					console.log(`Whisper from ${socket.user._id} to ${receiverId}: ${content}`);
					
					const whisper = await saveWhisper({
						senderId: socket.user._id,
						receiverId,
						content,
						senderAlias: socket.user.anonymousAlias,
						senderEmoji: socket.user.avatarEmoji,
					});

					console.log(`Whisper saved successfully: ${whisper._id}`);

					// Emit to conversation room for real-time update
					const room = [socket.user._id.toString(), receiverId].sort().join(":");
					io.to(room).emit("receiveWhisper", whisper);
					console.log(`Whisper emitted to room: ${room}`);

					// Also emit to receiver's individual room
					io.to(receiverId).emit("receiveWhisper", whisper);
					console.log(`Whisper emitted to receiver: ${receiverId}`);

					if (callback && typeof callback === 'function') {
						callback({ status: "success", whisper });
					}
				} catch (error) {
					console.error(
						`Error sending whisper for user ${socket.user._id}:`,
						error.message
					);
					if (callback && typeof callback === 'function') {
						callback({ status: "error", message: error.message });
					}
				}
			})
		);

		socket.on("disconnect", () => {
			console.log(`User disconnected: ${socket.user._id}, Socket ID: ${socket.id}`);
		});
	});
};
