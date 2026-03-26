import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import authService from '../../api/services/auth.service';
import assets from '../../assets/assets';
import AuthLayout from '../../layouts/AuthLayout';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user } = useAuth();

    const returnTo = location.state?.returnTo;

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    if (user) {
        if (returnTo) {
            navigate(returnTo, { replace: true });
        } else {
            const map: Record<string, string> = {
                doctor: "/doctor/dashboard",
                assistant: "/assistant/dashboard",
                patient: "/"
            };
            navigate(map[user.role], { replace: true });
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const result = await authService.login(formData);
            login(result);
            if (returnTo) {
                navigate(returnTo, { replace: true });
            } else {
                const dashboardMap: Record<string, string> = {
                    doctor: "/doctor/dashboard",
                    assistant: "/assistant/dashboard",
                    patient: "/patient/dashboard"
                };
                navigate(dashboardMap[result.user.role], { replace: true });
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            {/* Big Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full rounded-2xl overflow-hidden shadow-2xl flex"
                style={{ maxWidth: '900px' }}
            >

                {/* ── Left: Form Side ── */}
                {/* On mobile/md: full width. On lg+: half width */}
                <div className="bg-white flex flex-col justify-center px-8 py-10 w-full lg:w-1/2">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-BabesNeue text-dark mb-1">
                            <span className="text-primary">Medical</span> Center
                        </h1>
                        <p className="text-gray-text text-sm">Sign in to your account</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-danger-light text-danger text-sm px-4 py-3 rounded-lg mb-5"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="input-label flex items-center gap-1.5 mb-1.5">
                                <FiMail size={14} className="text-primary" />
                                Email
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="your@email.com"
                                value={formData.email}
                                required
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="input-label flex items-center gap-1.5 mb-1.5">
                                <FiLock size={14} className="text-primary" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="input-field pr-10"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    required
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-dark transition-colors"
                                >
                                    {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full mt-1"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Register Link */}
                    <p className="text-center text-sm text-gray-text mt-6">
                        Don't have an account?{" "}
                        <Link to="/auth/register" className="text-primary font-medium hover:underline">
                            Register here
                        </Link>
                    </p>

                    {/* Demo credentials */}
                    <div className="mt-5 p-3 bg-accent-light rounded-lg text-xs text-gray-text text-center leading-relaxed">
                        Demo: doctor@demo.com / assistant@demo.com / patient@demo.com
                        <br />
                        Password: <span className="font-semibold">Demo@1234</span>
                    </div>
                </div>

                {/* ── Right: Background Image Side — hidden on mobile & md, shown on lg+ ── */}
                <div
                    className="relative hidden lg:flex flex-col justify-end lg:w-1/2"
                    style={{
                        backgroundImage: `url('${assets.heroContainer}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        minHeight: '520px',
                    }}
                >
                    {/* Gradient overlay */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 100%)'
                        }}
                    />

                    {/* Primary color top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

                    {/* Overlay Text */}
                    <div className="relative z-10 p-10 text-white">
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-xs font-semibold uppercase tracking-widest mb-3"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                            Your Health, Our Priority
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl font-bold leading-snug mb-3"
                        >
                            Trusted Care,<br />Anytime You Need
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-sm leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 240 }}
                        >
                            Manage appointments, access patient records, and stay connected with your care team.
                        </motion.p>

                        {/* Stats row */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.75 }}
                            className="flex gap-6 mt-6"
                        >
                            {[['500+', 'Doctors'], ['10k+', 'Patients'], ['24/7', 'Support']].map(([val, label]) => (
                                <div key={label}>
                                    <p className="text-lg font-bold">{val}</p>
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

            </motion.div>
        </AuthLayout>
    );
};

export default Login;