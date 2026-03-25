import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaBars, FaTimes } from 'react-icons/fa';
import { IoIosCloseCircle } from "react-icons/io";

const Navbar = () => {
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to section logic
    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        if (location.pathname !== "/") return; // Only smooth scroll on home page

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
                }`}
        >
            <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-primary text-white p-2 rounded-lg group-hover:bg-primary-dark transition">
                        <FaHeartbeat size={20} />
                    </div>
                    <span className={`font-bold text-3xl tracking-tight transition-colors text-white`}>
                        Medicle<span className="text-primary">Center</span>
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className={`hidden md:flex items-center gap-8 lg:text-lg ${scrolled ? 'text-dark' : "text-white"}`}>
                    <button onClick={() => scrollToSection('home')} className="font-medium hover:text-primary transition">Home</button>
                    <button onClick={() => scrollToSection('features')} className="font-medium hover:text-primary transition">Features</button>
                    <button onClick={() => scrollToSection('about')} className="font-medium hover:text-primary transition">About Us</button>
                    <Link to="/track" className="font-medium hover:text-primary transition">Track Token</Link>
                    <Link to="/live-board" className="font-medium flex items-center gap-2 text-primary hover:text-primary-dark transition">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live Board
                    </Link>
                </div>

                <div className='hidden md:block'>
                    {user ? (
                        <Link to="/dashboard" className="btn-primary shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-8 lg:text-lg">
                            <Link to="/auth/login" className="font-semibold text-primary hover:text-primary-dark transition">
                                Login
                            </Link>
                            <Link to="/auth/register" className="btn-primary shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-dark p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: '0' }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed top-0 right-0 w-full h-screen md:hidden bg-white/40 backdrop-blur-md border-t border-gray-300 shadow-xl z-50"
                    >
                        <div className="flex flex-col p-6 space-y-4">

                            <button onClick={() => setMobileMenuOpen(false)} className='flex items-center justify-end' >
                                <IoIosCloseCircle size={26} className='text-dark' />
                            </button>

                            <button onClick={() => scrollToSection('home')} className="text-left font-medium text-dark py-2">Home</button>
                            <button onClick={() => scrollToSection('features')} className="text-left font-medium text-dark py-2">Features</button>
                            <button onClick={() => scrollToSection('about')} className="text-left font-medium text-dark py-2">About Us</button>
                            <Link to="/track" className="text-left font-medium text-dark py-2">Track Token</Link>
                            <Link to="/live-board" className="text-left font-medium text-primary py-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span> Live Board
                            </Link>

                            <div className="pt-4 flex flex-col gap-3">
                                {user ? (
                                    <Link to="/dashboard" className="btn-primary text-center">
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/auth/login" className="btn-outlined text-center">Login</Link>
                                        <Link to="/auth/register" className="btn-primary text-center">Get Started</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>


                )}
            </AnimatePresence>
        </motion.nav >
    );
};

export default Navbar;
