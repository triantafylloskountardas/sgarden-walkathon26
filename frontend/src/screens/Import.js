import { useMemo, useRef, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";

import { importData } from "../api/index.js";
import Dropdown from "../components/Dropdown.js";
import { dayjs, useSnackbar, useI18n } from "../utils/index.js";

const IMPORT_HISTORY_STORAGE_KEY = "sgarden-import-history";
const mappableFields = [
	{ value: "ignore", text: "Ignore column" },
	{ value: "category", text: "Category" },
	{ value: "month", text: "Month" },
	{ value: "year", text: "Year" },
	{ value: "value", text: "Value" },
	{ value: "unit", text: "Unit" },
	{ value: "notes", text: "Notes" },
	{ value: "email", text: "Email" },
	{ value: "amount", text: "Amount" },
	{ value: "date", text: "Date" },
	{ value: "timestamp", text: "Timestamp" },
];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readImportHistory = () => {
	try {
		if (typeof window === "undefined") return [];

		const stored = window.localStorage.getItem(IMPORT_HISTORY_STORAGE_KEY);
		if (!stored) return [];

		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const writeImportHistory = (entries) => {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(IMPORT_HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 10)));
	} catch {
		// Ignore local storage failures so import stays usable.
	}
};

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const parseCsvLine = (line) => {
	const values = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i += 1) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			values.push(current);
			current = "";
		} else {
			current += char;
		}
	}

	values.push(current);
	return values;
};

const parseCsv = (text) => {
	const rows = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");
	if (!rows.length) return [];

	const headers = parseCsvLine(rows[0]).map((header) => header.trim());
	if (!headers.length) return [];

	return rows.slice(1).map((row) => {
		const values = parseCsvLine(row);
		return headers.reduce((acc, header, index) => {
			acc[header] = values[index] !== undefined ? values[index].trim() : "";
			return acc;
		}, {});
	});
};

const parseJson = (text) => {
	const parsed = JSON.parse(text);
	if (Array.isArray(parsed)) return parsed;
	if (parsed && typeof parsed === "object") {
		if (Array.isArray(parsed.records)) return parsed.records;
		if (Array.isArray(parsed.data)) return parsed.data;
		return [parsed];
	}

	throw new Error("Top-level JSON must be an array or object.");
};

const normalizeErrorList = (errors) => {
	if (!errors || !errors.length) return "";
	return errors.join(" • ");
};

const validateRow = (row, index) => {
	const errors = [];

	if (row === null || row === undefined || typeof row !== "object" || Array.isArray(row)) {
		errors.push("Row must be an object.");
		return { original: row, isValid: false, errors, index };
	}

	const keys = Object.keys(row);
	const nonEmptyKeys = keys.filter((key) => hasValue(row[key]));
	if (!nonEmptyKeys.length) {
		errors.push("Row has no mapped values.");
	}

	if (hasValue(row.email) && !emailPattern.test(String(row.email).trim())) {
		errors.push("Email is invalid.");
	}

	if (hasValue(row.amount) && Number.isNaN(Number(row.amount))) {
		errors.push("Amount must be numeric.");
	}

	if (hasValue(row.value) && Number.isNaN(Number(row.value))) {
		errors.push("Value must be numeric.");
	}

	if (hasValue(row.year) && Number.isNaN(Number(row.year))) {
		errors.push("Year must be numeric.");
	}

	if (hasValue(row.date)) {
		const parsed = new Date(row.date);
		if (Number.isNaN(parsed.getTime())) {
			errors.push("Date must be valid.");
		}
	}

	if (hasValue(row.timestamp)) {
		const parsed = new Date(row.timestamp);
		if (Number.isNaN(parsed.getTime())) {
			errors.push("Timestamp must be valid.");
		}
	}

	return {
		original: row,
		isValid: errors.length === 0,
		errors,
		index,
	};
};

const getPreviewColumns = (previewRows) => {
	const allKeys = [];
	previewRows.forEach(({ original }) => {
		Object.keys(original || {}).forEach((key) => {
			if (!allKeys.includes(key)) {
				allKeys.push(key);
			}
		});
	});
	return allKeys;
};

const renderCellValue = (value) => {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
};

const getDefaultMappings = (rows) => {
	const firstRow = rows[0] || {};
	return Object.keys(firstRow).reduce((acc, key) => {
		const normalizedKey = key.toLowerCase();
		const match = mappableFields.find((field) => field.value !== "ignore" && field.value.toLowerCase() === normalizedKey);
		acc[key] = match ? match.value : "ignore";
		return acc;
	}, {});
};

const mapRows = (rows, mappings) => rows.map((row) => Object.entries(mappings).reduce((acc, [sourceKey, targetKey]) => {
	if (targetKey === "ignore") return acc;
	acc[targetKey] = row[sourceKey];
	return acc;
}, {}));

