import express from "express";
import {
	readFileSync,
	writeFileSync,
	existsSync,
	readdirSync,
	statSync,
	mkdirSync,
} from "fs";
import { resolve, relative, sep, basename, extname, join } from "path";
import { ImportRecord } from "../models/index.js";

const router = express.Router({ mergeParams: true });

const BASE_DIRS = {
	reports: resolve("./reports"),
	templates: resolve("./templates"),
	uploads: resolve("./uploads"),
	data: resolve("./data"),
	files: resolve("./files"),
	config: resolve("./config"),
};

const generateRandomData = (min = 0, max = 10) =>
	Math.random() * (max - min) + min;

function safePath(baseDir, userPath, allowedExts = null) {
	if (typeof userPath !== "string" || !userPath.trim()) {
		throw new Error("Invalid path");
	}

	const normalizedBase = resolve(baseDir);
	const resolvedPath = resolve(normalizedBase, userPath);
	const rel = relative(normalizedBase, resolvedPath);

	if (rel.startsWith("..") || rel === ".." || resolve(rel) === rel) {
		throw new Error("Path traversal blocked");
	}

	if (allowedExts && !allowedExts.includes(extname(resolvedPath).toLowerCase())) {
		throw new Error("Invalid file type");
	}

	return resolvedPath;
}

function renderTemplate(templateString, data = {}) {
	const safeData = Object.fromEntries(
		Object.entries(data).filter(([key, value]) =>
			/^[a-zA-Z0-9_]+$/.test(key) &&
			["string", "number", "boolean"].includes(typeof value)
		)
	);

	return String(templateString).replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
		return Object.prototype.hasOwnProperty.call(safeData, key)
			? String(safeData[key])
			: "";
	});
}

router.get("/", async (req, res) => {
	try {
		const quarterlySalesDistribution = {
			Q1: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
			Q2: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
			Q3: Array.from({ length: 100 }, () => generateRandomData(0, 10)),
		};

		const budgetVsActual = {
			January: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
			February: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
			March: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
			April: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
			May: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
			June: { budget: generateRandomData(0, 100), actual: generateRandomData(0, 100), forecast: generateRandomData(0, 100) },
		};

		const timePlot = {
			projected: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
			actual: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
			historicalAvg: Array.from({ length: 20 }, () => generateRandomData(0, 100)),
		};

		return res.json({ success: true, quarterlySalesDistribution, budgetVsActual, timePlot });
	} catch {
		return res.status(500).json({ message: "Something went wrong." });
	}
});

router.get("/download-report", (req, res) => {
	try {
		const { reportName } = req.query;
		if (!reportName) return res.status(400).json({ message: "Report name required" });

		const reportPath = safePath(BASE_DIRS.reports, reportName);

		if (!existsSync(reportPath)) {
			return res.status(404).json({ message: "Report not found" });
		}

		res.download(reportPath);
	} catch {
		return res.status(400).json({ message: "Invalid report path" });
	}
});

router.get("/render-page", (req, res) => {
	try {
		const { template } = req.query;
		if (!template) return res.status(400).json({ message: "Template name required" });

		const templatePath = safePath(BASE_DIRS.templates, template, [".html", ".htm"]);

		if (!existsSync(templatePath)) {
			return res.status(404).json({ message: "Template not found" });
		}

		const templateContent = readFileSync(templatePath, "utf8");
		return res.type("html").send(templateContent);
	} catch {
		return res.status(400).json({ message: "Invalid template path" });
	}
});

router.post("/upload-file", (req, res) => {
	try {
		const { filename, content, destination = "" } = req.body;

		if (!filename || content == null) {
			return res.status(400).json({ message: "Filename and content required" });
		}

		const safeDestination =
			typeof destination === "string" && destination.trim()
				? destination
				: "";

		const safeFilename = basename(filename);

		if (safeFilename !== filename) {
			return res.status(400).json({ message: "Invalid filename" });
		}

		const uploadDir = safePath(BASE_DIRS.uploads, safeDestination);
		mkdirSync(uploadDir, { recursive: true });

		const uploadPath = safePath(
			BASE_DIRS.uploads,
			join(safeDestination, safeFilename)
		);

		writeFileSync(uploadPath, content, "utf8");

		return res.json({
			success: true,
			path: uploadPath,
			message: "File uploaded successfully",
		});
	} catch {
		return res.status(400).json({ message: "Invalid upload path" });
	}
});

