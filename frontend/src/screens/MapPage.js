import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import {
	Box,
	Button,
	Grid,
	Paper,
	TextField,
	Typography,
} from "@mui/material";

import Dropdown from "../components/Dropdown.js";
import { useI18n, useSnackbar } from "../utils/index.js";

const MAP_STORAGE_KEY = "sgarden-map-region-data";
const geographySource = "/map.json";

const categoryOptions = [
	{ value: "Retail", text: "Retail" },
	{ value: "Enterprise", text: "Enterprise" },
	{ value: "Operations", text: "Operations" },
	{ value: "Logistics", text: "Logistics" },
];

const legendStops = [
	{ label: "Low", color: "#c8e6c9" },
	{ label: "Medium", color: "#81c784" },
	{ label: "High", color: "#43a047" },
	{ label: "Critical", color: "#1b5e20" },
];

const readRegionData = () => {
	try {
		if (typeof window === "undefined") return {};
		const stored = window.localStorage.getItem(MAP_STORAGE_KEY);
		if (!stored) return {};

		const parsed = JSON.parse(stored);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
};

const writeRegionData = (data) => {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(data));
	} catch {
		// Ignore storage issues to keep the page usable.
	}
};

const sanitizeRegionId = (id) => String(id || "").toLowerCase();

const getRegionFill = (record, isSelected) => {
	if (isSelected) return "#ffcc80";
	if (!record) return "#90caf9";

	const revenue = Number(record.revenue) || 0;
	if (revenue >= 1000000) return "#1b5e20";
	if (revenue >= 500000) return "#43a047";
	if (revenue >= 100000) return "#81c784";
	return "#c8e6c9";
};

const emptyForm = {
	category: categoryOptions[0].value,
	revenue: "",
	headcount: "",
	notes: "",
};

