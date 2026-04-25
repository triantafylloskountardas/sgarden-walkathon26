import { useMemo, useState } from "react";
import { Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

import DatePicker from "../components/DatePicker.js";
import Dropdown from "../components/Dropdown.js";
import { dayjs } from "../utils/index.js";
import { auditActionOptions, readAuditTrail } from "../utils/audit-trail.js";

const AuditTrail = () => {
	const [actionFilter, setActionFilter] = useState("all");
	const [dateFrom, setDateFrom] = useState(null);
	const [dateTo, setDateTo] = useState(null);
	const entries = useMemo(() => readAuditTrail(), []);

	const filteredEntries = useMemo(() => entries.filter((entry) => {
		if (actionFilter !== "all" && entry.action !== actionFilter) {
			return false;
		}

		const timestamp = new Date(entry.timestamp);
		if (dateFrom && timestamp < new Date(dateFrom)) {
			return false;
		}
		if (dateTo) {
			const inclusiveTo = new Date(dateTo);
			inclusiveTo.setHours(23, 59, 59, 999);
			if (timestamp > inclusiveTo) {
				return false;
			}
		}

		return true;
	}), [actionFilter, dateFrom, dateTo, entries]);

	return (
		<Box data-testid="audit-page" sx={{ p: 3, width: "100%" }}>
			<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
				<Grid item>
					<Typography variant="h4" color="white.main">
						Audit Trail
					</Typography>
					<Typography color="white.main" sx={{ opacity: 0.8 }}>
						Chronological record of admin-sensitive actions across the workspace.
					</Typography>
				</Grid>
			</Grid>

			<Grid container spacing={2} sx={{ mb: 3 }}>
				<Grid item xs={12} md={4}>
					<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>
						Action type
					</Typography>
					<Dropdown
						width="100%"
						height="44px"
						background="greyDark"
						items={auditActionOptions}
						value={actionFilter}
						onChange={(event) => setActionFilter(event.target.value)}
						testId="audit-filter-action"
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>
						From
					</Typography>
					<DatePicker
						width="100%"
						label="From"
						background="greyDark"
						value={dateFrom}
						onChange={setDateFrom}
						testId="audit-filter-date-from"
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<Typography variant="subtitle2" color="white.main" sx={{ mb: 1 }}>
						To
					</Typography>
					<DatePicker
						width="100%"
						label="To"
						background="greyDark"
						value={dateTo}
						onChange={setDateTo}
						testId="audit-filter-date-to"
					/>
				</Grid>
			</Grid>

			<TableContainer component={Paper} data-testid="audit-table" sx={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Admin</TableCell>
							<TableCell>Action</TableCell>
							<TableCell>Target</TableCell>
							<TableCell>When</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filteredEntries.length > 0
							? filteredEntries.map((entry) => (
								<TableRow key={entry.id} data-testid={`audit-row-${entry.id}`}>
									<TableCell data-testid={`audit-row-admin-${entry.id}`}>{entry.admin}</TableCell>
									<TableCell data-testid={`audit-row-action-${entry.id}`}>{entry.description}</TableCell>
									<TableCell data-testid={`audit-row-target-${entry.id}`}>{entry.target}</TableCell>
									<TableCell data-testid={`audit-row-timestamp-${entry.id}`}>{dayjs(entry.timestamp).format("DD/MM/YYYY HH:mm")}</TableCell>
								</TableRow>
							))
							: (
								<TableRow>
									<TableCell colSpan={4}>
										<Box data-testid="audit-empty" py={3}>
											<Typography align="center">No audit entries match the selected filters.</Typography>
										</Box>
									</TableCell>
								</TableRow>
							)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};

export default AuditTrail;
