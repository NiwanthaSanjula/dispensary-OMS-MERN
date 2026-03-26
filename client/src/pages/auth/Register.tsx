import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../api/services/auth.service';
import { FiEye, FiEyeOff, FiUser, FiPhone, FiMail, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import assets from '../../assets/assets';
import AuthLayout from '../../layouts/AuthLayout';
const Register = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { user, login } = useAuth();

    const returnTo = location.state?.returnTo;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: ""
    });

    const [confirmPassword, setConfirmPassword] = useState("");
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        setIsLoading(true);

        try {
            const result = await authService.register(formData);
            login(result);

            if (returnTo) {
                navigate(returnTo, { replace: true });
            } else {
                navigate("/patient/dashboard", { replace: true });
            }

        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Registration failed!");

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
                <div className="bg-white flex flex-col justify-center px-8 py-10 w-full lg:w-1/2">

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-BabesNeue text-dark mb-1">
                            <span className="text-primary">Medical</span> Center
                        </h1>
                        <p className="text-gray-text text-sm">Create your account</p>
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
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Name */}
                        <div>
                            <label className="input-label flex items-center gap-1.5 mb-1.5">
                                <FiUser size={14} className="text-primary" />
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                placeholder="Your Name"
                                value={formData.name}
                                required
                                onChange={handleChange}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="input-label flex items-center gap-1.5 mb-1.5">
                                <FiPhone size={14} className="text-primary" />
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                className="input-field"
                                placeholder="07XXXXXXXX"
                                value={formData.phone}
                                required
                                onChange={handleChange}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="input-label flex items-center gap-1.5 mb-1.5">
                                <FiMail size={14} className="text-primary" />
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="input-field"
                                placeholder="your@email.com"
                                value={formData.email}
                                required
                                onChange={handleChange}
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
                                    onChange={handleChange}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="input-label flex items-center gap-1.5 mb-1.5">
                                <FiLock size={14} className="text-primary" />
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-field pr-10"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    required
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {isLoading ? "Signing Up..." : "Sign Up"}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-sm text-gray-text mt-6">
                        Already have an account?{" "}
                        <Link to="/auth/login" className="text-primary font-medium hover:underline">
                            Login here
                        </Link>
                    </p>
                </div>

                {/* ── Right: Background Image Side — hidden on mobile & md, shown on lg+ ── */}
                <div
                    className="relative hidden lg:flex flex-col justify-end lg:w-1/2"
                    style={{
                        backgroundImage: `url('${assets.prescription}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        minHeight: '580px',
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
                            Join Us Today
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl font-bold leading-snug mb-3"
                        >
                            Your Health<br />Starts Here
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-sm leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 240 }}
                        >
                            Create your account to book appointments, track your health records, and connect with top doctors.
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

export default Register;