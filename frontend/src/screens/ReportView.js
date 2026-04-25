import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, GlobalStyles, Grid, Paper, Typography } from "@mui/material";

import Plot from "../components/Plot.js";
import { dayjs } from "../utils/index.js";
import { getReportChartDefinition, readReports } from "../utils/reports.js";
import logo from "../assets/images/isselLogo.png";

const sectionSurface = {
	p: 3.5,
	mb: 3,
	border: "1px solid #d7dde7",
	borderRadius: "20px",
	backgroundColor: "#ffffff",
	breakInside: "avoid",
	boxShadow: "none",
};

const metricCardStyle = {
	p: 2.5,
	height: "100%",
	borderRadius: "18px",
	background: "linear-gradient(180deg, #f8fbff 0%, #eef6fb 100%)",
	border: "1px solid #dce7f3",
	boxShadow: "none",
};

const printableStyles = {
	"@page": {
		size: "A4",
		margin: "14mm",
	},
	"@media print": {
		"body": {
			background: "#ffffff !important",
		},
		"body *": {
			visibility: "hidden",
		},
		"#report-print-root, #report-print-root *": {
			visibility: "visible",
		},
		"#report-print-root": {
			position: "absolute",
			left: 0,
			top: 0,
			width: "100%",
		},
	},
};

const ReportMetaCard = ({ label, value, accent = "#00426E" }) => (
	<Paper sx={{ ...metricCardStyle, borderTop: `4px solid ${accent}` }}>
		<Typography sx={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280" }}>
			{label}
		</Typography>
		<Typography sx={{ mt: 1, fontSize: 20, fontWeight: 700, color: "#111827" }}>
			{value}
		</Typography>
	</Paper>
);

const ReportChartSection = ({ chartId, index }) => {
	const chart = getReportChartDefinition(chartId);

	if (chart.type === "kpis") {
		return (
			<Paper sx={sectionSurface}>
				<Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", mb: 2.5 }}>
					<Box>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
							Section {String(index).padStart(2, "0")}
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5, color: "#0f172a" }}>{chart.title}</Typography>
					</Box>
					<Box sx={{ px: 1.5, py: 0.75, borderRadius: "999px", backgroundColor: "#e9f6ef", color: "#20643b", fontWeight: 700, fontSize: 12 }}>
						Executive Snapshot
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
		return (
			<Paper sx={sectionSurface}>
				<Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", mb: 2.5 }}>
					<Box>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
							Section {String(index).padStart(2, "0")}
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5, color: "#0f172a" }}>{chart.title}</Typography>
					</Box>
					<Box sx={{ px: 1.5, py: 0.75, borderRadius: "999px", backgroundColor: "#edf5ff", color: "#0b57a1", fontWeight: 700, fontSize: 12 }}>
						Visualization
					</Box>
				</Box>

				<Typography sx={{ mb: 2.5, color: "#4b5563", lineHeight: 1.7 }}>
					{chart.description}
				</Typography>

				<Box sx={{ p: 2, borderRadius: "18px", border: "1px solid #e6edf5", backgroundColor: "#fcfdff" }}>
					<Plot
						data={chart.plot.data}
						title={chart.title}
						titleColor="#111111"
						showLegend={chart.plot.data.length > 1}
						displayBar={false}
						height="320px"
						background="#fcfdff"
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
			<Box id="report-print-root">
				<Paper
					sx={{
						p: { xs: 2.5, md: 5 },
						borderRadius: "28px",
						backgroundColor: "#ffffff",
						color: "#111111",
						boxShadow: "0 30px 80px rgba(15, 23, 42, 0.12)",
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
							pb: 3,
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
									Client Reporting Pack
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
							onClick={() => window.print()}
							sx={{
								alignSelf: { xs: "stretch", md: "center" },
								px: 3,
								py: 1.25,
								borderRadius: "999px",
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
							p: { xs: 2.5, md: 3.5 },
							borderRadius: "24px",
							background: "linear-gradient(135deg, #0b3c5d 0%, #0a5d85 55%, #00a7a0 100%)",
							color: "#ffffff",
							breakInside: "avoid",
						}}
					>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.8 }}>
							Executive Summary
						</Typography>
						<Typography variant="h5" sx={{ mt: 1.25, maxWidth: 760, lineHeight: 1.35, fontWeight: 700 }}>
							A concise, client-ready snapshot of the selected reporting window, combining curated visuals with written commentary.
						</Typography>
						<Typography sx={{ mt: 2, maxWidth: 860, lineHeight: 1.8, opacity: 0.92 }}>
							{commentaryText}
						</Typography>
					</Box>

					<Grid container spacing={2} sx={{ mb: 4 }}>
						<Grid item xs={12} md={4}>
							<ReportMetaCard label="Reporting Window" value={dateRangeLabel} accent="#00426E" />
						</Grid>
						<Grid item xs={12} md={4}>
							<ReportMetaCard label="Included Charts" value={String(selectedCharts.length).padStart(2, "0")} accent="#00A7A0" />
						</Grid>
						<Grid item xs={12} md={4}>
							<ReportMetaCard label="Document ID" value={report.id.replace("report-", "RPT-").slice(0, 18).toUpperCase()} accent="#D13173" />
						</Grid>
					</Grid>

					<Paper sx={{ ...sectionSurface, backgroundColor: "#f9fbfd" }}>
						<Typography sx={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b7280" }}>
							Included Content
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5, mb: 2.5, color: "#0f172a" }}>
							Selected Charts
						</Typography>
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
							{selectedCharts.map((chart) => (
								<Box
									key={chart.id}
									sx={{
										px: 1.75,
										py: 1,
										borderRadius: "999px",
										backgroundColor: "#ffffff",
										border: "1px solid #d7dde7",
										color: "#0f172a",
										fontWeight: 600,
									}}
								>
									{chart.title}
								</Box>
							))}
						</Box>
					</Paper>

					<Box sx={{ mb: 4 }}>
						{report.charts.map((chartId, index) => (
							<ReportChartSection key={chartId} chartId={chartId} index={index + 1} />
						))}
					</Box>

					<Paper sx={{ ...sectionSurface, mb: 0, backgroundColor: "#fcfcfd" }}>
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
