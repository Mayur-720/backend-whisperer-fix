// server.js
require("dotenv").config({ path: "./.env" });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const ConnectTODB = require("./configs/dbConnect");
const { initRedis } = require("./utils/redisClient");

// Import routes
const indexRoutes = require("./routes/indexRoutes");
const userRoutes = require("./routes/userRoutes");
const ghostCircleRoutes = require("./routes/ghostCircleRoutes");
const postRoutes = require("./routes/postRoutes");
const whisperRoutes = require("./routes/whisperRoutes");
const adminRoutes = require("./routes/adminRoutes");
const promptEventRoutes = require("./routes/promptEventRoutes");
const whisperMatchRoutes = require("./routes/whisperMatchRoutes");
const amaRoutes = require("./routes/amaRoutes");
const matchRoutes = require("./routes/matchRoutes");
const adminMatchRoutes = require("./routes/adminMatchRoutes");

const app = express();
const server = http.createServer(app);

// Initialize Redis for caching (optional, falls back gracefully)
initRedis();

// Initialize OneSignal Client
if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY) {
	const OneSignal = require("onesignal-node");
	global.oneSignalClient = new OneSignal.Client(
		process.env.ONESIGNAL_APP_ID,
		process.env.ONESIGNAL_REST_API_KEY
	);
	console.log("OneSignal client initialized");
} else {
	console.warn("OneSignal credentials not found in environment variables");
}

// Trust proxy for rate limiting
app.set("trust proxy", 1);

// Security middleware
app.use(
	helmet({
		crossOriginEmbedderPolicy: false,
		contentSecurityPolicy: false,
	})
);

// Compression middleware for better performance
app.use(compression());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 1000, // Limit each IP to 1000 requests per windowMs
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});
app.use("/api", limiter);

const allowedOrigins = [
	"https://underkover.in",
	"http://localhost:8080",
	"http://192.168.253.3:8080",
	"http://localhost:3000",
	"https://lovable.dev/projects/f9d440f6-e552-4080-9d03-1bdf75980bbe",
];

// CORS configuration
const corsOptions = {
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	methods: ["GET", "POST", "PUT", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Socket.IO configuration
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"],
	allowEIO3: true,
});

// Body parsing middleware (optimized order)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Logging middleware (only in development)
if (process.env.NODE_ENV !== "production") {
	app.use(morgan("dev"));
}

// Make io globally available
global.io = io;

// Apply Socket.IO configuration
require("./configs/socket")(io);

// Connect to DB
ConnectTODB();

// Health check route (before other routes for faster response)
app.get("/healthcheck", (req, res) => {
	res.status(200).json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// API Routes
app.use("/api", indexRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ghost-circles", ghostCircleRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/whispers", whisperRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prompts", promptEventRoutes);
app.use("/api/whisper-match", whisperMatchRoutes);
app.use("/api/ama", amaRoutes);

// ----- NEW ROUTES FOR MATCH FEATURES AND ADMIN -----
app.use("/api/match", matchRoutes);
app.use("/api/admin", adminMatchRoutes);

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({ message: "Route not found" });
});

// Error handling middleware (optimized)
app.use((err, req, res, next) => {
	const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

	console.error("Error:", {
		message: err.message,
		stack: process.env.NODE_ENV === "production" ? null : err.stack,
		url: req.url,
		method: req.method,
		timestamp: new Date().toISOString(),
	});

	res.status(statusCode).json({
		message: err.message,
		stack: process.env.NODE_ENV === "production" ? null : err.stack,
	});
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("SIGTERM received, shutting down gracefully");
	server.close(() => {
		console.log("Process terminated");
	});
});

const PORT = process.env.PORT || 8900;
server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
	console.log(`🔗 Health check: ${process.env.FRONTEND_URL}/healthcheck`);
});
