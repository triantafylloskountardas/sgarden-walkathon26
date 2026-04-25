import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	Grid,
	List,
	ListItem,
	ListItemText,
	Paper,
	TextField,
	Typography,
} from "@mui/material";

import { dayjs } from "../utils/index.js";
import { getReportChartDefinition, readReports, reportChartOptions, writeReports } from "../utils/reports.js";

const createReportId = () => `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const initialWizardState = {
	title: "",
	dateFrom: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
	dateTo: dayjs().format("YYYY-MM-DD"),
	commentary: "",
	charts: [reportChartOptions[0].id],
};

const Reports = () => {
	const navigate = useNavigate();
	const [reports, setReports] = useState(() => readReports());
	const [wizardOpen, setWizardOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [wizardState, setWizardState] = useState(initialWizardState);

	const reportsSorted = useMemo(
		() => [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
		[reports],
	);
	const selectedChartTitles = wizardState.charts.map((chartId) => getReportChartDefinition(chartId).title);

	const persistReports = (nextReports) => {
		setReports(nextReports);
		writeReports(nextReports);
	};

	const resetWizard = () => {
		setWizardState(initialWizardState);
		setPreviewOpen(false);
		setWizardOpen(false);
	};

	const toggleChartSelection = (chartId) => {
		setWizardState((current) => {
			const exists = current.charts.includes(chartId);
			return {
				...current,
				charts: exists
					? current.charts.filter((chart) => chart !== chartId)
					: [...current.charts, chartId],
			};
		});
	};

	const handleSaveReport = () => {
		const report = {
			id: createReportId(),
			title: wizardState.title.trim() || `Report ${reports.length + 1}`,
			dateFrom: wizardState.dateFrom,
			dateTo: wizardState.dateTo,
			commentary: wizardState.commentary.trim(),
			charts: wizardState.charts,
			createdAt: new Date().toISOString(),
		};

		const nextReports = [...reports, report];
		persistReports(nextReports);
		resetWizard();
		navigate(`/reports/${report.id}`);
	};

	const handleDeleteReport = (reportId) => {
		persistReports(reports.filter((report) => report.id !== reportId));
	};

	return (
		<Box data-testid="reports-page" sx={{ p: 3, width: "100%" }}>
			<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
				<Grid item>
					<Typography variant="h4" color="white.main">
						Reports
					</Typography>
					<Typography color="white.main" sx={{ opacity: 0.8 }}>
						Build print-friendly static reports from your dashboards.
					</Typography>
				</Grid>
				<Grid item>
					<Button
						data-testid="reports-create-button"
						variant="contained"
						color="secondary"
						onClick={() => setWizardOpen(true)}
					>
						New Report
					</Button>
				</Grid>
			</Grid>

			<Paper sx={{ p: 2, mb: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
				<Box data-testid="reports-list">
					{reportsSorted.length === 0 ? (
						<Box data-testid="reports-empty">
							<Typography color="white.main" fontWeight="bold">
								No saved reports yet.
							</Typography>
							<Typography color="white.main" sx={{ opacity: 0.8 }}>
								Create a report to capture charts, commentary, and a reusable date range.
							</Typography>
						</Box>
					) : (
						<List>
							{reportsSorted.map((report) => (
								<ListItem
									key={report.id}
									data-testid={`reports-item-${report.id}`}
									secondaryAction={(
										<Box sx={{ display: "flex", gap: 1 }}>
											<Button
												data-testid={`reports-item-view-${report.id}`}
												component={RouterLink}
												to={`/reports/${report.id}`}
												variant="contained"
												color="secondary"
												size="small"
											>
												View
											</Button>
											<Button
												data-testid={`reports-item-delete-${report.id}`}
												variant="outlined"
												color="error"
												size="small"
												onClick={() => handleDeleteReport(report.id)}
											>
												Delete
											</Button>
										</Box>
									)}
									sx={{ pr: 20 }}
								>
									<ListItemText
										primary={(
											<Typography data-testid={`reports-item-title-${report.id}`} color="white.main" fontWeight="bold">
												{report.title}
											</Typography>
										)}
										secondary={(
											<Typography data-testid={`reports-item-date-${report.id}`} color="white.main" sx={{ opacity: 0.8 }}>
												{dayjs(report.createdAt).format("LLL")}
											</Typography>
										)}
									/>
								</ListItem>
							))}
						</List>
					)}
				</Box>
			</Paper>

			{wizardOpen && (
				<Paper data-testid="report-wizard" sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Typography variant="h5" color="white.main">
								Report Builder
							</Typography>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Report title"
								value={wizardState.title}
								onChange={(event) => setWizardState((current) => ({ ...current, title: event.target.value }))}
								inputProps={{ "data-testid": "report-wizard-title" }}
								variant="outlined"
								color="secondary"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="From"
								type="date"
								value={wizardState.dateFrom}
								onChange={(event) => setWizardState((current) => ({ ...current, dateFrom: event.target.value }))}
								inputProps={{ "data-testid": "report-wizard-date-from" }}
								InputLabelProps={{ shrink: true }}
								variant="outlined"
								color="secondary"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="To"
								type="date"
								value={wizardState.dateTo}
								onChange={(event) => setWizardState((current) => ({ ...current, dateTo: event.target.value }))}
								inputProps={{ "data-testid": "report-wizard-date-to" }}
								InputLabelProps={{ shrink: true }}
								variant="outlined"
								color="secondary"
							/>
						</Grid>
						<Grid item xs={12}>
							<Paper data-testid="report-wizard-chart-select" sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.04)" }}>
								<Typography color="white.main" fontWeight="bold" sx={{ mb: 1 }}>
									Select charts
								</Typography>
								<Grid container>
									{reportChartOptions.map((chart) => (
										<Grid item xs={12} md={6} key={chart.id}>
											<FormControlLabel
												control={(
													<Checkbox
														checked={wizardState.charts.includes(chart.id)}
														onChange={() => toggleChartSelection(chart.id)}
														inputProps={{ "data-testid": `report-wizard-chart-option-${chart.id}` }}
														color="secondary"
													/>
												)}
												label={chart.label}
												sx={{ color: "white.main" }}
											/>
										</Grid>
									))}
								</Grid>
							</Paper>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Commentary"
								multiline
								minRows={4}
								value={wizardState.commentary}
								onChange={(event) => setWizardState((current) => ({ ...current, commentary: event.target.value }))}
								inputProps={{ "data-testid": "report-wizard-commentary" }}
								variant="outlined"
								color="secondary"
							/>
						</Grid>
						<Grid item xs={12} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
							<Button
								data-testid="report-wizard-preview"
								variant="outlined"
								color="secondary"
								onClick={() => setPreviewOpen(true)}
							>
								Preview
							</Button>
							<Button
								data-testid="report-wizard-save"
								variant="contained"
								color="secondary"
								onClick={handleSaveReport}
							>
								Save Report
							</Button>
							<Button
								data-testid="report-wizard-cancel"
								variant="text"
								color="inherit"
								onClick={resetWizard}
							>
								Cancel
							</Button>
						</Grid>

						{previewOpen && (
							<Grid item xs={12}>
								<Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.04)" }}>
									<Typography color="white.main" fontWeight="bold" sx={{ mb: 1 }}>
										Preview
									</Typography>
									<Typography color="white.main">Title: {wizardState.title || "Untitled report"}</Typography>
									<Typography color="white.main">Range: {wizardState.dateFrom} to {wizardState.dateTo}</Typography>
									<Typography color="white.main">Charts: {selectedChartTitles.join(", ") || "None selected"}</Typography>
									<Typography color="white.main">Commentary: {wizardState.commentary || "No commentary added yet."}</Typography>
								</Paper>
							</Grid>
						)}
					</Grid>
				</Paper>
			)}
		</Box>
	);
};

export default Reports;
