const SALES_RECORDS_STORAGE_KEY = "sgarden-sales-records";

const defaultRecords = [
	{ id: "sale-1", category: "Software", month: "January", year: 2025, value: 128000, unit: "EUR", notes: "Enterprise renewals closed early." },
	{ id: "sale-2", category: "Services", month: "February", year: 2025, value: 84200, unit: "EUR", notes: "Professional services bundle." },
	{ id: "sale-3", category: "Hardware", month: "March", year: 2025, value: 56300, unit: "EUR", notes: "Regional device rollout." },
	{ id: "sale-4", category: "Software", month: "April", year: 2025, value: 139400, unit: "EUR", notes: "Cross-sell campaign uplift." },
	{ id: "sale-5", category: "Services", month: "May", year: 2025, value: 91100, unit: "EUR", notes: "Quarterly advisory engagements." },
	{ id: "sale-6", category: "Subscriptions", month: "June", year: 2025, value: 104500, unit: "EUR", notes: "Annual plans billed upfront." },
];

export const salesRecordCategories = ["Software", "Services", "Hardware", "Subscriptions"];
export const salesRecordMonths = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
export const salesRecordUnits = ["EUR", "USD", "Units", "Licenses"];

export const createSalesRecordId = () => `sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const readSalesRecords = () => {
	try {
		if (typeof window === "undefined") return defaultRecords;

		const stored = window.localStorage.getItem(SALES_RECORDS_STORAGE_KEY);
		if (stored === null) return defaultRecords;

		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : defaultRecords;
	} catch {
		return defaultRecords;
	}
};

export const writeSalesRecords = (records) => {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(SALES_RECORDS_STORAGE_KEY, JSON.stringify(records));
	} catch {
		// Keep the page usable even if localStorage is unavailable.
	}
};
