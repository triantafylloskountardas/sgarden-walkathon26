import { useMemo, useState } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
	TextField,
	Typography,
} from "@mui/material";

import Dropdown from "../components/Dropdown.js";
import { useSnackbar } from "../utils/index.js";
import {
	createSalesRecordId,
	readSalesRecords,
	salesRecordCategories,
	salesRecordMonths,
	salesRecordUnits,
	writeSalesRecords,
} from "../utils/sales-records.js";

const initialFormState = {
	category: "Software",
	month: "January",
	year: new Date().getFullYear(),
	value: "",
	unit: "EUR",
	notes: "",
};

const columns = [
	{ id: "category", label: "Category" },
	{ id: "month", label: "Month" },
	{ id: "year", label: "Year" },
	{ id: "value", label: "Value" },
	{ id: "unit", label: "Unit" },
	{ id: "notes", label: "Notes" },
];

const normalizeFormValues = (formState) => ({
	...formState,
	year: Number(formState.year),
	value: Number(formState.value),
});

const sortRecords = (records, sortBy, sortDirection) => {
	const direction = sortDirection === "asc" ? 1 : -1;
	return [...records].sort((left, right) => {
		const leftValue = left[sortBy];
		const rightValue = right[sortBy];

		if (typeof leftValue === "number" && typeof rightValue === "number") {
			return (leftValue - rightValue) * direction;
		}

		return String(leftValue).localeCompare(String(rightValue)) * direction;
	});
};

