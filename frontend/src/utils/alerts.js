const ALERTS_STORAGE_KEY = "sgarden-threshold-alerts";

export const alertMetrics = [
	{ value: "Revenue", text: "Revenue" },
	{ value: "Expenses", text: "Expenses" },
	{ value: "Profit", text: "Profit" },
	{ value: "Growth Rate", text: "Growth Rate" },
];

export const alertOperators = [
	{ value: ">", text: "Greater than" },
	{ value: "<", text: "Less than" },
	{ value: "=", text: "Equal to" },
];

export const baselineMetricValues = {
	Revenue: 12.5,
	Expenses: 18.2,
	Profit: 22.4,
	"Growth Rate": 9.7,
};

const compareMetric = (metricValue, operator, threshold) => {
	switch (operator) {
		case ">":
			return metricValue > threshold;
		case "<":
			return metricValue < threshold;
		case "=":
			return metricValue === threshold;
		default:
			return false;
	}
};

export const readAlerts = () => {
	try {
		if (typeof window === "undefined") return [];

		const raw = window.localStorage.getItem(ALERTS_STORAGE_KEY);
		if (!raw) return [];

		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

export const writeAlerts = (alerts) => {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
	} catch {
		// Ignore storage failures so the rest of the UI can still function.
	}
};

export const evaluateAlerts = (alerts, metricValues = baselineMetricValues) => {
	return alerts
		.filter((alert) => alert.enabled)
		.filter((alert) => compareMetric(metricValues[alert.metric] ?? 0, alert.operator, Number(alert.threshold)))
		.map((alert) => ({
			...alert,
			currentValue: metricValues[alert.metric] ?? 0,
		}));
};

export const findThresholdForMetric = (alerts, metric) => {
	return alerts.find((alert) => alert.enabled && alert.metric === metric) ?? null;
};
