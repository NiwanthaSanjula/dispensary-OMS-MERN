import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import authService from '../../api/services/auth.service';

const Login = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { login, user } = useAuth();
    
    // Check if we were passed a returnTo route via state (e.g from GuestBooking)
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

    const handleSubmit = async (e: React.SubmitEvent) => {
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
            setError(error.response?.data?.message || "Login failed.Please try again.");

        } finally {
            setIsLoading(false)
        }

    }

    return (
        <div className='min-h-screen bg-gray-bg flex items-center justify-center px-4'>
            <div className='w-full max-w-md'>

                {/**Header */}
                <div className='mb-8 text-center'>
                    <h1 className='text-4xl font-BabesNeue text-dark mb-1'><span className='text-primary'>Medical</span> Center</h1>
                    <p className='text-gray-text text-sm md:text-base'>Sign in to you account</p>
                </div>

                {/** Card */}
                <div className='card'>
                    {/**Error Banner */}
                    {error && (
                        <div className='bg-danger-light text-danger text-sm px-4 py-3 rounded-lg mb-5'>{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>

                        {/**Email */}
                        <div>
                            <label className='input-label'>Email</label>
                            <input
                                type="email"
                                className='input-field'
                                placeholder='your@email.com'
                                value={formData.email}
                                required
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/**password */}
                        <div>
                            <label className='input-label'>Password</label>
                            <div className='relative'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name='password'
                                    className='input-field pr-10'
                                    placeholder='••••••••'
                                    value={formData.password}
                                    required
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-dark transition-colors'
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type='submit'
                            disabled={isLoading}
                            className='btn-primary w-full mt-2'
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>

                    </form>

                    {/**Register link */}
                    <p className='text-center text-sm text-gray-text mt-5'>
                        Don't have an account?{" "}
                        <Link to="/auth/register" className='text-blue-500'>
                            Regiser here
                        </Link>
                    </p>
                </div>

                <div className="mt-4 p-3 bg-accent-light rounded-lg text-xs text-gray-text text-center">
                    Demo: doctor@demo.com / assistant@demo.com / patient@demo.com
                    <br />
                    Password: Demo@1234
                </div>

            </div>
        </div>
    )
}

export default Login