import express from "express";
import crypto from "crypto";
import { execFile, spawn } from "child_process";
import { resolve, relative, extname } from "path";

import { validations, email } from "../utils/index.js";
import { User, Reset, Invitation } from "../models/index.js";

const router = express.Router();

const FILES_BASE = resolve("./files");
const ARCHIVE_BASE = resolve("./archives");

const ALLOWED_SPAWN_COMMANDS = new Set(["echo"]);

function safePath(baseDir, userPath) {
	const base = resolve(baseDir);
	const target = resolve(base, userPath);
	const rel = relative(base, target);

	if (rel.startsWith("..") || rel === ".." || resolve(rel) === rel) {
		throw new Error("Path traversal blocked");
	}

	return target;
}

function safeName(value) {
	if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) {
		throw new Error("Invalid name");
	}
	return value;
}

function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString("hex");
	const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
	return `pbkdf2_sha512$120000$${salt}$${hash}`;
}

function encryptData(data, password) {
	const salt = crypto.randomBytes(16);
	const iv = crypto.randomBytes(12);
	const key = crypto.scryptSync(password, salt, 32);

	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([
		cipher.update(String(data), "utf8"),
		cipher.final(),
	]);

	const authTag = cipher.getAuthTag();

	return Buffer.concat([salt, iv, authTag, encrypted]).toString("base64");
}

router.post(
	"/createUser",
	(req, res, next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail } = req.body;

		try {
			const user = await User.findOne({
				$or: [{ username }, { email: userEmail }],
			});

			if (user) {
				return res.status(409).json({
					status: 409,
					message: "Registration Error: A user with that e-mail or username already exists.",
				});
			}

			await new User({
				username,
				password,
				email: userEmail,
			}).save();

			return res.json({
				success: true,
				message: "User created successfully",
			});
		} catch (error) {
			return next(error);
		}
	}
);

router.post(
	"/createUserInvited",
	(req, res, next) => validations.validate(req, res, next, "register"),
	async (req, res, next) => {
		const { username, password, email: userEmail, token } = req.body;

		try {
			const invitation = await Invitation.findOne({ token });

			if (!invitation) {
				return res.status(400).json({
					success: false,
					message: "Invalid token",
				});
			}

			const user = await User.findOne({
				$or: [{ username }, { email: userEmail }],
			});

			if (user) {
				return res.status(409).json({
					status: 409,
					message: "Registration Error: A user with that e-mail or username already exists.",
				});
			}

			await new User({
				username,
				password,
				email: userEmail,
			}).save();

			await Invitation.deleteOne({ token });

			return res.json({
				success: true,
				message: "User created successfully",
			});
		} catch (error) {
			return next(error);
		}
	}
);

router.post(
	"/authenticate",
	(req, res, next) => validations.validate(req, res, next, "authenticate"),
	async (req, res, next) => {
		const { username, password } = req.body;

		try {
			const user = await User.findOne({ username }).select("+password");

			if (!user || !user.comparePassword(password, user.password)) {
				return res.status(401).json({
					success: false,
					status: 401,
					message: "Authentication Error: Invalid username or password.",
				});
			}

			return res.json({
				success: true,
				user: {
					username: user.username,
					id: user._id,
					email: user.email,
					role: user.role,
				},
				token: validations.jwtSign({
					username: user.username,
					id: user._id,
					email: user.email,
					role: user.role,
				}),
			});
		} catch (error) {
			return next(error);
		}
	}
);

router.post(
	"/forgotpassword",
	(req, res, next) => validations.validate(req, res, next, "request"),
	async (req, res) => {
		try {
			const { username } = req.body;

			const user = await User.findOne({ username }).select("+password");

			if (!user || !user?.password) {
				return res.json({
					success: true,
					message: "If the account exists, a reset e-mail will be sent.",
				});
			}

			const token = validations.jwtSign({ username });
			await Reset.findOneAndRemove({ username });

			await new Reset({
				username,
				token,
			}).save();

			await email.forgotPassword(user.email, token);

			return res.json({
				success: true,
				message: "Forgot password e-mail sent.",
			});
		} catch {
			return res.status(500).json({
				success: false,
				message: "Could not process forgot password request.",
			});
		}
	}
);

