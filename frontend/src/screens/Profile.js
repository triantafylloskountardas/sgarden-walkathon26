import { useEffect, useState } from "react";
import { Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";

import { changePassword, getProfile, updateProfile } from "../api/index.js";
import { dayjs, useSnackbar, useI18n } from "../utils/index.js";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [editable, setEditable] = useState(false);
    const [profileForm, setProfileForm] = useState({ username: "", email: "" });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const { success, error } = useSnackbar();
    const { t } = useI18n();

    const loadProfile = async () => {
        try {
            const response = await getProfile();
            if (response?.success) {
                setProfile(response.profile);
                setProfileForm({ username: response.profile.username || "", email: response.profile.email || "" });
            } else {
                error(response?.message || t("profile.error.load"));
            }
        } catch (err) {
            error(t("profile.error.load"));
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleProfileChange = (key) => (event) => {
        setProfileForm((current) => ({ ...current, [key]: event.target.value }));
    };

    const handlePasswordChange = (key) => (event) => {
        setPasswordForm((current) => ({ ...current, [key]: event.target.value }));
    };

    const handleSaveProfile = async () => {
        if (!profileForm.username.trim() || !profileForm.email.trim()) {
            error(t("profile.error.empty"));
            return;
        }

        try {
            const response = await updateProfile(profileForm);
            if (response?.success) {
                setProfile(response.profile);
                setEditable(false);
                success(t("profile.success.update"));
            } else {
                error(response?.message || t("profile.error.update"));
            }
        } catch (err) {
            error(t("profile.error.update"));
        }
    };

    const handleSavePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            error(t("profile.error.passwordRequired"));
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            error(t("profile.error.passwordMatch"));
            return;
        }

        try {
            const response = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            if (response?.success) {
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                success(t("profile.success.passwordUpdate"));
            } else {
                error(response?.message || t("profile.error.passwordUpdate"));
            }
        } catch (err) {
            error(t("profile.error.passwordUpdate"));
        }
    };

    return (
        <Box data-testid="profile-page" sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom color="white.main">
                {t("profile.title")}
            </Typography>

            <Paper sx={{ p: 3, mb: 3, backgroundColor: "rgba(255,255,255,0.06)" }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="grey.400" gutterBottom>
                            {t("profile.username")}
                        </Typography>
                        {editable ? (
                            <TextField
                                fullWidth
                                value={profileForm.username}
                                onChange={handleProfileChange("username")}
                                inputProps={{ "data-testid": "profile-username" }}
                                variant="outlined"
                                color="secondary"
                            />
                        ) : (
                            <Typography data-testid="profile-username" color="white.main">
                                {profile?.username || "-"}
                            </Typography>
                        )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="grey.400" gutterBottom>
                            {t("profile.email")}
                        </Typography>
                        {editable ? (
                            <TextField
                                fullWidth
                                value={profileForm.email}
                                onChange={handleProfileChange("email")}
                                inputProps={{ "data-testid": "profile-email" }}
                                variant="outlined"
                                color="secondary"
                            />
                        ) : (
                            <Typography data-testid="profile-email" color="white.main">
                                {profile?.email || "-"}
                            </Typography>
                        )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="grey.400" gutterBottom>
                            {t("profile.role")}
                        </Typography>
                        <Typography data-testid="profile-role" color="white.main">
                            {profile?.role || "-"}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="grey.400" gutterBottom>
                            {t("profile.accountCreated")}
                        </Typography>
                        <Typography data-testid="profile-created-at" color="white.main">
                            {profile?.createdAt ? dayjs(profile.createdAt).format("LLL") : "-"}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="grey.400" gutterBottom>
                            {t("profile.lastActive")}
                        </Typography>
                        <Typography data-testid="profile-last-active" color="white.main">
                            {profile?.lastActive ? dayjs(profile.lastActive).format("LLL") : "-"}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} display="flex" gap={2} alignItems="center">
                        <Button
                            data-testid="profile-edit-button"
                            variant="contained"
                            color="secondary"
                            onClick={() => setEditable(true)}
                        >
                            {t("profile.editProfile")}
                        </Button>
                        {editable && (
                            <Button
                                data-testid="profile-save-button"
                                variant="contained"
                                color="primary"
                                onClick={handleSaveProfile}
                            >
                                {t("profile.saveChanges")}
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.06)" }}>
                <Typography variant="h5" gutterBottom color="white.main">
                    {t("profile.changePassword")}
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label={t("profile.currentPassword")}
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange("currentPassword")}
                            inputProps={{ "data-testid": "profile-password-current" }}
                            variant="outlined"
                            color="secondary"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label={t("profile.newPassword")}
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange("newPassword")}
                            inputProps={{ "data-testid": "profile-password-new" }}
                            variant="outlined"
                            color="secondary"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label={t("profile.confirmPassword")}
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange("confirmPassword")}
                            inputProps={{ "data-testid": "profile-password-confirm" }}
                            variant="outlined"
                            color="secondary"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            data-testid="profile-password-save"
                            variant="contained"
                            color="primary"
                            onClick={handleSavePassword}
                        >
                            {t("profile.saveNewPassword")}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default Profile;
