import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FaHospital,
    FaUserMd,
    FaClock,
    FaUsers,
    FaCalendarAlt,
    FaLock,
    FaSave,
    FaKey,
    FaInfoCircle,
    FaCheckCircle,
    FaExclamationCircle
} from "react-icons/fa";
import settingsService, {
    type UpdateSettingsPayload,
} from "../../api/services/settings.service";

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3">
                <FaExclamationCircle className="text-xl" />
                <span className="font-semibold">{error}</span>
            </div>
        );
    }

    // Helper for input styles
    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-dark font-medium placeholder:text-slate-400 outline-none focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all";
    const labelClass = "text-slate-500 text-sm font-bold mb-2 ml-1 flex items-center gap-2";

    return (
        <div className="max-w-7xl space-y-8 pb-12 w-full mx-auto">
            {/* Page Header */}
            <div>
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-black text-dark tracking-tight mb-2"
                >
                    Settings
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-500 font-medium"
                >
                    Configure your dispensary and queue settings to optimize patient flow.
                </motion.p>
            </div>

            {/* SECTION 1 — Dispensary Settings */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-4xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="min-w-12 w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl shrink-0">
                        <FaHospital />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark">Dispensary Information</h2>
                        <p className="text-slate-500 text-sm font-medium">Manage your clinic details and operating hours</p>
                    </div>
                </div>

                {saveError && (
                    <div className="bg-red-50 text-red-600 px-5 py-4 rounded-xl mb-6 flex items-center gap-3 font-medium">
                        <FaExclamationCircle className="shrink-0" /> {saveError}
                    </div>
                )}

                {saveSuccess && (
                    <div className="bg-emerald-50 text-emerald-600 px-5 py-4 rounded-xl mb-6 flex items-center gap-3 font-medium">
                        <FaCheckCircle className="shrink-0" /> Settings saved successfully
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className={labelClass}>
                            <FaHospital className="text-slate-400" /> Dispensary Name
                        </label>
                        <input
                            type="text"
                            className={inputClass}
                            value={form.dispensaryName}
                            onChange={(e) => setForm({ ...form, dispensaryName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <FaUserMd className="text-slate-400" /> Doctor Name
                        </label>
                        <input
                            type="text"
                            className={inputClass}
                            value={form.doctorName}
                            onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <FaClock className="text-slate-400" /> Opening Time
                        </label>
                        <input
                            type="time"
                            className={inputClass}
                            value={form.openingTime}
                            onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <FaClock className="text-slate-400" /> Closing Time
                        </label>
                        <input
                            type="time"
                            className={inputClass}
                            value={form.closingTime}
                            onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full my-8"></div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="min-w-12 w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl shrink-0">
                        <FaUsers />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark">Queue Configuration</h2>
                        <p className="text-slate-500 text-sm font-medium">Control token generation and booking thresholds</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className={labelClass}>Max Daily Patients</label>
                        <input
                            type="number"
                            className={inputClass}
                            min={1} max={200}
                            value={form.maxDailyLimit}
                            onChange={(e) => setForm({ ...form, maxDailyLimit: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-slate-400 text-xs mt-2 font-medium">Max appointments per day</p>
                    </div>

                    <div>
                        <label className={labelClass}>Avg. Consultation (mins)</label>
                        <input
                            type="number"
                            className={inputClass}
                            min={1} max={120}
                            value={form.avgConsultationMinutes}
                            onChange={(e) => setForm({ ...form, avgConsultationMinutes: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-slate-400 text-xs mt-2 font-medium">Used to calculate estimated times</p>
                    </div>

                    <div className="sm:col-span-2 md:col-span-1">
                        <label className={labelClass}>
                            <FaCalendarAlt className="text-slate-400" /> Advance Booking
                        </label>
                        <input
                            type="number"
                            className={inputClass}
                            min={1} max={30}
                            value={form.advanceBookingDays}
                            onChange={(e) => setForm({ ...form, advanceBookingDays: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-slate-400 text-xs mt-2 font-medium">Days ahead patients can book</p>
                    </div>
                </div>

                {/* Estimated time preview */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row gap-4">
                    <div className="text-indigo-500 text-xl pt-1 shrink-0">
                        <FaInfoCircle />
                    </div>
                    <div>
                        <p className="text-indigo-800 font-bold mb-1">Queue Estimation Preview</p>
                        <p className="text-indigo-600/80 text-sm font-medium mb-3">Based on your settings, the estimated times will look like this:</p>
                        <div className="flex flex-wrap gap-4">
                            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-indigo-50 font-medium text-sm">
                                <span className="text-slate-400 mr-2">Token #1</span>
                                <span className="text-dark">{form.openingTime || "N/A"}</span>
                            </div>
                            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-indigo-50 font-medium text-sm">
                                <span className="text-slate-400 mr-2">Token #10</span>
                                <span className="text-dark">
                                    {(() => {
                                        if (!form.openingTime) return "N/A";
                                        const [h, m] = form.openingTime.split(":").map(Number);
                                        const totalMins = h * 60 + m + 9 * (form.avgConsultationMinutes || 15);
                                        const hrs = Math.floor(totalMins / 60) % 12 || 12;
                                        const mins = String(totalMins % 60).padStart(2, "0");
                                        const ampm = Math.floor(totalMins / 60) >= 12 ? "PM" : "AM";
                                        return `${hrs}:${mins} ${ampm}`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full md:w-auto px-8 py-4 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    <FaSave />
                    {isSaving ? "Saving System..." : "Save Settings"}
                </button>
            </motion.div>

            {/* SECTION 2 — Change Password */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-4xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="min-w-12 w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-xl shrink-0">
                        <FaLock />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark">Security Settings</h2>
                        <p className="text-slate-500 text-sm font-medium">Update your account password</p>
                    </div>
                </div>

                {pwError && (
                    <div className="bg-red-50 text-red-600 px-5 py-4 rounded-xl mb-6 flex items-center gap-3 font-medium">
                        <FaExclamationCircle className="shrink-0" /> {pwError}
                    </div>
                )}

                {pwSuccess && (
                    <div className="bg-emerald-50 text-emerald-600 px-5 py-4 rounded-xl mb-6 flex items-center gap-3 font-medium">
                        <FaCheckCircle className="shrink-0" /> Password changed successfully
                    </div>
                )}

                <div className="space-y-6 max-w-xl mb-8">
                    <div>
                        <label className={labelClass}>
                            <FaKey className="text-slate-400" /> Current Password
                        </label>
                        <input
                            type="password"
                            className={inputClass}
                            placeholder="••••••••"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>New Password</label>
                            <input
                                type="password"
                                className={inputClass}
                                placeholder="Min 8 characters"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Confirm Password</label>
                            <input
                                type="password"
                                className={inputClass}
                                placeholder="••••••••"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleChangePassword}
                    disabled={isChangingPw}
                    className="w-full md:w-auto px-8 py-4 bg-dark text-white font-black rounded-xl shadow-xl shadow-slate-200 hover:shadow-slate-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    <FaLock />
                    {isChangingPw ? "Verifying..." : "Update Password"}
                </button>
            </motion.div>
        </div>
    );
};

export default DoctorSettings;