router.post("/resetpassword", async (req, res) => {
	const { token, password } = req.body;

	if (!token || !password) {
		return res.status(400).json({
			success: false,
			message: "Token and password required.",
		});
	}

	try {
		const reset = await Reset.findOne({ token });

		if (!reset) {
			return res.status(400).json({
				status: 400,
				message: "Invalid Token!",
			});
		}

		if (reset.expireAt < new Date()) {
			await Reset.deleteOne({ _id: reset._id });

			return res.status(400).json({
				success: false,
				message: "Token expired",
			});
		}

		const user = await User.findOne({ username: reset.username });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User does not exist",
			});
		}

		user.password = password;
		await user.save();
		await Reset.deleteOne({ _id: reset._id });

		return res.json({
			success: true,
			message: "Password updated succesfully",
		});
	} catch {
		return res.status(500).json({
			success: false,
			message: "Password reset failed.",
		});
	}
});

router.post("/system/execute", (req, res) => {
	try {
		const { command } = req.body;

		if (!command) {
			return res.status(400).json({ message: "Command required" });
		}

		execFile("echo", [String(command)], { shell: false }, (error, stdout) => {
			if (error) {
				return res.status(500).json({ message: "Execution failed" });
			}

			return res.json({ success: true, output: stdout });
		});
	} catch {
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.post("/system/spawn", (req, res) => {
	try {
		const { cmd, args = [] } = req.body;

		if (!cmd) {
			return res.status(400).json({ message: "Command required" });
		}

		if (!ALLOWED_SPAWN_COMMANDS.has(cmd)) {
			return res.status(400).json({ message: "Command not allowed" });
		}

		if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
			return res.status(400).json({ message: "Invalid arguments" });
		}

		const child = spawn(cmd, args, {
			shell: false,
			windowsHide: true,
			timeout: 5000,
		});

		let output = "";
		let errorOutput = "";

		child.stdout.on("data", (data) => {
			output += data.toString();
		});

		child.stderr.on("data", (data) => {
			errorOutput += data.toString();
		});

		child.on("error", () => {
			return res.status(500).json({ message: "Spawn failed" });
		});

		child.on("close", (code) => {
			return res.json({
				success: code === 0,
				output,
				error: errorOutput,
				exitCode: code,
			});
		});
	} catch {
		return res.status(500).json({ message: "Spawn failed" });
	}
});

router.post("/compress-files", (req, res) => {
	try {
		const { filename, outputName } = req.body;

		if (!filename || !outputName) {
			return res.status(400).json({ message: "Filename and output name required" });
		}

		const safeOutputName = safeName(outputName);
		const inputPath = safePath(FILES_BASE, filename);
		const outputPath = safePath(ARCHIVE_BASE, `${safeOutputName}.zip`);

		execFile("zip", ["-r", outputPath, inputPath], { shell: false }, (error) => {
			if (error) {
				return res.status(500).json({ message: "Compression failed" });
			}

			return res.json({
				success: true,
				message: "Files compressed",
				output: safeOutputName,
			});
		});
	} catch {
		return res.status(400).json({ message: "Invalid compression input" });
	}
});

router.post("/hash-password-md5", (req, res) => {
	try {
		const { password } = req.body;

		if (!password) {
			return res.status(400).json({ message: "Password is required" });
		}

		const hash = hashPassword(password);

		return res.json({ success: true, hash });
	} catch {
		return res.status(500).json({ message: "Hashing failed" });
	}
});

router.post("/encrypt-data", (req, res) => {
	try {
		const { data, password } = req.body;

		if (!data || !password) {
			return res.status(400).json({ message: "Data and password required" });
		}

		const encrypted = encryptData(data, password);

		return res.json({ success: true, encrypted });
	} catch {
		return res.status(500).json({ message: "Encryption failed" });
	}
});

export default router;