const SalesDataManage = () => {
	const [records, setRecords] = useState(() => readSalesRecords());
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [sortBy, setSortBy] = useState("year");
	const [sortDirection, setSortDirection] = useState("desc");
	const [formOpen, setFormOpen] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [formState, setFormState] = useState(initialFormState);
	const [formError, setFormError] = useState("");
	const [deleteTarget, setDeleteTarget] = useState(null);
	const { success, error } = useSnackbar();

	const sortedRecords = useMemo(() => sortRecords(records, sortBy, sortDirection), [records, sortBy, sortDirection]);
	const pagedRecords = useMemo(
		() => sortedRecords.slice(page * rowsPerPage, (page * rowsPerPage) + rowsPerPage),
		[page, rowsPerPage, sortedRecords],
	);

	const persistRecords = (nextRecords) => {
		const nextLastPage = Math.max(0, Math.ceil(nextRecords.length / rowsPerPage) - 1);
		setPage((currentPage) => Math.min(currentPage, nextLastPage));
		setRecords(nextRecords);
		writeSalesRecords(nextRecords);
	};

	const resetForm = () => {
		setFormState(initialFormState);
		setEditingId(null);
		setFormError("");
	};

	const openAddForm = () => {
		resetForm();
		setFormOpen(true);
	};

	const openEditForm = (record) => {
		setEditingId(record.id);
		setFormState({
			category: record.category,
			month: record.month,
			year: record.year,
			value: record.value,
			unit: record.unit,
			notes: record.notes || "",
		});
		setFormError("");
		setFormOpen(true);
	};

	const closeForm = () => {
		setFormOpen(false);
		resetForm();
	};

	const handleFieldChange = (field, value) => {
		setFormState((current) => ({ ...current, [field]: value }));
	};

	const handleSort = (columnId) => {
		if (sortBy === columnId) {
			setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
			return;
		}

		setSortBy(columnId);
		setSortDirection("asc");
	};

	const validateForm = () => {
		const year = Number(formState.year);
		const value = Number(formState.value);

		if (!formState.category || !formState.month || !formState.unit) {
			return "Category, month, and unit are required.";
		}

		if (!Number.isInteger(year) || year < 2000 || year > 2100) {
			return "Year must be a valid four-digit number.";
		}

		if (!Number.isFinite(value)) {
			return "Value must be numeric.";
		}

		return "";
	};

	const handleSubmit = () => {
		const nextError = validateForm();
		if (nextError) {
			setFormError(nextError);
			error(nextError);
			return;
		}

		const normalized = normalizeFormValues(formState);
		const nextRecords = editingId
			? records.map((record) => (record.id === editingId ? { ...record, ...normalized } : record))
			: [...records, { id: createSalesRecordId(), ...normalized }];

		persistRecords(nextRecords);
		closeForm();
		success(editingId ? "Sales record updated." : "Sales record created.");
	};

	const handleDeleteConfirm = () => {
		if (!deleteTarget) return;

		const nextRecords = records.filter((record) => record.id !== deleteTarget.id);
		persistRecords(nextRecords);
		setDeleteTarget(null);
		success("Sales record removed.");
	};

	const handleDeleteCancel = () => setDeleteTarget(null);

	return (
		<Box data-testid="sales-data-page" sx={{ p: 3, width: "100%" }}>
			<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
				<Grid item>
					<Typography variant="h4" color="white.main">
						Sales Records
					</Typography>
					<Typography color="white.main" sx={{ opacity: 0.8 }}>
						Manage persisted sales entries with sorting, pagination, and validation.
					</Typography>
				</Grid>
				<Grid item>
					<Button data-testid="sales-data-add-button" variant="contained" color="secondary" onClick={openAddForm}>
						Add Record
					</Button>
				</Grid>
			</Grid>

			<TableContainer component={Paper} data-testid="sales-data-table" sx={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
				<Table>
					<TableHead>
						<TableRow>
							{columns.map((column) => (
								<TableCell key={column.id}>
									<TableSortLabel
										active={sortBy === column.id}
										direction={sortBy === column.id ? sortDirection : "asc"}
										onClick={() => handleSort(column.id)}
									>
										{column.label}
									</TableSortLabel>
								</TableCell>
							))}
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{pagedRecords.length > 0
							? pagedRecords.map((record) => (
								<TableRow key={record.id} data-testid={`sales-data-row-${record.id}`}>
									<TableCell>{record.category}</TableCell>
									<TableCell>{record.month}</TableCell>
									<TableCell>{record.year}</TableCell>
									<TableCell>{record.value}</TableCell>
									<TableCell>{record.unit}</TableCell>
									<TableCell>{record.notes || "-"}</TableCell>
									<TableCell>
										<Box display="flex" gap={1} flexWrap="wrap">
											<Button
												data-testid={`sales-data-edit-${record.id}`}
												size="small"
												variant="outlined"
												color="secondary"
												onClick={() => openEditForm(record)}
											>
												Edit
											</Button>
											<Button
												data-testid={`sales-data-delete-${record.id}`}
												size="small"
												variant="outlined"
												color="error"
												onClick={() => setDeleteTarget(record)}
											>
												Delete
											</Button>
										</Box>
									</TableCell>
								</TableRow>
							))
							: (
								<TableRow>
									<TableCell colSpan={7}>
										<Box data-testid="sales-data-empty" py={3}>
											<Typography align="center">No sales records available yet.</Typography>
										</Box>
									</TableCell>
								</TableRow>
							)}
					</TableBody>
				</Table>
			</TableContainer>

			<Box data-testid="sales-data-pagination" sx={{ display: "flex", justifyContent: "flex-end" }}>
				<TablePagination
					component="div"
					count={records.length}
					page={page}
					onPageChange={(_event, nextPage) => setPage(nextPage)}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={(event) => {
						setRowsPerPage(Number(event.target.value));
						setPage(0);
					}}
					rowsPerPageOptions={[5, 10, 25]}
				/>
			</Box>

			<Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm">
				<DialogTitle>{editingId ? "Edit Sales Record" : "Add Sales Record"}</DialogTitle>
				<DialogContent dividers data-testid="sales-data-form">
					<Grid container spacing={2} sx={{ mt: 0.5 }}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" sx={{ mb: 1 }}>Category</Typography>
							<Dropdown
								width="100%"
								height="44px"
								background="greyDark"
								items={salesRecordCategories.map((category) => ({ value: category, text: category }))}
								value={formState.category}
								onChange={(event) => handleFieldChange("category", event.target.value)}
								testId="sales-data-field-category"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" sx={{ mb: 1 }}>Month</Typography>
							<Dropdown
								width="100%"
								height="44px"
								background="greyDark"
								items={salesRecordMonths.map((month) => ({ value: month, text: month }))}
								value={formState.month}
								onChange={(event) => handleFieldChange("month", event.target.value)}
								testId="sales-data-field-month"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Year"
								value={formState.year}
								onChange={(event) => handleFieldChange("year", event.target.value)}
								inputProps={{ "data-testid": "sales-data-field-year" }}
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="Value"
								value={formState.value}
								onChange={(event) => handleFieldChange("value", event.target.value)}
								inputProps={{ "data-testid": "sales-data-field-value", inputMode: "decimal" }}
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" sx={{ mb: 1 }}>Unit</Typography>
							<Dropdown
								width="100%"
								height="44px"
								background="greyDark"
								items={salesRecordUnits.map((unit) => ({ value: unit, text: unit }))}
								value={formState.unit}
								onChange={(event) => handleFieldChange("unit", event.target.value)}
								testId="sales-data-field-unit"
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Notes"
								multiline
								minRows={3}
								value={formState.notes}
								onChange={(event) => handleFieldChange("notes", event.target.value)}
								inputProps={{ "data-testid": "sales-data-field-notes" }}
							/>
						</Grid>
						{formError && (
							<Grid item xs={12}>
								<Typography color="error">{formError}</Typography>
							</Grid>
						)}
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button data-testid="sales-data-form-cancel" onClick={closeForm}>Cancel</Button>
					<Button data-testid="sales-data-form-submit" variant="contained" color="secondary" onClick={handleSubmit}>
						Save
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={Boolean(deleteTarget)} onClose={handleDeleteCancel}>
				<DialogTitle>Delete Sales Record</DialogTitle>
				<DialogContent dividers>
					<Typography>
						Are you sure you want to delete this sales record?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button data-testid="sales-data-delete-cancel" onClick={handleDeleteCancel}>
						Cancel
					</Button>
					<Button data-testid="sales-data-delete-confirm" color="error" variant="contained" onClick={handleDeleteConfirm}>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default SalesDataManage;