const MapPage = () => {
	const { t } = useI18n();
	const { success, error } = useSnackbar();
	const [regionData, setRegionData] = useState(() => readRegionData());
	const [selectedRegion, setSelectedRegion] = useState(null);
	const [formState, setFormState] = useState(emptyForm);
	const [hoveredRegion, setHoveredRegion] = useState(null);
	const [lastSavedRegionId, setLastSavedRegionId] = useState(null);

	const activeTooltip = useMemo(() => {
		if (!hoveredRegion) return null;

		const saved = regionData[hoveredRegion.id];
		return {
			...hoveredRegion,
			record: saved || null,
		};
	}, [hoveredRegion, regionData]);

	const handleRegionSelect = (geo) => {
		const region = {
			id: geo.id,
			name: geo.properties?.name || geo.id,
		};

		const existing = regionData[region.id];
		setSelectedRegion(region);
		setFormState(existing || emptyForm);
	};

	const handleSave = () => {
		if (!selectedRegion) {
			error("Select a region first.");
			return;
		}

		const revenueValue = Number(formState.revenue);
		if (Number.isNaN(revenueValue)) {
			error("Revenue must be numeric.");
			return;
		}

		const nextData = {
			...regionData,
			[selectedRegion.id]: {
				category: formState.category,
				revenue: revenueValue,
				headcount: Number(formState.headcount) || 0,
				notes: formState.notes,
				regionName: selectedRegion.name,
			},
		};

		setRegionData(nextData);
		writeRegionData(nextData);
		setLastSavedRegionId(selectedRegion.id);
		setHoveredRegion({ id: selectedRegion.id, name: selectedRegion.name });
		success("Region data saved.");
	};

	const handleCancel = () => {
		setSelectedRegion(null);
		setFormState(emptyForm);
	};

	return (
		<Box data-testid="map-page" sx={{ p: 3, width: "100%" }}>
			<Grid container spacing={3}>
				<Grid item xs={12} md={8}>
					<Paper sx={{ p: 2, backgroundColor: "rgba(255,255,255,0.08)", position: "relative" }}>
						<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
							<Grid item>
								<Typography variant="h4" color="white.main">
									{t("search.item.map.title")}
								</Typography>
								<Typography color="white.main" sx={{ opacity: 0.8 }}>
									Click a region to enter operational data and review choropleth performance.
								</Typography>
							</Grid>
							<Grid item>
								<Box data-testid="map-choropleth-active" sx={{ px: 2, py: 1, borderRadius: 2, backgroundColor: "rgba(67,160,71,0.2)" }}>
									<Typography color="white.main" fontWeight="bold">
										Choropleth active
									</Typography>
								</Box>
							</Grid>
						</Grid>

						<Box sx={{ borderRadius: 2, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.15)" }}>
							<ComposableMap projection="geoEqualEarth" style={{ width: "100%", height: "auto" }}>
								<Geographies geography={geographySource}>
									{({ geographies }) => geographies.map((geo) => {
										const savedRecord = regionData[geo.id];
										const isSelected = selectedRegion?.id === geo.id;
										return (
											<Geography
												key={geo.rsmKey}
												geography={geo}
												data-testid={`map-region-${sanitizeRegionId(geo.id)}`}
												onClick={() => handleRegionSelect(geo)}
												onMouseEnter={() => setHoveredRegion({ id: geo.id, name: geo.properties?.name || geo.id })}
												onMouseLeave={() => setHoveredRegion(null)}
												style={{
													default: {
														fill: getRegionFill(savedRecord, isSelected),
														stroke: isSelected ? "#ff9800" : "#ffffff",
														strokeWidth: isSelected ? 1.5 : 0.5,
														outline: "none",
													},
													hover: {
														fill: "#ffb74d",
														stroke: "#ffffff",
														strokeWidth: 1,
														outline: "none",
														cursor: "pointer",
													},
													pressed: {
														fill: "#fb8c00",
														stroke: "#ffffff",
														strokeWidth: 1,
														outline: "none",
													},
												}}
											/>
										);
									})}
								</Geographies>
							</ComposableMap>
						</Box>

						{selectedRegion && (
							<Box data-testid="map-region-selected" sx={{ mt: 2 }}>
								<Typography color="white.main" fontWeight="bold">
									Selected region: {selectedRegion.name}
								</Typography>
							</Box>
						)}

						{activeTooltip && (
							<Paper
								data-testid="map-tooltip"
								sx={{
									position: "absolute",
									top: 96,
									right: 24,
									p: 2,
									maxWidth: 260,
									backgroundColor: "rgba(21, 32, 43, 0.92)",
								}}
							>
								<Typography color="white.main" fontWeight="bold">
									{activeTooltip.name}
								</Typography>
								<Typography color="white.main" sx={{ opacity: 0.8 }}>
									{activeTooltip.record
										? `Category: ${activeTooltip.record.category} | Revenue: ${activeTooltip.record.revenue}`
										: "No saved region data yet."}
								</Typography>
							</Paper>
						)}

						<Box data-testid="map-legend" sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
							<Typography color="white.main" fontWeight="bold">
								Revenue Legend
							</Typography>
							{legendStops.map((stop) => (
								<Box key={stop.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Box sx={{ width: 20, height: 20, borderRadius: "4px", backgroundColor: stop.color }} />
									<Typography color="white.main">{stop.label}</Typography>
								</Box>
							))}
						</Box>

						{lastSavedRegionId && regionData[lastSavedRegionId] && (
							<Paper sx={{ mt: 2, p: 2, backgroundColor: "rgba(255,255,255,0.06)" }}>
								<Typography color="white.main" fontWeight="bold">
									Last saved region
								</Typography>
								<Typography color="white.main" sx={{ opacity: 0.8 }}>
									{`${regionData[lastSavedRegionId].regionName} • ${regionData[lastSavedRegionId].category} • Revenue ${regionData[lastSavedRegionId].revenue}`}
								</Typography>
							</Paper>
						)}
					</Paper>
				</Grid>

				<Grid item xs={12} md={4}>
					<Paper data-testid="map-data-form" sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
						<Typography variant="h5" color="white.main" sx={{ mb: 2 }}>
							Region Data Entry
						</Typography>

						{selectedRegion ? (
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<Typography color="white.main" sx={{ mb: 1 }}>Region</Typography>
									<Typography data-testid="map-data-field-region-name" color="white.main" fontWeight="bold">
										{selectedRegion.name}
									</Typography>
								</Grid>
								<Grid item xs={12}>
									<Typography color="white.main" sx={{ mb: 1 }}>Category</Typography>
									<Dropdown
										items={categoryOptions}
										value={formState.category}
										onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
										testId="map-data-field-category"
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										fullWidth
										label="Revenue"
										type="number"
										value={formState.revenue}
										onChange={(event) => setFormState((current) => ({ ...current, revenue: event.target.value }))}
										inputProps={{ "data-testid": "map-data-field-revenue" }}
										variant="outlined"
										color="secondary"
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										fullWidth
										label="Headcount"
										type="number"
										value={formState.headcount}
										onChange={(event) => setFormState((current) => ({ ...current, headcount: event.target.value }))}
										inputProps={{ "data-testid": "map-data-field-headcount" }}
										variant="outlined"
										color="secondary"
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										fullWidth
										label="Notes"
										multiline
										minRows={3}
										value={formState.notes}
										onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
										inputProps={{ "data-testid": "map-data-field-notes" }}
										variant="outlined"
										color="secondary"
									/>
								</Grid>
								<Grid item xs={12} sx={{ display: "flex", gap: 2 }}>
									<Button data-testid="map-data-form-submit" variant="contained" color="secondary" onClick={handleSave}>
										Save Region Data
									</Button>
									<Button data-testid="map-data-form-cancel" variant="outlined" color="secondary" onClick={handleCancel}>
										Cancel
									</Button>
								</Grid>
							</Grid>
						) : (
							<Typography color="white.main" sx={{ opacity: 0.8 }}>
								Select a region on the map to enter category, revenue, headcount, and notes.
							</Typography>
						)}

						{selectedRegion && regionData[selectedRegion.id] && (
							<Box sx={{ mt: 2 }}>
								<Typography color="white.main" fontWeight="bold">
									Saved snapshot
								</Typography>
								<Typography color="white.main" sx={{ opacity: 0.8 }}>
									{`${regionData[selectedRegion.id].category} • Revenue ${regionData[selectedRegion.id].revenue} • Headcount ${regionData[selectedRegion.id].headcount}`}
								</Typography>
							</Box>
						)}
					</Paper>
				</Grid>
			</Grid>
		</Box>
	);
};

export default MapPage;
