import { useMemo, useRef, useState } from "react";
import {
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
    Alert,
} from "@mui/material";

import { importData } from "../api/index.js";
import { useSnackbar } from "../utils/index.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return errors.join(" \u2022 ");
};

const validateRow = (row, index) => {
    const errors = [];

    if (row === null || row === undefined || typeof row !== "object" || Array.isArray(row)) {
        errors.push("Row must be an object.");
        return { original: row, isValid: false, errors };
    }

    const keys = Object.keys(row);
    const nonEmptyKeys = keys.filter((key) => hasValue(row[key]));
    if (!nonEmptyKeys.length) {
        errors.push("Row has no values.");
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

const buildPreviewRows = (rows) => {
    return rows.map((row, index) => validateRow(row, index));
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

const Import = () => {
    const [fileName, setFileName] = useState("");
    const [previewRows, setPreviewRows] = useState([]);
    const [parseError, setParseError] = useState("");
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const { success, error } = useSnackbar();

    const columns = useMemo(() => getPreviewColumns(previewRows), [previewRows]);

    const resetPage = () => {
        setFileName("");
        setPreviewRows([]);
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
            setPreviewRows([]);
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

        setPreviewRows(buildPreviewRows(normalizedRows));
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
        if (!validRows.length) {
            setParseError("No valid rows ready to import.");
            return;
        }

        setLoading(true);
        try {
            const response = await importData(validRows);
            if (response?.success) {
                setSummary({ inserted: response.insertedCount || 0, skipped: response.errors?.length || 0, errors: response.errors || [] });
                success(`Imported ${response.insertedCount || 0} rows successfully.`);
            } else {
                setParseError(response?.message || "Import failed.");
            }
        } catch (submitError) {
            setParseError(submitError?.message || "Import failed.");
        } finally {
            setLoading(false);
        }
    };

    const validCount = previewRows.filter((row) => row.isValid).length;

    return (
        <Box data-testid="import-page" sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom color="white.main">
                Import Data
            </Typography>

            <Paper sx={{ p: 3, mb: 2, cursor: "pointer" }} onClick={triggerFileInput} onDrop={handleDrop} onDragOver={handleDragOver} data-testid="import-dropzone">
                <Typography sx={{ fontWeight: 700 }} color="white.main">
                    Drag and drop a CSV or JSON file here
                </Typography>
                <Typography color="white.main" sx={{ mt: 1 }}>
                    Or click to choose a file.
                </Typography>
                <Typography data-testid="import-file-name" color="white.main" sx={{ mt: 1, fontStyle: "italic" }}>
                    {fileName || "No file selected"}
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
                                    sx={{
                                        backgroundColor: previewRow.isValid ? "transparent" : "rgba(211, 47, 47, 0.12)",
                                    }}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column} sx={{ color: "white.main" }}>
                                            {renderCellValue(previewRow.original[column])}
                                        </TableCell>
                                    ))}
                                    <TableCell sx={{ color: previewRow.isValid ? "#00e676" : "#ff8a80" }}>
                                        {previewRow.isValid ? "Valid" : normalizeErrorList(previewRow.errors)}
                                    </TableCell>
                                    {!previewRow.isValid && (
                                        <TableCell sx={{ display: "none" }} data-testid={`import-error-row-${index}`} />
                                    )}
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
                        Import
                    </Button>
                </Grid>
                <Grid item>
                    <Button
                        variant="outlined"
                        color="primary"
                        data-testid="import-cancel"
                        onClick={resetPage}
                    >
                        Reset
                    </Button>
                </Grid>
            </Grid>

            {summary && (
                <Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.04)" }} data-testid="import-summary">
                    <Typography variant="h6" color="white.main" gutterBottom>
                        Import Summary
                    </Typography>
                    <Typography color="white.main">Rows imported: {summary.inserted}</Typography>
                    <Typography color="white.main">Rows skipped: {summary.skipped}</Typography>
                    {summary.errors?.length > 0 && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            {summary.errors.map((item, idx) => (
                                <div key={idx}>{`Row ${item.index + 1}: ${item.message}`}</div>
                            ))}
                        </Alert>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default Import;
