export const comparisonMetricIds = ["Revenue", "Expenses", "Profit", "Growth Rate"];

const hashValue = (value = "") => [...String(value)].reduce((sum, char) => sum + char.charCodeAt(0), 0);

const createMonths = (fromDate, toDate) => {
	const from = new Date(fromDate);
	const to = new Date(toDate);
	const months = [];

	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
		return months;
	}

	while (from <= to) {
		months.push(from.toLocaleString("en-GB", { month: "short", year: "numeric" }));
		from.setMonth(from.getMonth() + 1);
	}

	return months;
};

const metricMultiplier = {
	Revenue: 1.4,
	Expenses: 1.1,
	Profit: 1.25,
	"Growth Rate": 0.65,
};

export const buildComparisonDataset = ({
	fromDate,
	toDate,
	metric = "Revenue",
	region = "Thessaloniki",
	panelOffset = 0,
}) => {
	const months = createMonths(fromDate, toDate);
	const seed = hashValue(metric) + hashValue(region) + panelOffset * 19;
	const multiplier = metricMultiplier[metric] || 1;

	const values = months.map((_, index) => {
		const base = 26 + ((seed + (index * 7)) % 18);
		const seasonal = ((index % 4) - 1.5) * 2.6;
		return Number(((base + seasonal + panelOffset * 1.8) * multiplier).toFixed(2));
	});

	const total = values.reduce((sum, value) => sum + value, 0);
	const average = values.length ? total / values.length : 0;
	const latest = values.at(-1) || 0;

	return {
		months,
		values,
		total,
		average,
		latest,
	};
};

export const buildComparisonDelta = (leftDataset, rightDataset) => ({
	average: rightDataset.average - leftDataset.average,
	latest: rightDataset.latest - leftDataset.latest,
	total: rightDataset.total - leftDataset.total,
});
