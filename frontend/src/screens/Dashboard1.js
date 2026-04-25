import { useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Paper, Typography } from "@mui/material";

import Dropdown from "../components/Dropdown.js";
import Card from "../components/Card.js";
import Plot from "../components/Plot.js";
import DatePicker from "../components/DatePicker.js";
import Map from "../components/Map.js";
import colors from "../_colors.scss";
import { findThresholdForMetric, readAlerts } from "../utils/alerts.js";
import { useI18n } from "../utils/index.js";
import { buildComparisonDataset, buildComparisonDelta, comparisonMetricIds } from "../utils/comparison.js";

const availableRegions = ["Thessaloniki", "Athens", "Patras"];
const generateRandomData = (min = 0, max = 10) => Math.random() * (max - min) + min;
const randomDate = () => new Date(new Date(2020, 0, 1).getTime() + Math.random() * (new Date().getTime() - new Date(2020, 0, 1).getTime()));

const getMetricLabel = (metric, t) => {
	if (metric === "Revenue") return t("dashboard.revenue");
	if (metric === "Expenses") return t("dashboard.expenses");
	if (metric === "Profit") return t("dashboard.profit");
	if (metric === "Growth Rate") return t("dashboard.growthRate");
	return metric;
};

const formatDelta = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

const ComparisonPanel = ({
	panelTitle,
	testId,
	metric,
	onMetricChange,
	fromDate,
	onFromDateChange,
	toDate,
	onToDateChange,
	dataset,
	metricTestId,
	fromTestId,
	toTestId,
	t,
}) => (
	<Paper data-testid={testId} sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
		<Typography variant="h6" color="white.main" sx={{ mb: 2 }}>
			{panelTitle}
		</Typography>
		<Grid container spacing={2} sx={{ mb: 2 }}>
			<Grid item xs={12} md={4}>
				<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>
					Metric
				</Typography>
				<Dropdown
					width="100%"
					height="44px"
					background="greyDark"
					items={comparisonMetricIds.map((metricId) => ({
						value: metricId,
						text: getMetricLabel(metricId, t),
					}))}
					value={metric}
					onChange={(event) => onMetricChange(event.target.value)}
					testId={metricTestId}
				/>
			</Grid>
			<Grid item xs={12} md={4}>
				<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>
					{t("dashboard.from")}
				</Typography>
				<DatePicker
					width="100%"
					views={["month", "year"]}
					inputFormat="MM/YYYY"
					label="From"
					background="greyDark"
					value={fromDate}
					onChange={onFromDateChange}
					testId={fromTestId}
				/>
			</Grid>
			<Grid item xs={12} md={4}>
				<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>
					{t("dashboard.to")}
				</Typography>
				<DatePicker
					width="100%"
					views={["month", "year"]}
					inputFormat="MM/YYYY"
					label="To"
					background="greyDark"
					value={toDate}
					onChange={onToDateChange}
					testId={toTestId}
				/>
			</Grid>
		</Grid>

		<Plot
			data={[{
				x: dataset.months,
				y: dataset.values,
				type: "scatter",
				mode: "lines+markers",
				color: "third",
			}]}
			title={getMetricLabel(metric, t)}
			titleColor="white"
			showLegend={false}
			displayBar={false}
			height="280px"
			background="transparent"
			marginBottom={60}
		/>

		<Grid container spacing={2} sx={{ mt: 1 }}>
			<Grid item xs={12} md={4}>
				<Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.06)" }}>
					<Typography variant="caption" color="white.main" sx={{ opacity: 0.8 }}>
						Average
					</Typography>
					<Typography variant="h6" color="secondary.main">
						{dataset.average.toFixed(2)}
					</Typography>
				</Paper>
			</Grid>
			<Grid item xs={12} md={4}>
				<Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.06)" }}>
					<Typography variant="caption" color="white.main" sx={{ opacity: 0.8 }}>
						Latest
					</Typography>
					<Typography variant="h6" color="secondary.main">
						{dataset.latest.toFixed(2)}
					</Typography>
				</Paper>
			</Grid>
			<Grid item xs={12} md={4}>
				<Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.06)" }}>
					<Typography variant="caption" color="white.main" sx={{ opacity: 0.8 }}>
						Points
					</Typography>
					<Typography variant="h6" color="secondary.main">
						{dataset.values.length}
					</Typography>
				</Paper>
			</Grid>
		</Grid>
	</Paper>
);

