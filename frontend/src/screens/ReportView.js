import { useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, GlobalStyles, Grid, Paper, Typography } from "@mui/material";

import Plot from "../components/Plot.js";
import { dayjs } from "../utils/index.js";
import { getReportChartDefinition, readReports } from "../utils/reports.js";
import logo from "../assets/images/isselLogo.png";

const sectionSurface = {
	p: 3,
	mb: 3,
	border: "1px solid #dde3ea",
	borderRadius: "12px",
	backgroundColor: "#ffffff",
	breakInside: "avoid",
	boxShadow: "none",
};

const metricCardStyle = {
	p: 2.25,
	height: "100%",
	borderRadius: "10px",
	backgroundColor: "#f8fafc",
	border: "1px solid #e5e7eb",
	boxShadow: "none",
};

const printableStyles = {
	"@page": {
		size: "A4",
		margin: "14mm 12mm",
	},
	"@media print": {
		"html, body, #root, main": {
			height: "auto !important",
			overflow: "visible !important",
			background: "#ffffff !important",
		},
		"body.report-print-mode": {
			background: "#ffffff !important",
			"-webkit-print-color-adjust": "exact",
			printColorAdjust: "exact",
		},
		"#header, #footer": {
			display: "none !important",
		},
		"[data-testid='app-sidebar']": {
			display: "none !important",
		},
		"[data-layout='protected-main']": {
			position: "static !important",
			height: "auto !important",
			width: "100% !important",
			background: "#ffffff !important",
		},
		"[data-layout='protected-content']": {
			position: "static !important",
			display: "block !important",
			height: "auto !important",
			width: "100% !important",
			margin: "0 !important",
			padding: "0 !important",
			overflow: "visible !important",
		},
		"[data-testid='report-view-print']": {
			display: "none !important",
		},
		"#report-print-root": {
			position: "static !important",
			width: "auto !important",
			maxWidth: "190mm",
			margin: "0 auto",
		},
		"[data-testid='report-view-page']": {
			padding: "0 !important",
			width: "100% !important",
		},
		"#report-print-root .MuiPaper-root": {
			boxShadow: "none !important",
		},
		".js-plotly-plot, .plot-container, .svg-container": {
			width: "100% !important",
			maxWidth: "100% !important",
		},
		".main-svg": {
			maxWidth: "100% !important",
		},
	},
};

