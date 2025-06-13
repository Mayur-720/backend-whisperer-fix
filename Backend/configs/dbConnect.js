const mongoose = require("mongoose");

function ConnectTODB() {
	// Optimize mongoose connection with pooling and better settings
	const options = {
		maxPoolSize: 10, // Maintain up to 10 socket connections
		serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
		socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
		// bufferMaxEntries: 0, // Disable mongoose buffering
		// bufferCommands: false, // Disable mongoose buffering
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};

	mongoose
		.connect(process.env.MONGO_URL, options)
		.then(() => {
			console.log("Connected to MongoDB with optimized settings");
		})
		.catch((error) => {
			console.error("MongoDB connection error:", error);
			// Don't exit process, let it retry
		});

	// Handle connection events
	mongoose.connection.on("error", (err) => {
		console.error("MongoDB connection error:", err);
	});

	mongoose.connection.on("disconnected", () => {
		console.log("MongoDB disconnected");
	});

	// Handle process termination
	process.on("SIGINT", async () => {
		await mongoose.connection.close();
		console.log("MongoDB connection closed through app termination");
		process.exit(0);
	});
}

module.exports = ConnectTODB;
