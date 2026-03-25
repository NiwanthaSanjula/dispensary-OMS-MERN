import { useState, useEffect } from "react";
import settingsService, {
    type UpdateSettingsPayload,
} from "../../api/services/settings.service";

/**
 * Doctor Settings Page
 * Two sections:
 *   1. Dispensary settings (queue limits, times, etc.)
 *   2. Change password
 */
const DoctorSettings = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // ── Settings form ──
    const [form, setForm] = useState<UpdateSettingsPayload>({
        dispensaryName: "",
        doctorName: "",
        openingTime: "09:00",
        closingTime: "17:00",
        avgConsultationMinutes: 15,
        maxDailyLimit: 40,
        advanceBookingDays: 7,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");

    // ── Password form ──
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isChangingPw, setIsChangingPw] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState("");

    // ─────────────────────────────────────────────────────────────────
    // Load settings on mount
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const data = await settingsService.get();
                setForm({
                    dispensaryName: data.dispensaryName || "",
                    doctorName: data.doctorName || "",
                    openingTime: data.openingTime || "09:00",
                    closingTime: data.closingTime || "17:00",
                    avgConsultationMinutes: data.avgConsultationMinutes || 15,
                    maxDailyLimit: data.maxDailyLimit || 40,
                    advanceBookingDays: data.advanceBookingDays || 7,
                });
            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // Save settings
    // ─────────────────────────────────────────────────────────────────
    const handleSaveSettings = async () => {
        setIsSaving(true);
        setSaveError("");
        setSaveSuccess(false);

        try {
            await settingsService.update(form);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setSaveError(e.response?.data?.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Change password
    // ─────────────────────────────────────────────────────────────────
    const handleChangePassword = async () => {
        setPwError("");
        setPwSuccess(false);

        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setPwError("All password fields are required");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPwError("New passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setPwError("New password must be at least 8 characters");
            return;
        }

        setIsChangingPw(true);

        try {
            await settingsService.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            setPwSuccess(true);
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setTimeout(() => setPwSuccess(false), 3000);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setPwError(e.response?.data?.message || "Failed to change password");
        } finally {
            setIsChangingPw(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="text-center py-16 text-gray-text">
                Loading settings...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-danger-light text-danger px-4 py-3 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">

            {/* ── Page header ── */}
            <div>
                <h1 className="page-title">Settings</h1>
                <p className="text-gray-text text-sm">
                    Configure your dispensary and queue settings
                </p>
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* SECTION 1 — Dispensary Settings                          */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="card space-y-5">
                <h2 className="section-title border-b border-gray-border pb-3">
                    Dispensary Information
                </h2>

                {saveError && (
                    <div className="bg-danger-light text-danger text-sm
                          px-4 py-3 rounded-lg">
                        {saveError}
                    </div>
                )}

                {saveSuccess && (
                    <div className="bg-primary-light text-primary-dark text-sm
                          px-4 py-3 rounded-lg">
                        ✓ Settings saved successfully
                    </div>
                )}

                {/* Dispensary name + Doctor name */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">Dispensary Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={form.dispensaryName}
                            onChange={(e) =>
                                setForm({ ...form, dispensaryName: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="input-label">Doctor Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={form.doctorName}
                            onChange={(e) =>
                                setForm({ ...form, doctorName: e.target.value })
                            }
                        />
                    </div>
                </div>

                {/* Opening + Closing time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">Opening Time</label>
                        <input
                            type="time"
                            className="input-field"
                            value={form.openingTime}
                            onChange={(e) =>
                                setForm({ ...form, openingTime: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="input-label">Closing Time</label>
                        <input
                            type="time"
                            className="input-field"
                            value={form.closingTime}
                            onChange={(e) =>
                                setForm({ ...form, closingTime: e.target.value })
                            }
                        />
                    </div>
                </div>

                {/* Queue settings */}
                <h2 className="section-title border-b border-gray-border pb-3 pt-2">
                    Queue Configuration
                </h2>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="input-label">Max Daily Patients</label>
                        <input
                            type="number"
                            className="input-field"
                            min={1}
                            max={200}
                            value={form.maxDailyLimit}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    maxDailyLimit: parseInt(e.target.value) || 1,
                                })
                            }
                        />
                        <p className="text-gray-text text-xs mt-1">
                            Max appointments per day
                        </p>
                    </div>

                    <div>
                        <label className="input-label">Avg. Consultation (mins)</label>
                        <input
                            type="number"
                            className="input-field"
                            min={1}
                            max={120}
                            value={form.avgConsultationMinutes}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    avgConsultationMinutes: parseInt(e.target.value) || 1,
                                })
                            }
                        />
                        <p className="text-gray-text text-xs mt-1">
                            Used to calculate estimated times
                        </p>
                    </div>

                    <div>
                        <label className="input-label">Advance Booking (days)</label>
                        <input
                            type="number"
                            className="input-field"
                            min={1}
                            max={30}
                            value={form.advanceBookingDays}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    advanceBookingDays: parseInt(e.target.value) || 1,
                                })
                            }
                        />
                        <p className="text-gray-text text-xs mt-1">
                            How far ahead patients can book
                        </p>
                    </div>
                </div>

                {/* Estimated time preview */}
                <div className="bg-accent-light rounded-lg px-4 py-3">
                    <p className="text-accent text-xs font-semibold mb-1">
                        Estimated Time Preview
                    </p>
                    <p className="text-dark text-sm">
                        With these settings:
                        <span className="font-bold ml-1">
                            T-001 = {form.openingTime}
                        </span>
                        {" · "}
                        <span className="font-bold">
                            T-010 = {(() => {
                                if (!form.openingTime) return "N/A";
                                const [h, m] = form.openingTime.split(":").map(Number);
                                const totalMins = h * 60 + m + 9 * (form.avgConsultationMinutes || 15);
                                const hrs = Math.floor(totalMins / 60) % 12 || 12;
                                const mins = String(totalMins % 60).padStart(2, "0");
                                const ampm = Math.floor(totalMins / 60) >= 12 ? "PM" : "AM";
                                return `${hrs}:${mins} ${ampm}`;
                            })()}
                        </span>
                    </p>
                </div>

                {/* Save button */}
                <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="btn-primary"
                >
                    {isSaving ? "Saving..." : "Save Settings"}
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* SECTION 2 — Change Password                              */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="card space-y-4">
                <h2 className="section-title border-b border-gray-border pb-3">
                    Change Password
                </h2>

                {pwError && (
                    <div className="bg-danger-light text-danger text-sm
                          px-4 py-3 rounded-lg">
                        {pwError}
                    </div>
                )}

                {pwSuccess && (
                    <div className="bg-primary-light text-primary-dark text-sm
                          px-4 py-3 rounded-lg">
                        ✓ Password changed successfully
                    </div>
                )}

                <div>
                    <label className="input-label">Current Password</label>
                    <input
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                            setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                            })
                        }
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Min 8 characters"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    newPassword: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className="input-label">Confirm New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                                setPasswordForm({
                                    ...passwordForm,
                                    confirmPassword: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>

                <button
                    onClick={handleChangePassword}
                    disabled={isChangingPw}
                    className="btn-outlined"
                >
                    {isChangingPw ? "Changing..." : "Change Password"}
                </button>
            </div>

        </div>
    );
};

export default DoctorSettings;
