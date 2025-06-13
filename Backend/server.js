
// server.js
require("dotenv").config({ path: "./.env" });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const morgan = require("morgan");
const cors = require("cors");
const ConnectTODB = require("./configs/dbConnect");
const indexRoutes = require("./routes/indexRoutes");
const userRoutes = require("./routes/userRoutes");
const ghostCircleRoutes = require("./routes/ghostCircleRoutes");
const postRoutes = require("./routes/postRoutes");
const whisperRoutes = require("./routes/whisperRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
	"https://underkover.in",
	"http://localhost:8080",
	"http://192.168.253.3:8080",
	"http://localhost:3000",
	"https://lovable.dev/projects/f9d440f6-e552-4080-9d03-1bdf75980bbe",
];

const io = new Server(server, {
	cors: {
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS (Socket.IO)"));
			}
		},
		methods: ["GET", "POST"],
		credentials: true,
	},
});

app.use(
	cors({
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
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// Make io globally available
global.io = io;

// Apply Socket.IO configuration
require("./configs/socket")(io);

// Connect to DB
ConnectTODB();

// API Routes
app.use("/api", indexRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ghost-circles", ghostCircleRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/whispers", whisperRoutes);
app.use("/api/admin", adminRoutes);

// Healthcheck Route
app.get("/healthcheck", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
	const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
	res.status(statusCode).json({
		message: err.message,
		stack: process.env.NODE_ENV === "production" ? null : err.stack,
	});
});

const PORT = process.env.PORT || 8900;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
