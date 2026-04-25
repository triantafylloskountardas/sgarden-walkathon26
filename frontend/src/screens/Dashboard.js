import { useEffect, useState } from "react";
import { Grid, Typography, Box, Paper } from "@mui/material";

import Dropdown from "../components/Dropdown.js";
import Card from "../components/Card.js";
import Plot from "../components/Plot.js";
import { useI18n } from "../utils/index.js";

const availableRegions = ["Thessaloniki", "Athens", "Patras"];
const generateRandomData = (minimum = 0, maximum = 100) => {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

const formatNumber = (number, symbol = "", showSign = true) => {
    if (!number) return "-";

    let formattedNumber = (number > 0 && showSign) ? "+" : "";
    formattedNumber += number;
    formattedNumber += symbol;

    return formattedNumber;
};

const Dashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState("Thessaloniki");
    const [data, setData] = useState({});
    const [viewerCount] = useState(3);
    const { t } = useI18n();

    useEffect(() => {
        const newData = {
            monthlyRevenue: {
                value: generateRandomData(),
                change: generateRandomData(-100, 100),
            },
            newCustomers: {
                value: generateRandomData(0, 10_000),
                change: generateRandomData(-100, 100),
            },
            activeSubscriptions: {
                value: generateRandomData(0, 100_000),
                change: generateRandomData(-100, 100),
            },
            weeklySales: Array.from({ length: 7 }, () => generateRandomData(0, 100)),
            revenueTrend: Array.from({ length: 12 }, () => generateRandomData(0, 500)),
            customerSatisfaction: Array.from({ length: 12 }, () => generateRandomData(0, 500)),
        };

        setData(newData);
    }, [selectedRegion]);

    return (
        <Grid container py={2} flexDirection="column">
            <Typography variant="h4" gutterBottom color="white.main">
                {t("dashboard.overview")}
            </Typography>

            <Grid item style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
                <Typography variant="body1" style={{ marginRight: "10px" }} color="white.main">{t("dashboard.region")}</Typography>
                <Dropdown
                    items={availableRegions.map((region) => ({ value: region, text: region }))}
                    value={selectedRegion}
                    onChange={(event) => setSelectedRegion(event.target.value)}
                />
            </Grid>

            <Paper sx={{ p: 2, mb: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor: "success.main",
                                    boxShadow: "0 0 10px rgba(76, 175, 80, 0.6)",
                                }}
                            />
                            <Typography data-testid="realtime-status" color="white.main" fontWeight="bold">
                                {t("dashboard.realtimeStatus")}
                            </Typography>
                            <Typography data-testid="realtime-status-connected" color="success.main" fontWeight="bold">
                                {t("dashboard.connected")}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box data-testid="realtime-viewers" display="flex" justifyContent={{ xs: "flex-start", md: "flex-end" }} alignItems="center" gap={1}>
                            <Typography color="white.main">{t("dashboard.activeViewers")}</Typography>
                            <Typography data-testid="realtime-viewer-count" color="secondary.main" fontWeight="bold">
                                {viewerCount}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Card title={t("dashboard.monthlyRevenue")}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h3" fontWeight="bold" color="secondary.main">{formatNumber(data?.monthlyRevenue?.value, "%", false)}</Typography>
                            <Grid item display="flex" flexDirection="row">
                                <Typography variant="body" color={data?.monthlyRevenue?.change > 0 ? "success.main" : "error.main"}>
                                    {formatNumber(data?.monthlyRevenue?.change, "%")}
                                </Typography>
                                <Typography variant="body" color="secondary.main" ml={1}>
                                    {t("dashboard.thanLastMonth")}
                                </Typography>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card title={t("dashboard.newCustomers")}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h3" fontWeight="bold" color="secondary.main">{formatNumber(data?.newCustomers?.value, "", false)}</Typography>
                            <Grid item display="flex" flexDirection="row">
                                <Typography variant="body" color={data?.newCustomers?.change > 0 ? "success.main" : "error.main"}>
                                    {formatNumber(data?.newCustomers?.change, "%")}
                                </Typography>
                                <Typography variant="body" color="secondary.main" ml={1}>
                                    {t("dashboard.thanLastMonth")}
                                </Typography>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card title={t("dashboard.activeSubscriptions")}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h3" fontWeight="bold" color="secondary.main">{formatNumber(data?.activeSubscriptions?.value, "", false)}</Typography>
                            <Grid item display="flex" flexDirection="row">
                                <Typography variant="body" color={data?.activeSubscriptions?.change > 0 ? "success.main" : "error.main"}>
                                    {formatNumber(data?.activeSubscriptions?.change, "%")}
                                </Typography>
                                <Typography variant="body" color="secondary.main" ml={1}>
                                    {t("dashboard.thanLastMonth")}
                                </Typography>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Card
                        title={t("dashboard.weeklySales")}
                        footer={(
                            <Grid sx={{ width: "100%", borderTop: "1px solid gray" }}>
                                <Typography variant="body2" component="p" sx={{ marginTop: "10px" }}>{"🕗 averages (last month)"}</Typography>
                            </Grid>
                        )}
                        footerBackgroundColor="white"
                        footerColor="gray"
                    >
                        <Plot
                            data={[
                                {
                                    x: ["M", "T", "W", "T", "F", "S", "S"],
                                    y: data?.weeklySales,
                                    type: "bar",
                                    color: "third",
                                },
                            ]}
                            showLegend={false}
                            title="Number of transactions per day"
                            titleColor="primary"
                            titleFontSize={16}
                            displayBar={false}
                        />
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card
                        title={t("dashboard.revenueTrend")}
                        footer={(
                            <Grid sx={{ width: "100%", borderTop: "1px solid gray" }}>
                                <Typography variant="body2" component="p" sx={{ marginTop: "10px" }}>{"🕗 updated 4min ago"}</Typography>
                            </Grid>
                        )}
                        footerBackgroundColor="white"
                        footerColor="gray"
                    >
                        <Plot
                            data={[{
                                x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Dec"],
                                y: data?.revenueTrend,
                                type: "lines+markers",
                                color: "third",
                            }]}
                            showLegend={false}
                            title="15% increase in revenue this month"
                            titleColor="primary"
                            titleFontSize={16}
                            displayBar={false}
                        />
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card
                        title={t("dashboard.customerSatisfaction")}
                        footer={(
                            <Grid sx={{ width: "100%", borderTop: "1px solid gray" }}>
                                <Typography variant="body2" component="p" sx={{ marginTop: "10px" }}>{"🕗 just updated"}</Typography>
                            </Grid>
                        )}
                        footerBackgroundColor="white"
                        footerColor="gray"
                    >
                        <Plot
                            data={[{
                                x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Dec"],
                                y: data?.customerSatisfaction,
                                type: "lines+markers",
                                color: "third",
                            }]}
                            showLegend={false}
                            title="Customer satisfaction score over time"
                            titleColor="primary"
                            titleFontSize={16}
                            displayBar={false}
                        />
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
