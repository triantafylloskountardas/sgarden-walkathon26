import { useEffect, useState, memo } from "react";
import { styled } from "@mui/material/styles";
import {
	AppBar,
	Toolbar,
	Typography,
	Menu,
	MenuItem,
	IconButton,
	Button,
	Paper,
	Breadcrumbs,
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	List,
	ListItemButton,
	ListItemText,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
	ExpandMore,
	MoreVert as MoreIcon,
	Search as SearchIcon,
	Close as CloseIcon,
	History as HistoryIcon,
	Language as LanguageIcon,
} from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { Image } from "mui-image";

import { jwt, capitalize, useI18n } from "../utils/index.js";
import logo from "../assets/images/logo.png";
import { ReactComponent as LogoutIcon } from "../assets/images/logout.svg";

const useStyles = makeStyles((theme) => ({
	grow: {
		flexGrow: 1,
		flexBasis: "auto",
		background: "white",
		zIndex: 1200,
		height: "70px",
	},
	root: {
		height: "30px",
		padding: theme.spacing(0.5),
		borderRadius: "0px",
		background: theme.palette.grey.main,
	},
	icon: {
		marginRight: 0.5,
		width: 20,
		height: 20,
	},
	expanded: {
		background: "transparent",
	},
	innerSmallAvatar: {
		color: theme.palette.common.black,
		fontSize: "inherit",
	},
	anchorOriginBottomRightCircular: {
		".MuiBadge-anchorOriginBottomRightCircular": {
			right: 0,
			bottom: 0,
		},
	},
	avatar: {
		width: "30px",
		height: "30px",
		background: "white",
	},
	iconButton: {
		padding: "3px 6px",
	},
	menuItemButton: {
		width: "100%",
		bgcolor: "grey.light",
		"&:hover": {
			bgcolor: "grey.dark",
		},
	},
	grey: {
		color: "grey.500",
	},
	svgIcon: {
		width: "100%",
		height: "100%",
		"& g": {
			"& path": {
				fill: theme.palette.secondary.main,
			},
		},
	},
}));

const ButtonWithText = ({ text, icon, more, handler, testId }) => (
	<Button data-testid={testId} sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1, mx: 1 }} onClick={(event) => handler(event)}>
		{icon && <div style={{ width: "100%", height: "100%" }}>{icon}</div>}
		<Typography align="center" color="secondary.main" fontSize="small" fontWeight="bold" display="flex" alignItems="center" sx={{ textTransform: "capitalize" }}>
			{text}
			{more && <ExpandMore />}
		</Typography>
	</Button>
);

const RECENT_SEARCHES_KEY = "sgarden-global-search-recent";
const MAX_RECENT_SEARCHES = 5;

const sanitizeCategory = (value) => value.toLowerCase().replace(/\s+/g, "-");

const readRecentSearches = () => {
	try {
		if (typeof window === "undefined") return [];

		const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
		if (!stored) return [];

		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const writeRecentSearches = (recentSearches) => {
	try {
		if (typeof window === "undefined") return;

		window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches.slice(0, MAX_RECENT_SEARCHES)));
	} catch {
		// Ignore storage failures so search remains usable in restricted contexts.
	}
};