router.post("/import", async (req, res) => {
	try {
		const { records } = req.body;
		if (!Array.isArray(records)) {
			return res.status(400).json({ message: "Import payload must include an array of records." });
		}

		const errors = [];
		const validRecords = [];

		records.forEach((original, index) => {
			const record = typeof original === "object" && original !== null ? original : { value: String(original) };
			const rowErrors = [];

			const hasAnyValue = Object.keys(record).some((key) => {
				const value = record[key];
				return value !== undefined && value !== null && String(value).trim() !== "";
			});

			if (!hasAnyValue) {
				rowErrors.push("Row has no values.");
			}

			if (hasAnyValue && record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(record.email))) {
				rowErrors.push("Email must be valid.");
			}

			const numericFields = ["amount", "value", "quantity", "price"];
			numericFields.forEach((field) => {
				if (record[field] != null && record[field] !== "" && Number.isNaN(Number(record[field]))) {
					rowErrors.push(`${field} must be numeric.`);
				}
			});

			["date", "timestamp"].forEach((field) => {
				if (record[field] != null && record[field] !== "") {
					const parsed = new Date(record[field]);
					if (Number.isNaN(parsed.getTime())) {
						rowErrors.push(`${field} must be a valid date.`);
					}
				}
			});

			if (rowErrors.length) {
				errors.push({ index, message: rowErrors.join(" "), row: record });
				return;
			}

			validRecords.push({
				raw: record,
				label: record.label || record.name || null,
				category: record.category || null,
				amount: record.amount != null ? Number(record.amount) : record.value != null ? Number(record.value) : null,
				date: record.date ? new Date(record.date) : record.timestamp ? new Date(record.timestamp) : null,
				email: record.email || null,
				notes: record.notes || null,
				importedBy: res.locals?.user?._id || null,
			});
		});

		const inserted = validRecords.length ? await ImportRecord.insertMany(validRecords, { ordered: false }) : [];

		return res.json({
			success: true,
			insertedCount: inserted.length,
			errors,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Unable to import records." });
	}
});

router.get("/imported", async (req, res) => {
	try {
		const records = await ImportRecord.find().sort({ importedAt: -1 }).limit(100).lean();
		return res.json({ success: true, records });
	} catch {
		return res.status(500).json({ message: "Unable to load imported records." });
	}
});

router.get("/export-csv", (req, res) => {
	try {
		const { dataFile } = req.query;
		if (!dataFile) return res.status(400).json({ message: "Data file required" });

		const csvPath = safePath(BASE_DIRS.data, dataFile, [".csv"]);

		if (!existsSync(csvPath)) {
			return res.status(404).json({ message: "CSV file not found" });
		}

		res.setHeader("Content-Type", "text/csv");
		res.download(csvPath);
	} catch {
		return res.status(400).json({ message: "Invalid CSV path" });
	}
});

router.get("/browse-files", (req, res) => {
	try {
		const { directory } = req.query;
		if (!directory) return res.status(400).json({ message: "Directory required" });

		const dirPath = safePath(BASE_DIRS.files, directory);

		if (!existsSync(dirPath)) {
			return res.status(404).json({ message: "Directory not found" });
		}

		const files = readdirSync(dirPath).map((file) => {
			const filePath = join(dirPath, file);
			const stats = statSync(filePath);

			return {
				name: file,
				size: stats.size,
				isDirectory: stats.isDirectory(),
				modified: stats.mtime,
			};
		});

		return res.json({ success: true, files });
	} catch {
		return res.status(400).json({ message: "Invalid directory path" });
	}
});

router.get("/config/load", (req, res) => {
	try {
		const { configFile } = req.query;
		if (!configFile) return res.status(400).json({ message: "Config file required" });

		const configPath = safePath(BASE_DIRS.config, configFile, [".json"]);

		if (!existsSync(configPath)) {
			return res.status(404).json({ message: "Config file not found" });
		}

		const config = readFileSync(configPath, "utf8");
		return res.json({ success: true, config: JSON.parse(config) });
	} catch {
		return res.status(400).json({ message: "Could not load config" });
	}
});

router.post("/generate-custom-report", (req, res) => {
	try {
		const { templateString, data } = req.body;

		if (!templateString) {
			return res.status(400).json({ message: "Template string required" });
		}

		const reportData = data || {
			username: "Unknown",
			date: new Date().toLocaleDateString(),
			totalUsers: 100,
		};

		const report = renderTemplate(templateString, reportData);

		return res.json({
			success: true,
			report,
			generatedAt: new Date(),
		});
	} catch {
		return res.status(500).json({ message: "Report generation failed" });
	}
});

export default router;