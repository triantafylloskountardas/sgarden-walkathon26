const AUDIT_TRAIL_STORAGE_KEY = "sgarden-audit-trail";

const defaultEntries = [
	{
		id: "audit-seed-1",
		admin: "system-admin",
		action: "invite_user",
		target: "new.manager@example.com",
		timestamp: new Date(Date.now() - (1000 * 60 * 60 * 24 * 2)).toISOString(),
		description: "Invited a new administrator account",
	},
	{
		id: "audit-seed-2",
		admin: "system-admin",
		action: "change_role",
		target: "analyst@example.com",
		timestamp: new Date(Date.now() - (1000 * 60 * 60 * 18)).toISOString(),
		description: "Changed role from user to admin",
	},
	{
		id: "audit-seed-3",
		admin: "system-admin",
		action: "delete_user",
		target: "former.contractor@example.com",
		timestamp: new Date(Date.now() - (1000 * 60 * 60 * 4)).toISOString(),
		description: "Deleted user account",
	},
];

export const auditActionOptions = [
	{ value: "all", text: "All actions" },
	{ value: "invite_user", text: "Invite user" },
	{ value: "change_role", text: "Change role" },
	{ value: "delete_user", text: "Delete user" },
];

export const readAuditTrail = () => {
	try {
		if (typeof window === "undefined") return defaultEntries;

		const stored = window.localStorage.getItem(AUDIT_TRAIL_STORAGE_KEY);
		if (stored === null) return defaultEntries;

		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : defaultEntries;
	} catch {
		return defaultEntries;
	}
};

export const writeAuditTrail = (entries) => {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(AUDIT_TRAIL_STORAGE_KEY, JSON.stringify(entries));
	} catch {
		// Keep the audit page usable if local storage is blocked.
	}
};

export const appendAuditEntry = (entry) => {
	const existing = readAuditTrail();
	const nextEntries = [
		{
			id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			timestamp: new Date().toISOString(),
			...entry,
		},
		...existing,
	];

	writeAuditTrail(nextEntries);
	return nextEntries;
};