const Dashboard = () => {
	const [selectedRegion, setSelectedRegion] = useState("Thessaloniki");
	const [selectedMetric, setSelectedMetric] = useState(null);
	const [fromDate, setFromDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
	const [toDate, setToDate] = useState(new Date());
	const [months, setMonths] = useState([]);
	const [data, setData] = useState({ keyMetric: { date: randomDate(), value: generateRandomData(0, 100) }, revenue: [], expenses: [], profit: [], growthRate: [] });
	const [compareMode, setCompareMode] = useState(false);
	const [leftMetric, setLeftMetric] = useState("Revenue");
	const [rightMetric, setRightMetric] = useState("Profit");
	const [leftFromDate, setLeftFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 6)));
	const [leftToDate, setLeftToDate] = useState(new Date());
	const [rightFromDate, setRightFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
	const [rightToDate, setRightToDate] = useState(new Date());
	const { t } = useI18n();

	const changePlotData = (fromD, toD) => {
		if (fromD && toD) {
			const from = new Date(fromD);
			const to = new Date(toD);
			const nextMonths = [];

			while (from <= to) {
				nextMonths.push(from.toLocaleString("en-GB", { month: "short", year: "numeric" }));
				from.setMonth(from.getMonth() + 1);
			}

			setMonths(nextMonths);

			const revenue = nextMonths.map(() => generateRandomData(0, 20));
			const expenses = nextMonths.map(() => generateRandomData(0, 30));
			const profit = nextMonths.map(() => generateRandomData(0, 40));
			const growthRate = nextMonths.map(() => generateRandomData(0, 50));
			setData((current) => ({ ...current, revenue, expenses, profit, growthRate }));
		}
	};

	const changeKeyMetricData = () => {
		const keyMetric = { date: randomDate(), value: generateRandomData(0, 100) };
		setData((current) => ({ ...current, keyMetric }));
	};

	useEffect(() => {
		changePlotData(fromDate, toDate);
	}, [fromDate, toDate]);

	useEffect(() => {
		changeKeyMetricData();
	}, [selectedMetric]);

	useEffect(() => {
		changeKeyMetricData();
		changePlotData(fromDate, toDate);
	}, [selectedRegion]);

	const activeRevenueAlert = findThresholdForMetric(readAlerts(), "Revenue");
	const revenueThreshold = activeRevenueAlert ? Number(activeRevenueAlert.threshold) : 15;
	const revenueThresholdShapes = [{
		type: "line",
		xref: "paper",
		x0: 0,
		x1: 1,
		yref: "y",
		y0: revenueThreshold,
		y1: revenueThreshold,
		line: {
			color: colors.error,
			width: 3,
			dash: "dash",
		},
	}];

	const leftDataset = useMemo(() => buildComparisonDataset({
		fromDate: leftFromDate,
		toDate: leftToDate,
		metric: leftMetric,
		region: selectedRegion,
		panelOffset: 1,
	}), [leftFromDate, leftMetric, leftToDate, selectedRegion]);

	const rightDataset = useMemo(() => buildComparisonDataset({
		fromDate: rightFromDate,
		toDate: rightToDate,
		metric: rightMetric,
		region: selectedRegion,
		panelOffset: 3,
	}), [rightFromDate, rightMetric, rightToDate, selectedRegion]);

	const delta = useMemo(() => buildComparisonDelta(leftDataset, rightDataset), [leftDataset, rightDataset]);

	return (
		<Grid container py={2} flexDirection="column">
			<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
				<Grid item>
					<Typography variant="h4" gutterBottom color="white.main">
						{t("dashboard.analytics")}
					</Typography>
				</Grid>
				<Grid item display="flex" gap={1} flexWrap="wrap">
					<Button
						data-testid="compare-toggle"
						variant={compareMode ? "contained" : "outlined"}
						color="secondary"
						onClick={() => setCompareMode(true)}
					>
						Compare
					</Button>
					{compareMode && (
						<Button data-testid="compare-close" variant="text" color="inherit" onClick={() => setCompareMode(false)}>
							Close Comparison
						</Button>
					)}
				</Grid>
			</Grid>

			<Grid item style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
				<Typography variant="body1" style={{ marginRight: "10px" }} color="white.main">{t("dashboard.region")}</Typography>
				<Dropdown
					items={availableRegions.map((region) => ({ value: region, text: region }))}
					value={selectedRegion}
					onChange={(event) => setSelectedRegion(event.target.value)}
				/>
			</Grid>

			{compareMode
				? (
					<>
						<Paper data-testid="compare-active-indicator" sx={{ p: 2, mb: 2, backgroundColor: "rgba(255,255,255,0.08)" }}>
							<Typography color="white.main" fontWeight="bold">
								Comparison mode is active for {selectedRegion}.
							</Typography>
						</Paper>

						<Grid container spacing={2}>
							<Grid item xs={12} lg={6}>
								<ComparisonPanel
									panelTitle="Baseline Dataset"
									testId="compare-panel-left"
									metric={leftMetric}
									onMetricChange={setLeftMetric}
									fromDate={leftFromDate}
									onFromDateChange={setLeftFromDate}
									toDate={leftToDate}
									onToDateChange={setLeftToDate}
									dataset={leftDataset}
									metricTestId="compare-filter-left-metric"
									fromTestId="compare-filter-left-date-from"
									toTestId="compare-filter-left-date-to"
									t={t}
								/>
							</Grid>
							<Grid item xs={12} lg={6}>
								<ComparisonPanel
									panelTitle="Comparison Dataset"
									testId="compare-panel-right"
									metric={rightMetric}
									onMetricChange={setRightMetric}
									fromDate={rightFromDate}
									onFromDateChange={setRightFromDate}
									toDate={rightToDate}
									onToDateChange={setRightToDate}
									dataset={rightDataset}
									metricTestId="compare-filter-right-metric"
									fromTestId="compare-filter-right-date-from"
									toTestId="compare-filter-right-date-to"
									t={t}
								/>
							</Grid>
						</Grid>

						<Paper data-testid="compare-delta-display" sx={{ p: 3, mt: 2, backgroundColor: "rgba(255,255,255,0.08)" }}>
							<Typography variant="h6" color="white.main" sx={{ mb: 2 }}>
								Delta Summary
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} md={4}>
									<Typography color="white.main" sx={{ opacity: 0.8 }}>Average difference</Typography>
									<Typography variant="h5" color={delta.average >= 0 ? "success.main" : "error.main"}>
										{formatDelta(delta.average)}
									</Typography>
								</Grid>
								<Grid item xs={12} md={4}>
									<Typography color="white.main" sx={{ opacity: 0.8 }}>Latest value difference</Typography>
									<Typography variant="h5" color={delta.latest >= 0 ? "success.main" : "error.main"}>
										{formatDelta(delta.latest)}
									</Typography>
								</Grid>
								<Grid item xs={12} md={4}>
									<Typography color="white.main" sx={{ opacity: 0.8 }}>Total difference</Typography>
									<Typography variant="h5" color={delta.total >= 0 ? "success.main" : "error.main"}>
										{formatDelta(delta.total)}
									</Typography>
								</Grid>
							</Grid>
						</Paper>
					</>
				)
				: (
					<Grid container spacing={2}>
						<Grid container item sm={12} md={4} spacing={4}>
							<Grid item width="100%">
								<Card
									title={t("dashboard.keyMetric")}
									footer={(
										<Box
											width="100%"
											height="100px"
											display="flex"
											flexDirection="column"
											justifyContent="center"
											alignItems="center"
											backgroundColor="greyDark.main"
											py={1}
										>
											{selectedMetric
												? (
													<>
														<Typography variant="body">
															{t("dashboard.latestMetricValue", { metric: selectedMetric, region: selectedRegion })}
														</Typography>
														<Typography variant="body1" fontWeight="bold" color="primary.main">
															{`${data.keyMetric.date.toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })} - ${data.keyMetric.value.toFixed(2)}%`}
														</Typography>
													</>
												)
												: (
													<Typography variant="body1" fontWeight="bold" color="white.main">
														{t("dashboard.noMetricSelected")}
													</Typography>
												)}
										</Box>
									)}
								>
									<Box height="100px" display="flex" alignItems="center" justifyContent="space-between">
										<Typography width="fit-content" variant="subtitle1">{t("alerts.metric")}:</Typography>
										<Dropdown
											width="50%"
											height="40px"
											size="small"
											placeholder="Select"
											background="greyDark"
											items={comparisonMetricIds.map((metric) => ({
												value: metric,
												text: getMetricLabel(metric, t),
											}))}
											value={selectedMetric}
											onChange={(event) => setSelectedMetric(event.target.value)}
										/>
									</Box>
								</Card>
							</Grid>
							<Grid item width="100%">
								<Card title={t("dashboard.regionalOverview")}>
									<Map />
								</Card>
							</Grid>
						</Grid>

						<Grid item sm={12} md={8}>
							<Card title={t("dashboard.trends")}>
								<Box display="flex" justifyContent="space-between" mb={1}>
									<Grid item xs={12} sm={6} display="flex" flexDirection="row" alignItems="center">
										<Typography variant="subtitle1" align="center" mr={2}>
											{t("dashboard.from")}
										</Typography>
										<DatePicker
											width="200px"
											views={["month", "year"]}
											inputFormat="MM/YYYY"
											label="From"
											background="greyDark"
											value={fromDate}
											onChange={(value) => setFromDate(value)}
										/>
									</Grid>
									<Grid item xs={12} sm={6} display="flex" flexDirection="row" alignItems="center" justifyContent="flex-end">
										<Typography variant="subtitle1" align="center" mr={2}>
											{t("dashboard.to")}
										</Typography>
										<DatePicker
											width="200px"
											views={["month", "year"]}
											inputFormat="MM/YYYY"
											label="To"
											background="greyDark"
											value={toDate}
											onChange={(value) => setToDate(value)}
										/>
									</Grid>
								</Box>
								<Grid container spacing={1} width="100%">
									<Grid item xs={12} md={6}>
										<Box position="relative">
											<Plot
												data={[
													{
														x: months,
														y: data.revenue,
														type: "lines",
														fill: "tozeroy",
														color: "third",
														line: { shape: "spline", smoothing: 1 },
														markerSize: 0,
														hoverinfo: "none",
													},
													{
														x: months,
														y: data.revenue,
														type: "scatter",
														mode: "markers",
														color: "primary",
														markerSize: 10,
														name: "",
														hoverinfo: "none",
													},
												]}
												showLegend={false}
												title={t("dashboard.revenue")}
												titleColor="primary"
												titleFontSize={16}
												displayBar={false}
												height="250px"
												shapes={revenueThresholdShapes}
												annotations={[
													{
														x: months[data.revenue.indexOf(Math.min(...data.revenue))],
														y: Math.min(...data.revenue),
														xref: "x",
														yref: "y",
														text: `Min: ${Math.min(...data.revenue).toFixed(2)}%`,
														showarrow: true,
														font: { size: 16, color: "#ffffff" },
														align: "center",
														arrowhead: 2,
														arrowsize: 1,
														arrowwidth: 2,
														arrowcolor: colors.primary,
														borderpad: 4,
														bgcolor: colors.primary,
														opacity: 0.8,
													},
													{
														x: months[data.revenue.indexOf(Math.max(...data.revenue))],
														y: Math.max(...data.revenue),
														xref: "x",
														yref: "y",
														text: `Max: ${Math.max(...data.revenue).toFixed(2)}%`,
														showarrow: true,
														font: { size: 16, color: "#ffffff" },
														align: "center",
														arrowhead: 2,
														arrowsize: 1,
														arrowwidth: 2,
														arrowcolor: colors.primary,
														borderpad: 4,
														bgcolor: colors.primary,
														opacity: 0.8,
													},
												]}
											/>
											<Box
												data-testid="chart-threshold-line"
												sx={{
													position: "absolute",
													left: 24,
													right: 24,
													top: 56,
													borderTop: `2px dashed ${colors.error}`,
													pointerEvents: "none",
												}}
											/>
										</Box>
										<Typography variant="body1" textAlign="center">
											{t("dashboard.average", { value: (data.revenue.reduce((acc, curr) => acc + curr, 0) / data.revenue.length).toFixed(2) })}
										</Typography>
										<Typography variant="body2" textAlign="center" color="white.main" sx={{ opacity: 0.8 }}>
											{activeRevenueAlert
												? t("dashboard.activeThreshold", { value: revenueThreshold })
												: t("dashboard.suggestedThreshold", { value: revenueThreshold })}
										</Typography>
									</Grid>
									<Grid item xs={12} md={6}>
										<Plot
											data={[
												{
													x: months,
													y: data.expenses,
													type: "lines",
													fill: "tozeroy",
													color: "third",
													line: { shape: "spline", smoothing: 1 },
													markerSize: 0,
													hoverinfo: "none",
												},
												{
													x: months,
													y: data.expenses,
													type: "scatter",
													mode: "markers",
													color: "primary",
													markerSize: 10,
													name: "",
													hoverinfo: "none",
												},
											]}
											showLegend={false}
											title={t("dashboard.expenses")}
											titleColor="primary"
											titleFontSize={16}
											displayBar={false}
											height="250px"
										/>
										<Typography variant="body1" textAlign="center">
											{t("dashboard.average", { value: (data.expenses.reduce((acc, curr) => acc + curr, 0) / data.expenses.length).toFixed(2) })}
										</Typography>
									</Grid>
									<Grid item xs={12} md={6}>
										<Plot
											data={[
												{
													x: months,
													y: data.profit,
													type: "lines",
													fill: "tozeroy",
													color: "third",
													line: { shape: "spline", smoothing: 1 },
													markerSize: 0,
													hoverinfo: "none",
												},
												{
													x: months,
													y: data.profit,
													type: "scatter",
													mode: "markers",
													color: "primary",
													markerSize: 10,
													name: "",
													hoverinfo: "none",
												},
											]}
											showLegend={false}
											title={t("dashboard.profit")}
											titleColor="primary"
											titleFontSize={16}
											displayBar={false}
											height="250px"
										/>
										<Typography variant="body1" textAlign="center">
											{t("dashboard.average", { value: (data.profit.reduce((acc, curr) => acc + curr, 0) / data.profit.length).toFixed(2) })}
										</Typography>
									</Grid>
									<Grid item xs={12} md={6}>
										<Plot
											data={[
												{
													x: months,
													y: data.growthRate,
													type: "lines",
													fill: "tozeroy",
													color: "third",
													line: { shape: "spline", smoothing: 1 },
													markerSize: 0,
													hoverinfo: "none",
												},
												{
													x: months,
													y: data.growthRate,
													type: "scatter",
													mode: "markers",
													color: "primary",
													markerSize: 10,
													name: "",
													hoverinfo: "none",
												},
											]}
											showLegend={false}
											title={t("dashboard.growthRate")}
											titleColor="primary"
											titleFontSize={16}
											displayBar={false}
											height="250px"
										/>
										<Typography variant="body1" textAlign="center">
											{t("dashboard.average", { value: (data.growthRate.reduce((acc, curr) => acc + curr, 0) / data.growthRate.length).toFixed(2) })}
										</Typography>
									</Grid>
								</Grid>
							</Card>
						</Grid>
					</Grid>
				)}
		</Grid>
	);
};

export default Dashboard;
