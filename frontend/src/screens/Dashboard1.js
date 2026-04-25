import { useEffect, useState } from "react";
import { Grid, Typography, Box } from "@mui/material";
import Dropdown from "../components/Dropdown.js";
import Card from "../components/Card.js";
import Plot from "../components/Plot.js";
import DatePicker from "../components/DatePicker.js";
import Map from "../components/Map.js";

import colors from "../_colors.scss";
import { findThresholdForMetric, readAlerts } from "../utils/alerts.js";

const availableRegions = ["Thessaloniki", "Athens", "Patras"];
const availableMetrics = ["Revenue", "Expenses", "Profit", "Growth Rate"];
const generateRandomData = (min = 0, max = 10) => Math.random() * (max - min) + min;
const randomDate = () => new Date(new Date(2020, 0, 1).getTime() + Math.random() * (new Date().getTime() - new Date(2020, 0, 1).getTime()));

const Dashboard = () => {
    const [selectedRegion, setSelectedRegion] = useState("Thessaloniki");
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [fromDate, setFromDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    const [toDate, setToDate] = useState(new Date());
    const [months, setMonths] = useState([]);
    const [data, setData] = useState({ keyMetric: { date: randomDate(), value: generateRandomData(0, 100) }, revenue: [], expenses: [], profit: [], growthRate: [] });

    const changePlotData = (fromD, toD) => {
        if (fromD && toD) {
            const from = new Date(fromD);
            const to = new Date(toD);
            const months = [];
            while (from <= to) {
                months.push(from.toLocaleString("en-GB", { month: "short", year: "numeric" }));
                from.setMonth(from.getMonth() + 1);
            }
            setMonths(months);

            const revenue = months.map((month) => generateRandomData(0, 20));
            const expenses = months.map((month) => generateRandomData(0, 30));
            const profit = months.map((month) => generateRandomData(0, 40));
            const growthRate = months.map((month) => generateRandomData(0, 50));
            setData({ revenue, expenses, profit, growthRate, keyMetric: data.keyMetric });
        }
    };

    const changeKeyMetricData = () => {
        const keyMetric = { date: randomDate(), value: generateRandomData(0, 100) };
        setData({ ...data, keyMetric });
    };

    useEffect(() => {
        changePlotData(fromDate, toDate);
    }, [fromDate, toDate]);

    useEffect(() => {
        changeKeyMetricData();
    }, [selectedMetric]);

    useEffect(() => {
        changeKeyMetricData();
        changePlotData(fromDate, toDate);
    }, [selectedRegion]);

    const activeRevenueAlert = findThresholdForMetric(readAlerts(), "Revenue");
    const revenueThreshold = activeRevenueAlert ? Number(activeRevenueAlert.threshold) : 15;
    const revenueThresholdShapes = [{
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        yref: "y",
        y0: revenueThreshold,
        y1: revenueThreshold,
        line: {
            color: colors.error,
            width: 3,
            dash: "dash",
        },
    }];

    return (
        <Grid container py={2} flexDirection="column">
            <Typography variant="h4" gutterBottom color="white.main">
                Analytics
            </Typography>

            <Grid item style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
                <Typography variant="body1" style={{ marginRight: "10px" }} color="white.main">Region:</Typography>
                <Dropdown
                    items={availableRegions.map((region) => ({ value: region, text: region }))}
                    value={selectedRegion}
                    onChange={(event) => setSelectedRegion(event.target.value)}
                />
            </Grid>

            <Grid container spacing={2}>
                <Grid container item sm={12} md={4} spacing={4}>
                        <Grid item width="100%">
                            <Card
                                title="Key Metric"
                                footer={(
                                    <Box
                                        width="100%"
                                        height="100px"
                                        display="flex"
                                        flexDirection="column"
                                        justifyContent="center"
                                        alignItems="center"
                                        backgroundColor="greyDark.main"
                                        py={1}
                                    >
                                        {selectedMetric && (
                                            <>
                                                <Typography variant="body">
                                                    {`Latest value of ${selectedMetric} for ${selectedRegion}`}
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" color="primary.main">
                                                    {`${data.keyMetric.date.toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })} - ${data.keyMetric.value.toFixed(2)}%`}
                                                </Typography>
                                            </>
                                        )}
                                        {!selectedMetric && (
                                            <>
                                                <Typography variant="body1" fontWeight="bold" color="white.main">
                                                    {"No metric selected"}
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                )}
                            >
                                <Box height="100px" display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography width="fit-content" variant="subtitle1">Metric:</Typography>
                                    <Dropdown
                                        width="50%"
                                        height="40px"
                                        size="small"
                                        placeholder="Select"
                                        background="greyDark"
                                        items={availableMetrics.map((metric) => ({ value: metric, text: metric }))}
                                        value={selectedMetric}
                                        onChange={(event) => setSelectedMetric(event.target.value)}
                                    />
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item width="100%">
                            <Card title="Regional Overview">
                                <Map />
                            </Card>
                        </Grid>
                </Grid>

                <Grid item sm={12} md={8}>
                    <Card title="Trends">
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Grid item xs={12} sm={6} display="flex" flexDirection="row" alignItems="center">
                                <Typography variant="subtitle1" align="center" mr={2}>
                                    {"From: "}
                                </Typography>
                                <DatePicker
                                    width="200px"
                                    views={["month", "year"]}
                                    inputFormat="MM/YYYY"
                                    label="From"
                                    background="greyDark"
                                    value={fromDate}
                                    onChange={(value) => setFromDate(value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} display="flex" flexDirection="row" alignItems="center" justifyContent="flex-end">
                                <Typography variant="subtitle1" align="center" mr={2}>
                                    {"To: "}
                                </Typography>
                                <DatePicker
                                    width="200px"
                                    views={["month", "year"]}
                                    inputFormat="MM/YYYY"
                                    label="To"
                                    background="greyDark"
                                    value={toDate}
                                    onChange={(value) => setToDate(value)}
                                />
                            </Grid>
                        </Box>
                        <Grid container spacing={1} width="100%">
                            <Grid item xs={12} md={6}>
                                <Box position="relative">
                                    <Plot
                                        data={[
                                            {
                                                x: months,
                                                y: data.revenue,
                                                type: "lines",
                                                fill: "tozeroy",
                                                color: "third",
                                                line: { shape: "spline", smoothing: 1},
                                                markerSize: 0,
                                                hoverinfo: "none",
                                            },
                                            {
                                                x: months,
                                                y: data.revenue,
                                                type: "scatter",
                                                mode: "markers",
                                                color: "primary",
                                                markerSize: 10,
                                                name: "",
                                                hoverinfo: "none",
                                            },
                                        ]}
                                        showLegend={false}
                                        title="Revenue"
                                        titleColor="primary"
                                        titleFontSize={16}
                                        displayBar={false}
                                        height="250px"
                                        shapes={revenueThresholdShapes}
                                        annotations={[
                                            {
                                                x: months[data.revenue.indexOf(Math.min(...data.revenue))],
                                                y: Math.min(...data.revenue),
                                                xref: "x",
                                                yref: "y",
                                                text: `Min: ${Math.min(...data.revenue).toFixed(2)}%`,
                                                showarrow: true,
                                                font: {
                                                    size: 16,
                                                    color: "#ffffff"
                                                },
                                                align: "center",
                                                arrowhead: 2,
                                                arrowsize: 1,
                                                arrowwidth: 2,
                                                arrowcolor: colors.primary,
                                                borderpad: 4,
                                                bgcolor: colors.primary,
                                                opacity: 0.8
                                            },
                                            {
                                                x: months[data.revenue.indexOf(Math.max(...data.revenue))],
                                                y: Math.max(...data.revenue),
                                                xref: "x",
                                                yref: "y",
                                                text: `Max: ${Math.max(...data.revenue).toFixed(2)}%`,
                                                showarrow: true,
                                                font: {
                                                    size: 16,
                                                    color: "#ffffff"
                                                },
                                                align: "center",
                                                arrowhead: 2,
                                                arrowsize: 1,
                                                arrowwidth: 2,
                                                arrowcolor: colors.primary,
                                                borderpad: 4,
                                                bgcolor: colors.primary,
                                                opacity: 0.8
                                            },
                                        ]}
                                    />
                                    <Box
                                        data-testid="chart-threshold-line"
                                        sx={{
                                            position: "absolute",
                                            left: 24,
                                            right: 24,
                                            top: 56,
                                            borderTop: `2px dashed ${colors.error}`,
                                            pointerEvents: "none",
                                        }}
                                    />
                                </Box>
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.revenue.reduce((acc, curr) => acc + curr, 0) / data.revenue.length).toFixed(2)}%`}
                                </Typography>
                                <Typography variant="body2" textAlign="center" color="white.main" sx={{ opacity: 0.8 }}>
                                    {activeRevenueAlert
                                        ? `Active threshold alert at ${revenueThreshold}%`
                                        : `Suggested threshold line at ${revenueThreshold}% until an alert rule is configured`}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Plot
                                    data={[
                                        {
                                            x: months,
                                            y: data.expenses,
                                            type: "lines",
                                            fill: "tozeroy",
                                            color: "third",
                                            line: { shape: "spline", smoothing: 1},
                                            markerSize: 0,
                                            hoverinfo: "none",
                                        },
                                        {
                                            x: months,
                                            y: data.expenses,
                                            type: "scatter",
                                            mode: "markers",
                                            color: "primary",
                                            markerSize: 10,
                                            name: "",
                                            hoverinfo: "none",
                                        },
                                    ]}
                                    showLegend={false}
                                    title="Expenses"
                                    titleColor="primary"
                                    titleFontSize={16}
                                    displayBar={false}
                                    height="250px"
                                    annotations={[
                                        {
                                            x: months[data.expenses.indexOf(Math.min(...data.expenses))],
                                            y: Math.min(...data.expenses),
                                            xref: "x",
                                            yref: "y",
                                            text: `Min: ${Math.min(...data.expenses).toFixed(2)}%`,
                                            showarrow: true,
                                            font: {
                                                size: 16,
                                                color: "#ffffff"
                                            },
                                            align: "center",
                                            arrowhead: 2,
                                            arrowsize: 1,
                                            arrowwidth: 2,
                                            arrowcolor: colors.primary,
                                            borderpad: 4,
                                            bgcolor: colors.primary,
                                            opacity: 0.8
                                        },
                                        {
                                            x: months[data.expenses.indexOf(Math.max(...data.expenses))],
                                            y: Math.max(...data.expenses),
                                            xref: "x",
                                            yref: "y",
                                            text: `Max: ${Math.max(...data.expenses).toFixed(2)}%`,
                                            showarrow: true,
                                            font: {
                                                size: 16,
                                                color: "#ffffff"
                                            },
                                            align: "center",
                                            arrowhead: 2,
                                            arrowsize: 1,
                                            arrowwidth: 2,
                                            arrowcolor: colors.primary,
                                            borderpad: 4,
                                            bgcolor: colors.primary,
                                            opacity: 0.8
                                        },
                                    ]}
                                />
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.expenses.reduce((acc, curr) => acc + curr, 0) / data.expenses.length).toFixed(2)}%`}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Plot
                                    data={[
                                        {
                                            x: months,
                                            y: data.profit,
                                            type: "lines",
                                            fill: "tozeroy",
                                            color: "third",
                                            line: { shape: "spline", smoothing: 1},
                                            markerSize: 0,
                                            hoverinfo: "none",
                                        },
                                        {
                                            x: months,
                                            y: data.profit,
                                            type: "scatter",
                                            mode: "markers",
                                            color: "primary",
                                            markerSize: 10,
                                            name: "",
                                            hoverinfo: "none",
                                        },
                                    ]}
                                    showLegend={false}
                                    title="Profit"
                                    titleColor="primary"
                                    titleFontSize={16}
                                    displayBar={false}
                                    height="250px"
                                    annotations={[
                                        {
                                            x: months[data.profit.indexOf(Math.min(...data.profit))],
                                            y: Math.min(...data.profit),
                                            xref: "x",
                                            yref: "y",
                                            text: `Min: ${Math.min(...data.profit).toFixed(2)}%`,
                                            showarrow: true,
                                            font: {
                                                size: 16,
                                                color: "#ffffff"
                                            },
                                            align: "center",
                                            arrowhead: 2,
                                            arrowsize: 1,
                                            arrowwidth: 2,
                                            arrowcolor: colors.primary,
                                            borderpad: 4,
                                            bgcolor: colors.primary,
                                            opacity: 0.8
                                        },
                                        {
                                            x: months[data.profit.indexOf(Math.max(...data.profit))],
                                            y: Math.max(...data.profit),
                                            xref: "x",
                                            yref: "y",
                                            text: `Max: ${Math.max(...data.profit).toFixed(2)}%`,
                                            showarrow: true,
                                            font: {
                                                size: 16,
                                                color: "#ffffff"
                                            },
                                            align: "center",
                                            arrowhead: 2,
                                            arrowsize: 1,
                                            arrowwidth: 2,
                                            arrowcolor: colors.primary,
                                            borderpad: 4,
                                            bgcolor: colors.primary,
                                            opacity: 0.8
                                        },
                                    ]}
                                />
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.profit.reduce((acc, curr) => acc + curr, 0) / data.profit.length).toFixed(2)}%`}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Plot
                                    data={[
                                        {
                                            x: months,
                                            y: data.growthRate,
                                            type: "lines",
                                            fill: "tozeroy",
                                            color: "third",
                                            line: { shape: "spline", smoothing: 1},
                                            markerSize: 0,
                                            hoverinfo: "none",
                                        },
                                        {
                                            x: months,
                                            y: data.growthRate,
                                            type: "scatter",
                                            mode: "markers",
                                            color: "primary",
                                            markerSize: 10,
                                            name: "",
                                            hoverinfo: "none",
                                        },
                                    ]}
                                    showLegend={false}
                                    title="Growth Rate"
                                    titleColor="primary"
                                    titleFontSize={16}
                                    displayBar={false}
                                    height="250px"
                                    annotations={[
                                        {
                                            x: months[data.growthRate.indexOf(Math.min(...data.growthRate))],
                                            y: Math.min(...data.growthRate),
                                            xref: "x",
                                            yref: "y",
                                            text: `Min: ${Math.min(...data.growthRate).toFixed(2)}%`,
                                            showarrow: true,
                                            font: {
                                                size: 16,
                                                color: "#ffffff"
                                            },
                                            align: "center",
                                            arrowhead: 2,
                                            arrowsize: 1,
                                            arrowwidth: 2,
                                            arrowcolor: colors.primary,
                                            borderpad: 4,
                                            bgcolor: colors.primary,
                                            opacity: 0.8
                                        },
                                        {
                                            x: months[data.growthRate.indexOf(Math.max(...data.growthRate))],
                                            y: Math.max(...data.growthRate),
                                            xref: "x",
                                            yref: "y",
                                            text: `Max: ${Math.max(...data.growthRate).toFixed(2)}%`,
                                            showarrow: true,
                                            font: {
                                                size: 16,
                                                color: "#ffffff"
                                            },
                                            align: "center",
                                            arrowhead: 2,
                                            arrowsize: 1,
                                            arrowwidth: 2,
                                            arrowcolor: colors.primary,
                                            borderpad: 4,
                                            bgcolor: colors.primary,
                                            opacity: 0.8
                                        },
                                    ]}
                                />
                                <Typography variant="body1" textAlign="center">
                                    {`Average: ${(data.growthRate.reduce((acc, curr) => acc + curr, 0) / data.growthRate.length).toFixed(2)}%`}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Dashboard;