const getSearchItems = (isAdmin, t) => [
	{
		id: "dashboard-overview",
		title: t("search.item.dashboardOverview.title"),
		description: t("search.item.dashboardOverview.description"),
		path: "/dashboard",
		category: t("search.category.dashboards"),
		keywords: ["overview", "dashboard", "home", "kpi"],
	},
	{
		id: "dashboard-analytics",
		title: t("search.item.dashboardAnalytics.title"),
		description: t("search.item.dashboardAnalytics.description"),
		path: "/dashboard1",
		category: t("search.category.dashboards"),
		keywords: ["analytics", "dashboard1", "trends", "filters"],
	},
	{
		id: "dashboard-insights",
		title: t("search.item.dashboardInsights.title"),
		description: t("search.item.dashboardInsights.description"),
		path: "/dashboard2",
		category: t("search.category.dashboards"),
		keywords: ["insights", "dashboard2", "reports", "performance"],
	},
	{
		id: "profile",
		title: t("search.item.profile.title"),
		description: t("search.item.profile.description"),
		path: "/profile",
		category: t("search.category.account"),
		keywords: ["profile", "account", "password", "user"],
	},
	{
		id: "import",
		title: t("search.item.import.title"),
		description: t("search.item.import.description"),
		path: "/import",
		category: t("search.category.data"),
		keywords: ["import", "csv", "json", "upload", "data"],
	},
	{
		id: "sales-data",
		title: t("search.item.salesData.title"),
		description: t("search.item.salesData.description"),
		path: "/data/manage",
		category: t("search.category.data"),
		keywords: ["sales", "records", "crud", "manage", "data"],
	},
	{
		id: "map",
		title: t("search.item.map.title"),
		description: t("search.item.map.description"),
		path: "/map",
		category: t("search.category.data"),
		keywords: ["map", "regions", "geography", "visualization"],
	},
	{
		id: "reports",
		title: t("search.item.reports.title"),
		description: t("search.item.reports.description"),
		path: "/reports",
		category: t("search.category.data"),
		keywords: ["reports", "builder", "print", "pdf"],
	},
	{
		id: "alerts",
		title: t("search.item.alerts.title"),
		description: t("search.item.alerts.description"),
		path: "/alerts",
		category: t("search.category.data"),
		keywords: ["alerts", "thresholds", "rules", "notifications"],
	},
	...(isAdmin ? [{
		id: "users",
		title: t("search.item.users.title"),
		description: t("search.item.users.description"),
		path: "/users",
		category: t("search.category.admin"),
		keywords: ["users", "admin", "roles", "permissions"],
	}] : []),
];

const filterSearchItems = (items, query) => {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) return [];

	return items.filter((item) => {
		const haystack = [
			item.title,
			item.description,
			item.category,
			item.path,
			...item.keywords,
		].join(" ").toLowerCase();

		return haystack.includes(normalizedQuery);
	});
};

const groupResultsByCategory = (items) => {
	const grouped = [];

	for (const item of items) {
		const existingGroup = grouped.find((group) => group.category === item.category);
		if (existingGroup) {
			existingGroup.items.push(item);
		} else {
			grouped.push({ category: item.category, items: [item] });
		}
	}

	return grouped;
};

