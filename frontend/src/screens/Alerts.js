import { useMemo, useState } from "react";
import {
	Box,
	Button,
	FormControlLabel,
	Grid,
	Paper,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";

import Dropdown from "../components/Dropdown.js";
import { useSnackbar, useI18n } from "../utils/index.js";
import {
	alertMetrics,
	alertOperators,
	baselineMetricValues,
	evaluateAlerts,
	readAlerts,
	writeAlerts,
} from "../utils/alerts.js";

const createAlertId = () => `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const Alerts = () => {
	const [alerts, setAlerts] = useState(() => readAlerts());
	const [formOpen, setFormOpen] = useState(false);
	const [formValues, setFormValues] = useState({
		metric: alertMetrics[0].value,
		operator: alertOperators[0].value,
		threshold: "",
		enabled: true,
	});
	const { success, error } = useSnackbar();
	const { t } = useI18n();
	const metricOptions = alertMetrics.map((metric) => ({
		...metric,
		text: metric.value === "Revenue"
			? t("dashboard.revenue")
			: metric.value === "Expenses"
				? t("dashboard.expenses")
				: metric.value === "Profit"
					? t("dashboard.profit")
					: t("dashboard.growthRate"),
	}));
	const operatorOptions = alertOperators.map((operator) => ({
		...operator,
		text: operator.value === ">"
			? t("alerts.operator.gt")
			: operator.value === "<"
				? t("alerts.operator.lt")
				: t("alerts.operator.eq"),
	}));

	const triggeredAlerts = useMemo(() => evaluateAlerts(alerts, baselineMetricValues), [alerts]);

	const persistAlerts = (nextAlerts) => {
		setAlerts(nextAlerts);
		writeAlerts(nextAlerts);
	};

	const resetForm = () => {
		setFormValues({
			metric: alertMetrics[0].value,
			operator: alertOperators[0].value,
			threshold: "",
			enabled: true,
		});
		setFormOpen(false);
	};

	const handleCreateAlert = () => {
		if (formValues.threshold === "" || Number.isNaN(Number(formValues.threshold))) {
			error(t("alerts.error.threshold"));
			return;
		}

		const nextAlerts = [
			...alerts,
			{
				id: createAlertId(),
				metric: formValues.metric,
				operator: formValues.operator,
				threshold: Number(formValues.threshold),
				enabled: formValues.enabled,
			},
		];

		persistAlerts(nextAlerts);
		success(t("alerts.success.created"));
		resetForm();
	};

	const handleToggleAlert = (id) => {
		const nextAlerts = alerts.map((alert) => (
			alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
		));
		persistAlerts(nextAlerts);
	};

	const handleDeleteAlert = (id) => {
		persistAlerts(alerts.filter((alert) => alert.id !== id));
		success(t("alerts.success.removed"));
	};

	return (
		<Box data-testid="alerts-page" sx={{ p: 3, width: "100%" }}>
			<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
				<Grid item>
					<Typography variant="h4" color="white.main">
						{t("alerts.title")}
					</Typography>
					<Typography color="white.main" sx={{ opacity: 0.8 }}>
						{t("alerts.subtitle")}
					</Typography>
				</Grid>
				<Grid item>
					<Button data-testid="alerts-add-button" variant="contained" color="secondary" onClick={() => setFormOpen(true)}>
						{t("alerts.create")}
					</Button>
				</Grid>
			</Grid>

			{formOpen && (
				<Paper data-testid="alerts-form" sx={{ p: 3, mb: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
					<Grid container spacing={2}>
						<Grid item xs={12} md={4}>
							<Typography color="white.main" sx={{ mb: 1 }}>{t("alerts.metric")}</Typography>
							<Dropdown
								items={metricOptions}
								value={formValues.metric}
								onChange={(event) => setFormValues((current) => ({ ...current, metric: event.target.value }))}
								testId="alerts-field-metric"
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<Typography color="white.main" sx={{ mb: 1 }}>{t("alerts.operator")}</Typography>
							<Dropdown
								items={operatorOptions}
								value={formValues.operator}
								onChange={(event) => setFormValues((current) => ({ ...current, operator: event.target.value }))}
								testId="alerts-field-operator"
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<Typography color="white.main" sx={{ mb: 1 }}>{t("alerts.threshold")}</Typography>
							<TextField
								fullWidth
								type="number"
								value={formValues.threshold}
								onChange={(event) => setFormValues((current) => ({ ...current, threshold: event.target.value }))}
								inputProps={{ "data-testid": "alerts-field-threshold" }}
								variant="outlined"
								color="secondary"
							/>
						</Grid>
						<Grid item xs={12}>
							<FormControlLabel
								control={(
									<Switch
										checked={formValues.enabled}
										onChange={(event) => setFormValues((current) => ({ ...current, enabled: event.target.checked }))}
										color="secondary"
									/>
								)}
								label={t("alerts.enableImmediately")}
								sx={{ color: "white.main" }}
							/>
						</Grid>
						<Grid item xs={12} sx={{ display: "flex", gap: 2 }}>
							<Button data-testid="alerts-form-submit" variant="contained" color="secondary" onClick={handleCreateAlert}>
								{t("alerts.save")}
							</Button>
							<Button data-testid="alerts-form-cancel" variant="outlined" color="secondary" onClick={resetForm}>
								{t("alerts.cancel")}
							</Button>
						</Grid>
					</Grid>
				</Paper>
			)}

			{alerts.length === 0 ? (
				<Paper sx={{ p: 2, mb: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
					<Table data-testid="alerts-table">
						<TableHead>
							<TableRow>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.metric")}</TableCell>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.rule")}</TableCell>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.enabled")}</TableCell>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.actions")}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell colSpan={4}>
									<Box data-testid="alerts-empty" py={2}>
										<Typography color="white.main" fontWeight="bold">
											{t("alerts.emptyTitle")}
										</Typography>
										<Typography color="white.main" sx={{ opacity: 0.8 }}>
											{t("alerts.emptyBody")}
										</Typography>
									</Box>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</Paper>
			) : (
				<Paper sx={{ p: 2, mb: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
					<Table data-testid="alerts-table">
						<TableHead>
							<TableRow>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.metric")}</TableCell>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.rule")}</TableCell>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.enabled")}</TableCell>
								<TableCell sx={{ color: "white.main" }}>{t("alerts.table.actions")}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{alerts.map((alert) => (
								<TableRow key={alert.id} data-testid={`alerts-row-${alert.id}`}>
									<TableCell sx={{ color: "white.main" }}>{alert.metric}</TableCell>
									<TableCell sx={{ color: "white.main" }}>{`${alert.operator} ${alert.threshold}`}</TableCell>
									<TableCell sx={{ color: "white.main" }}>
										<Box display="flex" alignItems="center" gap={1}>
											<Switch
												checked={alert.enabled}
												onChange={() => handleToggleAlert(alert.id)}
												color="secondary"
												inputProps={{ "data-testid": `alerts-toggle-${alert.id}` }}
											/>
											<Typography color="white.main">
												{alert.enabled ? "On" : "Off"}
											</Typography>
										</Box>
									</TableCell>
									<TableCell>
										<Button
											data-testid={`alerts-delete-${alert.id}`}
											variant="text"
											color="error"
											onClick={() => handleDeleteAlert(alert.id)}
										>
											{t("alerts.delete")}
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Paper>
			)}

			<Paper sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
					<Typography variant="h6" color="white.main" sx={{ mb: 2 }}>
						{t("alerts.triggered")}
				</Typography>
				<Box data-testid="alerts-triggered-list">
					{triggeredAlerts.length > 0 ? triggeredAlerts.map((alert) => (
						<Paper
							key={alert.id}
							data-testid={`alerts-triggered-item-${alert.id}`}
							sx={{ p: 2, mb: 1, backgroundColor: "rgba(255,255,255,0.06)" }}
						>
							<Typography color="white.main" fontWeight="bold">
								{`${alert.metric} ${alert.operator} ${alert.threshold}`}
							</Typography>
							<Typography color="white.main" sx={{ opacity: 0.8 }}>
								{t("alerts.currentValue", { value: alert.currentValue.toFixed(2) })}
							</Typography>
						</Paper>
					)) : (
						<Typography color="white.main" sx={{ opacity: 0.8 }}>
							{t("alerts.noneTriggered")}
						</Typography>
					)}
				</Box>
			</Paper>
		</Box>
	);
};

export default Alerts;
