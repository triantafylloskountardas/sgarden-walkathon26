import { useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Paper, Typography } from "@mui/material";

import { getData } from "../api/index.js";
import Card from "../components/Card.js";
import DatePicker from "../components/DatePicker.js";
import Dropdown from "../components/Dropdown.js";
import Plot from "../components/Plot.js";
import { useI18n } from "../utils/index.js";
import { buildComparisonDataset, buildComparisonDelta, comparisonMetricIds } from "../utils/comparison.js";

const availableRegions = ["Thessaloniki", "Athens", "Patras"];

const getMetricLabel = (metric, t) => {
	if (metric === "Revenue") return t("dashboard.revenue");
	if (metric === "Expenses") return t("dashboard.expenses");
	if (metric === "Profit") return t("dashboard.profit");
	if (metric === "Growth Rate") return t("dashboard.growthRate");
	return metric;
};

const formatDelta = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

const InsightComparePanel = ({
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
	<Paper data-testid={testId} sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
		<Typography variant="h6" color="white.main" sx={{ mb: 2 }}>
			{panelTitle}
		</Typography>
		<Grid container spacing={2} sx={{ mb: 2 }}>
			<Grid item xs={12} md={4}>
				<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>Metric</Typography>
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
				<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>{t("dashboard.from")}</Typography>
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
				<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>{t("dashboard.to")}</Typography>
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
				type: "bar",
				color: "secondary",
			}]}
			title={getMetricLabel(metric, t)}
			titleColor="white"
			showLegend={false}
			displayBar={false}
			height="280px"
			background="transparent"
			marginBottom={60}
		/>
	</Paper>
);

const Dashboard = () => {
	const [selectedRegion, setSelectedRegion] = useState("Thessaloniki");
	const [data, setData] = useState({ quarterlySalesDistribution: {}, budgetVsActual: {}, timePlot: {} });
	const [compareMode, setCompareMode] = useState(false);
	const [leftMetric, setLeftMetric] = useState("Revenue");
	const [rightMetric, setRightMetric] = useState("Growth Rate");
	const [leftFromDate, setLeftFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 6)));
	const [leftToDate, setLeftToDate] = useState(new Date());
	const [rightFromDate, setRightFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
	const [rightToDate, setRightToDate] = useState(new Date());
	const { t } = useI18n();

	useEffect(() => {
		getData().then((tempData) => {
			const { success, quarterlySalesDistribution, budgetVsActual, timePlot } = tempData;

			if (success) {
				setData({ quarterlySalesDistribution, budgetVsActual, timePlot });
			}
		});
	}, [selectedRegion]);

	const leftDataset = useMemo(() => buildComparisonDataset({
		fromDate: leftFromDate,
		toDate: leftToDate,
		metric: leftMetric,
		region: selectedRegion,
		panelOffset: 2,
	}), [leftFromDate, leftMetric, leftToDate, selectedRegion]);

	const rightDataset = useMemo(() => buildComparisonDataset({
		fromDate: rightFromDate,
		toDate: rightToDate,
		metric: rightMetric,
		region: selectedRegion,
		panelOffset: 5,
	}), [rightFromDate, rightMetric, rightToDate, selectedRegion]);

	const delta = useMemo(() => buildComparisonDelta(leftDataset, rightDataset), [leftDataset, rightDataset]);

	return (
		<Grid container py={2} flexDirection="column">
			<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
				<Grid item>
					<Typography variant="h4" gutterBottom color="white.main">
						{t("dashboard.insights")}
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
						<Button data-testid="compare-close" color="inherit" onClick={() => setCompareMode(false)}>
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
								<InsightComparePanel
									panelTitle="Baseline Insight"
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
								<InsightComparePanel
									panelTitle="Comparison Insight"
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
							<Typography variant="h6" color="white.main" sx={{ mb: 1 }}>Delta Summary</Typography>
							<Typography color="white.main">Average difference: <strong>{formatDelta(delta.average)}</strong></Typography>
							<Typography color="white.main">Latest value difference: <strong>{formatDelta(delta.latest)}</strong></Typography>
						</Paper>
					</>
				)
				: (
					<Grid container spacing={2}>
						<Grid item sm={12} md={6}>
							<Card title={t("dashboard.quarterlySalesDistribution")}>
								<Plot
									data={[
										{ title: "Q1", y: data?.quarterlySalesDistribution?.Q1, type: "box", color: "primary" },
										{ title: "Q2", y: data?.quarterlySalesDistribution?.Q2, type: "box", color: "secondary" },
										{ title: "Q3", y: data?.quarterlySalesDistribution?.Q3, type: "box", color: "third" },
									]}
									showLegend={false}
									displayBar={false}
									height="300px"
									marginBottom="40"
								/>
							</Card>
						</Grid>
						<Grid item sm={12} md={6}>
							<Card title={t("dashboard.budgetVsActual")}>
								<Plot
									data={[
										{
											x: ["January", "February", "March", "April", "May", "June"],
											y: Object.values(data?.budgetVsActual).map((month) => month.budget),
											type: "bar",
											color: "primary",
											title: t("dashboard.projected"),
										},
										{
											x: ["January", "February", "March", "April", "May", "June"],
											y: Object.values(data?.budgetVsActual).map((month) => month.actual),
											type: "bar",
											color: "secondary",
											title: t("dashboard.actual"),
										},
										{
											x: ["January", "February", "March", "April", "May", "June"],
											y: Object.values(data?.budgetVsActual).map((month) => month.forecast),
											type: "bar",
											color: "third",
											title: t("dashboard.forecast"),
										},
									]}
									showLegend
									displayBar={false}
									height="300px"
									marginBottom="40"
								/>
							</Card>
						</Grid>
						<Grid item sm={12}>
							<Card title={t("dashboard.performanceOverTime")}>
								<Plot
									data={[
										{ title: t("dashboard.projected"), x: Array.from({ length: 20 }, (_, i) => i + 1), y: data?.timePlot?.projected, type: "line", color: "primary" },
										{ title: t("dashboard.actual"), x: Array.from({ length: 20 }, (_, i) => i + 1), y: data?.timePlot?.actual, type: "line", color: "secondary" },
										{ title: t("dashboard.historicalAvg"), x: Array.from({ length: 20 }, (_, i) => i + 1), y: data?.timePlot?.historicalAvg, type: "line", color: "third" },
									]}
									showLegend
									displayBar={false}
									height="300px"
									marginBottom="40"
								/>
							</Card>
						</Grid>
					</Grid>
				)}
		</Grid>
	);
};

export default Dashboard;