const formatMetricValue = (value) => {
	if (!Number.isFinite(value)) return "-";
	return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const getPlotSeriesValues = (series) => {
	if (!series?.y || !Array.isArray(series.y)) return [];
	return series.y.filter((value) => typeof value === "number" && Number.isFinite(value));
};

const summarizePlotData = (plotData = []) => {
	const values = plotData.flatMap((series) => getPlotSeriesValues(series));
	if (!values.length) {
		return [
			{ label: "Average", value: "-" },
			{ label: "Peak", value: "-" },
			{ label: "Data Points", value: "0" },
		];
	}

	const average = values.reduce((sum, value) => sum + value, 0) / values.length;
	const peak = Math.max(...values);

	return [
		{ label: "Average", value: formatMetricValue(average) },
		{ label: "Peak", value: formatMetricValue(peak) },
		{ label: "Data Points", value: String(values.length) },
	];
};

const ReportMetaCard = ({ label, value }) => (
	<Paper sx={metricCardStyle}>
		<Typography sx={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280" }}>
			{label}
		</Typography>
		<Typography sx={{ mt: 1, fontSize: 20, fontWeight: 700, color: "#111827" }}>
			{value}
		</Typography>
	</Paper>
);

const ReportStatCard = ({ label, value }) => (
	<Paper sx={metricCardStyle}>
		<Typography sx={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280" }}>
			{label}
		</Typography>
		<Typography sx={{ mt: 1, fontSize: 24, fontWeight: 700, color: "#111827" }}>
			{value}
		</Typography>
	</Paper>
);

const ReportChartSection = ({ chartId, index }) => {
	const chart = getReportChartDefinition(chartId);

	if (chart.type === "kpis") {
		return (
			<Paper sx={sectionSurface}>
				<Box sx={{ mb: 2.5 }}>
					<Box>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
							Section {String(index).padStart(2, "0")}
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5, color: "#0f172a" }}>{chart.title}</Typography>
					</Box>
				</Box>

				<Typography sx={{ mb: 2.5, color: "#4b5563", lineHeight: 1.7 }}>
					{chart.description}
				</Typography>

				<Grid container spacing={2}>
					{chart.items.map((item) => (
						<Grid item xs={12} md={4} key={item.label}>
							<Paper sx={metricCardStyle}>
								<Typography sx={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280" }}>
									{item.label}
								</Typography>
								<Typography sx={{ my: 1.5, fontSize: 34, lineHeight: 1.1, fontWeight: 800, color: "#0f172a" }}>
									{item.value}
								</Typography>
								<Typography sx={{ color: "#20643b", fontWeight: 700 }}>
									{item.delta}
								</Typography>
							</Paper>
						</Grid>
					))}
				</Grid>
			</Paper>
		);
	}

	if (chart.type === "plot") {
		const summary = summarizePlotData(chart.plot.data);

		return (
			<Paper sx={{ ...sectionSurface, "@media print": { breakInside: "avoid", pageBreakInside: "avoid" } }}>
				<Box sx={{ mb: 2.5 }}>
					<Box>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
							Section {String(index).padStart(2, "0")}
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5, color: "#0f172a" }}>{chart.title}</Typography>
					</Box>
				</Box>

				<Typography sx={{ mb: 2.5, color: "#4b5563", lineHeight: 1.7 }}>
					{chart.description}
				</Typography>

				<Grid container spacing={2} sx={{ mb: 2.5 }}>
					{summary.map((item) => (
						<Grid item xs={12} md={4} key={item.label}>
							<ReportStatCard label={item.label} value={item.value} />
						</Grid>
					))}
				</Grid>

				<Box sx={{ p: 1.5, borderRadius: "10px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
					<Plot
						data={chart.plot.data}
						title={chart.title}
						titleColor="#111111"
						showLegend={chart.plot.data.length > 1}
						displayBar={false}
						height="320px"
						background="#ffffff"
						marginBottom={60}
					/>
				</Box>
			</Paper>
		);
	}

	return (
		<Paper sx={sectionSurface}>
			<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
				Section {String(index).padStart(2, "0")}
			</Typography>
			<Typography variant="h5" sx={{ mt: 0.5, mb: 1.5, color: "#0f172a" }}>{chart.title}</Typography>
			<Typography sx={{ color: "#4b5563", lineHeight: 1.7 }}>{chart.description}</Typography>
		</Paper>
	);
};

const ReportView = () => {
	const { id } = useParams();
	const report = useMemo(() => readReports().find((item) => item.id === id), [id]);
	const selectedCharts = useMemo(
		() => (report?.charts || []).map((chartId) => getReportChartDefinition(chartId)),
		[report],
	);
	const dateRangeLabel = report ? `${report.dateFrom} to ${report.dateTo}` : "";
	const commentaryText = report?.commentary?.trim() || "No commentary provided.";

	useEffect(() => {
		const clearPrintMode = () => {
			document.body.classList.remove("report-print-mode");
		};

		window.addEventListener("afterprint", clearPrintMode);

		return () => {
			window.removeEventListener("afterprint", clearPrintMode);
			clearPrintMode();
		};
	}, []);

	const handlePrint = useCallback(() => {
		document.body.classList.add("report-print-mode");

		window.setTimeout(() => {
			window.print();
		}, 150);
	}, []);

	if (!report) {
		return (
			<Box data-testid="report-view-page" sx={{ p: 3, width: "100%" }}>
				<Paper sx={{ p: 3 }}>
					<Typography variant="h5">Report not found</Typography>
				</Paper>
			</Box>
		);
	}

	return (
		<Box data-testid="report-view-page" sx={{ p: 3, width: "100%" }}>
			<GlobalStyles styles={printableStyles} />
			<Box id="report-print-root" sx={{ maxWidth: 980, mx: "auto" }}>
				<Paper
					sx={{
						p: { xs: 2.5, md: 4 },
						borderRadius: "16px",
						backgroundColor: "#ffffff",
						color: "#111111",
						boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
						"@media print": {
							p: 0,
							borderRadius: 0,
							boxShadow: "none",
						},
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: { xs: "flex-start", md: "center" },
							flexDirection: { xs: "column", md: "row" },
							gap: 2,
							mb: 4,
							pb: 2.5,
							borderBottom: "1px solid #e5e7eb",
						}}
					>
						<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
							<Box
								component="img"
								src={logo}
								alt="ISSEL"
								sx={{ width: 64, height: 64, objectFit: "contain" }}
							/>
							<Box>
								<Typography sx={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b7280" }}>
									Business Report
								</Typography>
								<Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800, color: "#0f172a" }}>
									{report.title}
								</Typography>
								<Typography sx={{ mt: 0.5, color: "#4b5563" }}>
									Prepared on {dayjs(report.createdAt).format("D MMMM YYYY, HH:mm")}
								</Typography>
							</Box>
						</Box>

						<Button
							data-testid="report-view-print"
							variant="contained"
							color="secondary"
							onClick={handlePrint}
							sx={{
								alignSelf: { xs: "stretch", md: "center" },
								px: 3,
								py: 1,
								borderRadius: "8px",
								fontWeight: 700,
								"@media print": { display: "none" },
							}}
						>
							Print
						</Button>
					</Box>

					<Box
						sx={{
							mb: 4,
							p: { xs: 2.5, md: 3 },
							borderRadius: "12px",
							backgroundColor: "#f8fafc",
							border: "1px solid #e5e7eb",
							color: "#111111",
							breakInside: "avoid",
						}}
					>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b7280" }}>
							Executive Summary
						</Typography>
						<Typography variant="h5" sx={{ mt: 1.25, maxWidth: 760, lineHeight: 1.35, fontWeight: 700, color: "#0f172a" }}>
							A concise summary of the selected reporting window, aligned for presentation, sharing, and print export.
						</Typography>
						<Typography sx={{ mt: 2, maxWidth: 860, lineHeight: 1.8, color: "#374151" }}>
							{commentaryText}
						</Typography>
					</Box>

					<Grid container spacing={2} sx={{ mb: 4 }}>
						<Grid item xs={12} md={4}>
							<ReportMetaCard label="Reporting Window" value={dateRangeLabel} />
						</Grid>
						<Grid item xs={12} md={4}>
							<ReportMetaCard label="Included Charts" value={String(selectedCharts.length).padStart(2, "0")} />
						</Grid>
						<Grid item xs={12} md={4}>
							<ReportMetaCard label="Document ID" value={report.id.replace("report-", "RPT-").slice(0, 18).toUpperCase()} />
						</Grid>
					</Grid>

					<Paper sx={{ ...sectionSurface, backgroundColor: "#ffffff" }}>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
							Included Content
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5, mb: 2.5, color: "#0f172a" }}>
							Selected Charts
						</Typography>
						<Grid container spacing={1.5}>
							{selectedCharts.map((chart, index) => (
								<Grid item xs={12} md={6} key={chart.id}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1.5,
											p: 1.5,
											borderRadius: "10px",
											border: "1px solid #e5e7eb",
											backgroundColor: "#f8fafc",
										}}
									>
										<Box
											sx={{
												width: 28,
												height: 28,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												borderRadius: "50%",
												backgroundColor: "#e8eef5",
												color: "#334155",
												fontSize: 13,
												fontWeight: 700,
											}}
										>
											{index + 1}
										</Box>
										<Typography sx={{ color: "#0f172a", fontWeight: 600 }}>
											{chart.title}
										</Typography>
									</Box>
								</Grid>
							))}
						</Grid>
					</Paper>

					<Box sx={{ mb: 4 }}>
						{report.charts.map((chartId, index) => (
							<ReportChartSection key={chartId} chartId={chartId} index={index + 1} />
						))}
					</Box>

					<Paper sx={{ ...sectionSurface, mb: 0, backgroundColor: "#ffffff" }}>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
							Narrative
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5, mb: 2, color: "#0f172a" }}>
							Analyst Commentary
						</Typography>
						<Typography sx={{ color: "#374151", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
							{commentaryText}
						</Typography>
					</Paper>

					<Box
						sx={{
							mt: 3,
							pt: 2.5,
							borderTop: "1px solid #e5e7eb",
							display: "flex",
							justifyContent: "space-between",
							alignItems: { xs: "flex-start", md: "center" },
							flexDirection: { xs: "column", md: "row" },
							gap: 1,
							color: "#6b7280",
							fontSize: 12,
							breakInside: "avoid",
						}}
					>
						<Typography sx={{ fontSize: 12 }}>
							Prepared for presentation and print distribution.
						</Typography>
						<Typography sx={{ fontSize: 12 }}>
							Generated {dayjs(report.createdAt).format("DD/MM/YYYY")} | Confidential business reporting
						</Typography>
					</Box>
				</Paper>
			</Box>
		</Box>
	);
};

export default ReportView;
