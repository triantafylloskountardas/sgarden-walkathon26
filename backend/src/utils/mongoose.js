import "dotenv/config";

import dns from "dns";
import mongoose from "mongoose";

const init = async () => {
	const {
		DATABASE_URL = "mongodb://localhost:27017/testDB",
	} = process.env;

	mongoose.set("strictQuery", false);

	if (DATABASE_URL.startsWith("mongodb+srv://")) {
		dns.setServers(["8.8.8.8", "1.1.1.1", "9.9.9.9"]);
	}

	const connection = await mongoose.connect(DATABASE_URL, {
		serverSelectionTimeoutMS: 10000,
		connectTimeoutMS: 10000,
	}).catch((error) => {
		console.error("MongoDB connection failed:", error.message);
		return null;
	});

	if (connection) {
		console.log("Connected to db!");
	}

	return connection;
};

export default init;
