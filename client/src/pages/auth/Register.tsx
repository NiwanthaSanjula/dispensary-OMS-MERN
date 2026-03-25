import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext';
import authService from '../../api/services/auth.service';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { user, login } = useAuth();
    
    // Check if we were passed a returnTo route via state (e.g from GuestBooking)
    const returnTo = location.state?.returnTo;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: ""
    })

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

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError("");

        // Validate password
        if (formData.password !== confirmPassword) {
            return setError("Passwords do not match")
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
            setError(error.response?.data?.message || "Registration failed!")

        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='min-h-screen bg-gray-bg flex items-center justify-center px-4'>
            <div className='w-full max-w-md'>

                {/**header */}
                <div className='mb-8 text-center'>
                    <h1 className='text-4xl font-BabesNeue text-dark mb-1'><span className='text-primary'>Medical</span> Center</h1>
                    <p className='text-gray-text text-sm md:text-base'>Register</p>
                </div>

                <div className='card'>

                    {error && (
                        <div className='bg-danger-light text-danger text-sm px-4 py-3 rounded-lg mb-5'>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>

                        {/**name */}
                        <div>
                            <label className='input-label'>Name</label>
                            <input
                                type="text"
                                name='name'
                                className='input-field'
                                placeholder='You Name'
                                value={formData.name}
                                required
                                onChange={handleChange}
                            />
                        </div>

                        {/**Phone */}
                        <div>
                            <label className='input-label'>Phone</label>
                            <input
                                type="tel"
                                name='phone'
                                className='input-field'
                                placeholder='07XXXXXXXX'
                                value={formData.phone}
                                required
                                onChange={handleChange}
                            />
                        </div>

                        {/**Email */}
                        <div>
                            <label className='input-label'>Email</label>
                            <input
                                type="email"
                                name='email'
                                className='input-field'
                                placeholder='your@email.com'
                                value={formData.email}
                                required
                                onChange={handleChange}
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
                                    onChange={handleChange}
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

                        {/**confirm password */}
                        <div>
                            <label className='input-label'>Confirm Password</label>
                            <div className='relative'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className='input-field'
                                    placeholder='••••••••'
                                    value={confirmPassword}
                                    required
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {isLoading ? "Signing Up..." : "Sign Up"}
                        </button>

                    </form>

                    {/**Register link */}
                    <p className='text-center text-sm text-gray-text mt-5'>
                        Already have an account?{" "}
                        <Link to="/auth/login" className='text-blue-500'>
                            Login here
                        </Link>
                    </p>

                </div>



            </div>
        </div>
    )
}

export default Register