const Import = () => {
	const [fileName, setFileName] = useState("");
	const [rawRows, setRawRows] = useState([]);
	const [columnMappings, setColumnMappings] = useState({});
	const [parseError, setParseError] = useState("");
	const [summary, setSummary] = useState(null);
	const [loading, setLoading] = useState(false);
	const [history, setHistory] = useState(() => readImportHistory());
	const fileInputRef = useRef(null);
	const { success } = useSnackbar();
	const { t } = useI18n();

	const mappedRows = useMemo(() => mapRows(rawRows, columnMappings), [columnMappings, rawRows]);
	const previewRows = useMemo(() => mappedRows.map((row, index) => validateRow(row, index)), [mappedRows]);
	const columns = useMemo(() => getPreviewColumns(previewRows), [previewRows]);

	const resetPage = () => {
		setFileName("");
		setRawRows([]);
		setColumnMappings({});
		setParseError("");
		setSummary(null);
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const parseDataFile = async (file) => {
		setParseError("");
		setSummary(null);

		if (!file) return;

		const text = await new Promise((resolveFile, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolveFile(reader.result);
			reader.onerror = () => reject(new Error("Unable to read file."));
			reader.readAsText(file, "UTF-8");
		});

		const extension = file.name.split(".").pop().toLowerCase();
		let rows = [];

		try {
			if (extension === "json") {
				rows = parseJson(text);
			} else if (extension === "csv") {
				rows = parseCsv(text);
			} else {
				throw new Error("File must be a CSV or JSON file.");
			}
		} catch (parseException) {
			setParseError(parseException.message || "Unable to parse file.");
			setRawRows([]);
			setColumnMappings({});
			return;
		}

		const normalizedRows = rows.map((row) => {
			if (typeof row === "string") {
				return { value: row };
			}
			if (row && typeof row === "object" && !Array.isArray(row)) {
				return row;
			}
			return { value: row };
		});

		setRawRows(normalizedRows);
		setColumnMappings(getDefaultMappings(normalizedRows));
	};

	const handleFileChange = (event) => {
		const selected = event.target.files?.[0];
		if (!selected) return;

		setFileName(selected.name);
		parseDataFile(selected);
	};

	const handleDrop = (event) => {
		event.preventDefault();
		const dropped = event.dataTransfer?.files?.[0];
		if (!dropped) return;

		setFileName(dropped.name);
		parseDataFile(dropped);
	};

	const handleDragOver = (event) => {
		event.preventDefault();
	};

	const handleSubmit = async () => {
		const validRows = previewRows.filter((row) => row.isValid).map((row) => row.original);
		const invalidRows = previewRows.filter((row) => !row.isValid);

		if (!validRows.length) {
			setParseError("No valid rows ready to import.");
			return;
		}

		setLoading(true);
		try {
			const response = await importData(validRows);
			const inserted = response?.success ? (response.insertedCount ?? validRows.length) : validRows.length;
			const serverErrors = response?.errors || [];
			const skipped = invalidRows.length + serverErrors.length;
			const nextSummary = {
				inserted,
				skipped,
				errors: [...invalidRows.map((row) => ({ index: row.index, message: normalizeErrorList(row.errors) })), ...serverErrors],
			};

			setSummary(nextSummary);
			const nextHistory = [
				{
					id: `import-${Date.now()}`,
					fileName,
					inserted: nextSummary.inserted,
					skipped: nextSummary.skipped,
					timestamp: new Date().toISOString(),
				},
				...history,
			];
			setHistory(nextHistory);
			writeImportHistory(nextHistory);
			success(`Imported ${nextSummary.inserted} rows successfully.`);
		} catch (submitError) {
			const nextSummary = {
				inserted: validRows.length,
				skipped: invalidRows.length + 1,
				errors: [
					...invalidRows.map((row) => ({ index: row.index, message: normalizeErrorList(row.errors) })),
					{ index: validRows.length, message: submitError?.message || "Import failed." },
				],
			};

			setSummary(nextSummary);
			const nextHistory = [
				{
					id: `import-${Date.now()}`,
					fileName,
					inserted: nextSummary.inserted,
					skipped: nextSummary.skipped,
					timestamp: new Date().toISOString(),
				},
				...history,
			];
			setHistory(nextHistory);
			writeImportHistory(nextHistory);
			setParseError(submitError?.message || "Import failed.");
		} finally {
			setLoading(false);
		}
	};

	const validCount = previewRows.filter((row) => row.isValid).length;

	return (
		<Box data-testid="import-page" sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom color="white.main">
				{t("import.title")}
			</Typography>

			<Paper sx={{ p: 3, mb: 2, cursor: "pointer" }} onClick={triggerFileInput} onDrop={handleDrop} onDragOver={handleDragOver} data-testid="import-dropzone">
				<Typography sx={{ fontWeight: 700 }} color="white.main">
					{t("import.dropzone.title")}
				</Typography>
				<Typography color="white.main" sx={{ mt: 1 }}>
					{t("import.dropzone.subtitle")}
				</Typography>
				<Typography data-testid="import-file-name" color="white.main" sx={{ mt: 1, fontStyle: "italic" }}>
					{fileName || t("import.noFile")}
				</Typography>
				<input
					ref={fileInputRef}
					data-testid="import-file-input"
					type="file"
					accept=".csv,.json"
					hidden
					onChange={handleFileChange}
				/>
			</Paper>

			{Object.keys(columnMappings).length > 0 && (
				<Paper data-testid="import-column-mapper" sx={{ p: 3, mb: 2, backgroundColor: "rgba(255,255,255,0.06)" }}>
					<Typography variant="h6" color="white.main" gutterBottom>
						Column Mapper
					</Typography>
					<Grid container spacing={2}>
						{Object.keys(columnMappings).map((column) => (
							<Grid item xs={12} md={6} key={column}>
								<Typography color="white.main" sx={{ mb: 1 }}>
									{column}
								</Typography>
								<Dropdown
									width="100%"
									height="44px"
									background="greyDark"
									items={mappableFields}
									value={columnMappings[column]}
									onChange={(event) => setColumnMappings((current) => ({ ...current, [column]: event.target.value }))}
									testId={`import-column-mapper-${column}`}
								/>
							</Grid>
						))}
					</Grid>
				</Paper>
			)}

			{parseError && (
				<Alert severity="error" sx={{ mb: 2 }} data-testid="import-error-message">
					{parseError}
				</Alert>
			)}

			{previewRows.length > 0 && (
				<TableContainer component={Paper} sx={{ mb: 2 }} data-testid="import-preview-table">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell component="th" sx={{ color: "white.main" }}>
									#
								</TableCell>
								{columns.map((column) => (
									<TableCell key={column} component="th" sx={{ color: "white.main" }}>
										{column}
									</TableCell>
								))}
								<TableCell component="th" sx={{ color: "white.main" }}>
									Status
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{previewRows.map((previewRow, index) => (
								<TableRow
									key={index}
									data-testid={`import-preview-row-${index}`}
									sx={{ backgroundColor: previewRow.isValid ? "transparent" : "rgba(211, 47, 47, 0.12)" }}
								>
									<TableCell sx={{ color: "white.main" }}>{index + 1}</TableCell>
									{columns.map((column) => (
										<TableCell key={column} sx={{ color: "white.main" }}>
											{renderCellValue(previewRow.original[column])}
										</TableCell>
									))}
									<TableCell sx={{ color: previewRow.isValid ? "#00e676" : "#ff8a80" }}>
										{previewRow.isValid ? "Valid" : normalizeErrorList(previewRow.errors)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Grid container spacing={2} sx={{ mb: 2 }}>
				<Grid item>
					<Button
						variant="contained"
						color="primary"
						data-testid="import-commit-button"
						onClick={handleSubmit}
						disabled={loading || validCount === 0}
					>
						{t("import.submit")}
					</Button>
				</Grid>
				<Grid item>
					<Button
						variant="outlined"
						color="primary"
						data-testid="import-cancel"
						onClick={resetPage}
					>
						{t("import.reset")}
					</Button>
				</Grid>
			</Grid>

			{summary && (
				<Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.04)", mb: 2 }} data-testid="import-summary">
					<Typography variant="h6" color="white.main" gutterBottom>
						Import Summary
					</Typography>
					<Typography data-testid="import-summary-success-count" color="white.main">
						Rows imported: {summary.inserted}
					</Typography>
					<Typography data-testid="import-summary-error-count" color="white.main">
						Rows skipped/errors: {summary.skipped}
					</Typography>
					{summary.errors?.length > 0 && (
						<Alert severity="warning" sx={{ mt: 1 }}>
							{summary.errors.map((item, idx) => (
								<div key={idx}>{`Row ${Number(item.index) + 1}: ${item.message}`}</div>
							))}
						</Alert>
					)}
				</Paper>
			)}

			<Paper data-testid="import-history" sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.04)" }}>
				<Typography variant="h6" color="white.main" gutterBottom>
					Import History
				</Typography>
				{history.length > 0 ? history.map((entry, index) => (
					<Box
						key={entry.id}
						data-testid={`import-history-entry-${index}`}
						sx={{ p: 2, mb: index === history.length - 1 ? 0 : 1, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.06)" }}
					>
						<Typography color="white.main" fontWeight="bold">
							{entry.fileName || "Imported data"}
						</Typography>
						<Typography color="white.main" sx={{ opacity: 0.8 }}>
							{`${dayjs(entry.timestamp).format("DD/MM/YYYY HH:mm")} • Imported: ${entry.inserted} • Skipped: ${entry.skipped}`}
						</Typography>
					</Box>
				)) : (
					<Typography color="white.main" sx={{ opacity: 0.8 }}>
						No import history yet.
					</Typography>
				)}
			</Paper>
		</Box>
	);
};

export default Import;
