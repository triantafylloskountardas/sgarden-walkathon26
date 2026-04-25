import { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import Dropdown from "../components/Dropdown.js";
import Card from "../components/Card.js";
import Plot from "../components/Plot.js";

import { getData } from "../api/index.js";
import { useI18n } from "../utils/index.js";

const availableRegions = ["Thessaloniki", "Athens", "Patras"];

const Dashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState("Thessaloniki");
    const [data, setData] = useState({ quarterlySalesDistribution: {}, budgetVsActual: {}, timePlot: {} });
    const { t } = useI18n();

    useEffect(() => {
        getData().then((tempData) => {
            const { success, quarterlySalesDistribution, budgetVsActual, timePlot } = tempData;

            if (success) {
                setData({ quarterlySalesDistribution, budgetVsActual, timePlot });
            }
        });
    }, [selectedRegion]);

    return (
        <Grid container py={2} flexDirection="column">
            <Typography variant="h4" gutterBottom color="white.main">
                {t("dashboard.insights")}
            </Typography>

            <Grid item style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
                <Typography variant="body1" style={{ marginRight: "10px" }} color="white.main">{t("dashboard.region")}</Typography>
                <Dropdown
                    items={availableRegions.map((region) => ({ value: region, text: region }))}
                    value={selectedRegion}
                    onChange={(event) => setSelectedRegion(event.target.value)}
                />
            </Grid>

            <Grid container spacing={2}>
                <Grid item sm={12} md={6}>
                    <Card title={t("dashboard.quarterlySalesDistribution")}>
                        <Plot
                            data={[
                                {
                                    title: "Q1",
                                    y: data?.quarterlySalesDistribution?.Q1,
                                    type: "box",
                                    color: "primary",
                                },
                                {
                                    title: "Q2",
                                    y: data?.quarterlySalesDistribution?.Q2,
                                    type: "box",
                                    color: "secondary",
                                },
                                {
                                    title: "Q3",
                                    y: data?.quarterlySalesDistribution?.Q3,
                                    type: "box",
                                    color: "third",
                                },
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
                                    y: Object.values(data?.budgetVsActual).map(month => month.budget),
                                    type: "bar",
                                    color: "primary",
                                    title: t("dashboard.projected"),
                                },
                                {
                                    x: ["January", "February", "March", "April", "May", "June"],
                                    y: Object.values(data?.budgetVsActual).map(month => month.actual),
                                    type: "bar",
                                    color: "secondary",
                                    title: t("dashboard.actual"),
                                },
                                {
                                    x: ["January", "February", "March", "April", "May", "June"],
                                    y: Object.values(data?.budgetVsActual).map(month => month.forecast),
                                    type: "bar",
                                    color: "third",
                                    title: t("dashboard.forecast"),
                                },
                            ]}
                            showLegend={true}
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
                                {
                                    title: t("dashboard.projected"),
                                    x: Array.from({ length: 20 }, (_, i) => i + 1),
                                    y: data?.timePlot?.projected,
                                    type: "line",
                                    color: "primary",
                                },
                                {
                                    title: t("dashboard.actual"),
                                    x: Array.from({ length: 20 }, (_, i) => i + 1),
                                    y: data?.timePlot?.actual,
                                    type: "line",
                                    color: "secondary",
                                },
                                {
                                    title: t("dashboard.historicalAvg"),
                                    x: Array.from({ length: 20 }, (_, i) => i + 1),
                                    y: data?.timePlot?.historicalAvg,
                                    type: "line",
                                    color: "third",
                                },
                            ]}
                            showLegend={true}
                            displayBar={false}
                            height="300px"
                            marginBottom="40"
                        />
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