const Header = ({ isAuthenticated }) => {
	const classes = useStyles();
	const { language, setLanguage, t } = useI18n();

	const location = useLocation();
	const navigate = useNavigate();
	const isAdmin = jwt.isAdmin();
	const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
	const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [recentSearches, setRecentSearches] = useState(() => readRecentSearches());
	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
	const searchItems = getSearchItems(isAdmin, t);
	const filteredResults = filterSearchItems(searchItems, searchValue);
	const groupedResults = groupResultsByCategory(filteredResults);

	const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);
	const handleMobileMenuOpen = (event) => setMobileMoreAnchorEl(event.currentTarget);
	const handleLanguageMenuOpen = (event) => setLanguageAnchorEl(event.currentTarget);
	const handleLanguageMenuClose = () => setLanguageAnchorEl(null);
	const openSearch = () => setSearchOpen(true);
	const closeSearch = () => {
		setSearchOpen(false);
		setSearchValue("");
	};

	const pushRecentSearch = (item) => {
		const updatedSearches = [
			item,
			...recentSearches.filter((recentItem) => recentItem.id !== item.id),
		].slice(0, MAX_RECENT_SEARCHES);

		setRecentSearches(updatedSearches);
		writeRecentSearches(updatedSearches);
	};

	const navigateFromSearch = (item) => {
		pushRecentSearch(item);
		navigate(item.path);
		closeSearch();
	};

	useEffect(() => {
		if (!isAuthenticated) return undefined;

		const onKeyDown = (event) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setSearchOpen(true);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isAuthenticated]);

	const CrumpLink = styled(Link)(({ theme }) => ({ display: "flex", color: theme.palette.third.main }));

	const buttons = [
		{
			icon: null,
			text: t("header.profile"),
			handler: () => {
				navigate("/profile");
			},
			testId: "profile-nav-link",
		},
		{
			icon: <LogoutIcon className={classes.svgIcon} />,
			text: t("header.logout"),
			handler: () => {
				jwt.destroyToken();
				navigate("/");
			},
		},
	];

	const renderMobileMenu = (
		<Menu
			keepMounted
			anchorEl={mobileMoreAnchorEl}
			anchorOrigin={{ vertical: "top", horizontal: "right" }}
			transformOrigin={{ vertical: "top", horizontal: "right" }}
			open={isMobileMenuOpen}
			onClose={handleMobileMenuClose}
		>
			{buttons.map((button) => (
				<MenuItem key={button.text} onClick={button.handler} data-testid={button.mobileTestId}>
					{button.icon && <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>{button.icon}</Box>}
					<p style={{ marginLeft: button.icon ? "5px" : 0 }}>{button.text}</p>
					{button.more && <ExpandMore />}
				</MenuItem>
			))}
		</Menu>
	);

	const pathnames = location.pathname.split("/").filter(Boolean);
	const crumps = [];

	for (const [ind, path] of pathnames.entries()) {
		let text = capitalize(path);
		crumps.push(<CrumpLink to={`/${pathnames.slice(0, ind + 1).join("/")}`}>{text}</CrumpLink>);
	}

	return (
		<>
			<AppBar id="header" position="static" className={classes.grow}>
				<Toolbar className="header-container">
					<Box component={Link} to="/">
						<Image src={logo} alt="Logo" sx={{ p: 0, my: 0, height: "100%", maxWidth: "200px" }} />
					</Box>
					<Box className={classes.grow} style={{ height: "100%" }} />
					{isAuthenticated
						&& (
							<>
								<Box sx={{ display: { xs: "none", sm: "none", md: "flex" }, alignItems: "center", py: 1, mr: 1 }}>
									<Button
										data-testid="language-switcher"
										color="secondary"
										variant="outlined"
										startIcon={<LanguageIcon />}
										onClick={handleLanguageMenuOpen}
										sx={{ textTransform: "none", mr: 1 }}
									>
										<span data-testid="language-active">{t(`language.active.${language}`)}</span>
									</Button>
									<Button
										data-testid="global-search-trigger"
										color="secondary"
										variant="outlined"
										startIcon={<SearchIcon />}
										onClick={openSearch}
										sx={{ textTransform: "none" }}
									>
										{t("header.search")}
										<Typography component="span" sx={{ ml: 1, color: "grey.500", fontSize: 12 }}>
											Ctrl+K
										</Typography>
									</Button>
								</Box>
								<Box sx={{ display: { xs: "flex", sm: "flex", md: "none" }, alignItems: "center", mr: 1 }}>
									<IconButton data-testid="global-search-trigger-mobile" color="secondary" onClick={openSearch}>
										<SearchIcon />
									</IconButton>
								</Box>
								<Box sx={{ display: { xs: "none", sm: "none", md: "flex" }, height: "100%", py: 1 }}>
									{buttons.map((button) => (
										<ButtonWithText
											key={button.text}
											icon={button.icon}
											text={button.text}
											handler={button.handler}
											more={button.more} testId={button.testId}
										/>
									))}
								</Box>
								<Box sx={{ display: { xs: "flex", sm: "flex", md: "none" } }}>
									<IconButton color="primary" onClick={handleMobileMenuOpen}><MoreIcon /></IconButton>
								</Box>
							</>
						)}
				</Toolbar>
			</AppBar>
			{isAuthenticated
				&& (
					<Paper elevation={0} className={classes.root}>
						<Breadcrumbs className="header-container">{crumps.map((e, ind) => <div key={`crump_${ind}`}>{e}</div>)}</Breadcrumbs>
					</Paper>
				)}
			{isAuthenticated
				&& (
					<>
						{renderMobileMenu}
					</>
				)}
			<Menu
				anchorEl={languageAnchorEl}
				open={Boolean(languageAnchorEl)}
				onClose={handleLanguageMenuClose}
			>
				<MenuItem
					data-testid="language-option-en"
					onClick={() => {
						setLanguage("en");
						handleLanguageMenuClose();
					}}
				>
					{t("language.option.en")}
				</MenuItem>
				<MenuItem
					data-testid="language-option-el"
					onClick={() => {
						setLanguage("el");
						handleLanguageMenuClose();
					}}
				>
					{t("language.option.el")}
				</MenuItem>
			</Menu>
			<Dialog
				open={searchOpen}
				onClose={closeSearch}
				fullWidth
				maxWidth="sm"
				PaperProps={{ "data-testid": "global-search-dialog" }}
			>
				<DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					{t("header.globalSearch")}
					<IconButton data-testid="global-search-close" onClick={closeSearch}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						autoFocus
						label={t("header.searchLabel")}
						placeholder={t("header.searchPlaceholder")}
						value={searchValue}
						onChange={(event) => setSearchValue(event.target.value)}
						inputProps={{ "data-testid": "global-search-input" }}
					/>
					{searchValue.trim()
						? (
							<Box data-testid="global-search-results" sx={{ mt: 2 }}>
								{groupedResults.length > 0
									? groupedResults.map((group) => (
										<Box key={group.category} sx={{ mb: 2 }}>
											<Typography
												data-testid={`global-search-category-${sanitizeCategory(group.category)}`}
												variant="overline"
												color="grey.500"
												sx={{ display: "block", mb: 1 }}
											>
												{group.category}
											</Typography>
											<List disablePadding>
												{group.items.map((item) => (
													<ListItemButton
														key={item.id}
														data-testid={`global-search-result-${item.id}`}
														onClick={() => navigateFromSearch(item)}
														sx={{ borderRadius: 1, mb: 0.5 }}
													>
														<ListItemText
															primary={(
																<Typography data-testid={`global-search-result-title-${item.id}`} color="secondary.main" fontWeight="bold">
																	{item.title}
																</Typography>
															)}
															secondary={`${item.description} - ${item.path}`}
														/>
													</ListItemButton>
												))}
											</List>
										</Box>
									))
									: (
										<Typography data-testid="global-search-no-results" color="white.main" sx={{ mt: 1 }}>
											{t("header.searchNoResults")}
										</Typography>
									)}
							</Box>
						)
						: (
							<Box data-testid="global-search-recent" sx={{ mt: 2 }}>
								<Typography variant="overline" color="grey.500" sx={{ display: "block", mb: 1 }}>
									{t("header.searchRecent")}
								</Typography>
								{recentSearches.length > 0
									? (
										<List disablePadding>
											{recentSearches.map((item, index) => (
												<ListItemButton
													key={`${item.id}-${index}`}
													data-testid={`global-search-recent-item-${index}`}
													onClick={() => navigateFromSearch(item)}
													sx={{ borderRadius: 1, mb: 0.5 }}
												>
													<HistoryIcon sx={{ mr: 1, color: "grey.500" }} />
													<ListItemText primary={item.title} secondary={`${item.category} - ${item.path}`} />
												</ListItemButton>
											))}
										</List>
									)
									: (
										<Typography color="white.main">
											{t("header.searchRecentEmpty")}
										</Typography>
									)}
							</Box>
						)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setSearchValue("")}>{t("common.clear")}</Button>
					<Button onClick={closeSearch} variant="contained" color="secondary">
						{t("common.done")}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default memo(Header);
