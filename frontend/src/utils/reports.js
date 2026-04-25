const REPORTS_STORAGE_KEY = "sgarden-reports";

export const reportChartOptions = [
	{ id: "overview-kpis", label: "Overview KPIs" },
	{ id: "revenue-trend", label: "Revenue Trend" },
	{ id: "customer-satisfaction", label: "Customer Satisfaction" },
	{ id: "quarterly-sales", label: "Quarterly Sales Distribution" },
	{ id: "budget-vs-actual", label: "Budget vs Actual Spending" },
];

export const reportChartDefinitions = {
	"overview-kpis": {
		id: "overview-kpis",
		title: "Overview KPIs",
		description: "Snapshot of the main commercial metrics included in this report.",
		type: "kpis",
		items: [
			{ label: "Monthly Revenue", value: "$128K", delta: "+12% vs last month" },
			{ label: "New Customers", value: "1,248", delta: "+8% vs last month" },
			{ label: "Active Subscriptions", value: "18,420", delta: "+5% vs last month" },
		],
	},
	"revenue-trend": {
		id: "revenue-trend",
		title: "Revenue Trend",
		description: "Monthly revenue performance across the selected time window.",
		type: "plot",
		plot: {
			data: [
				{
					x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
					y: [82, 91, 96, 108, 119, 132],
					type: "scatter",
					mode: "lines+markers",
					color: "#1976d2",
				},
			],
		},
	},
	"customer-satisfaction": {
		id: "customer-satisfaction",
		title: "Customer Satisfaction",
		description: "Experience score trend based on recent customer feedback.",
		type: "plot",
		plot: {
			data: [
				{
					x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
					y: [74, 78, 81, 84, 86, 88],
					type: "bar",
					color: "#2e7d32",
				},
			],
		},
	},
	"quarterly-sales": {
		id: "quarterly-sales",
		title: "Quarterly Sales Distribution",
		description: "Distribution of sales by quarter for the reporting period.",
		type: "plot",
		plot: {
			data: [
				{
					title: "Q1",
					y: [18, 24, 21, 27, 23],
					type: "box",
					color: "#1976d2",
				},
				{
					title: "Q2",
					y: [28, 32, 30, 35, 33],
					type: "box",
					color: "#9c27b0",
				},
				{
					title: "Q3",
					y: [26, 29, 34, 31, 37],
					type: "box",
					color: "#ed6c02",
				},
			],
		},
	},
	"budget-vs-actual": {
		id: "budget-vs-actual",
		title: "Budget vs Actual Spending",
		description: "Planned and actual spending for the main reporting months.",
		type: "plot",
		plot: {
			data: [
				{
					x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
					y: [52, 58, 63, 67, 72, 75],
					type: "bar",
					color: "#1976d2",
					title: "Budget",
				},
				{
					x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
					y: [49, 61, 59, 70, 69, 78],
					type: "bar",
					color: "#2e7d32",
					title: "Actual",
				},
			],
		},
	},
};

export const getReportChartDefinition = (chartId) => reportChartDefinitions[chartId] || {
	id: chartId,
	title: chartId,
	description: "Chart definition unavailable.",
	type: "unknown",
};

export const readReports = () => {
	try {
		if (typeof window === "undefined") return [];

		const stored = window.localStorage.getItem(REPORTS_STORAGE_KEY);
		if (!stored) return [];

		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

export const writeReports = (reports) => {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
	} catch {
		// Ignore localStorage failures to keep the page usable.
	}
};
