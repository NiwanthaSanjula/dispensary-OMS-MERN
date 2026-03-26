import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { FaUserMd, FaCalendarCheck, FaPills, FaChartLine, FaArrowRight, FaShieldAlt, FaRegClock, FaUsers } from 'react-icons/fa';
import assets from '../../assets/assets';
import FAQ from '../../components/FAQ';
import Contact from '../../components/Contact';

const Landing = () => {
    const { user } = useAuth();
    const { scrollYProgress } = useScroll();
    const mapY = useTransform(scrollYProgress, [0, 1], [0, -300]);

    // Animation variants
    const fadeInUp: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.1 }
        }
    };

    const bentoCards = [
        {
            icon: <FaCalendarCheck size={32} className="text-white" />,
            title: "Smart Appointments",
            desc: "Eliminate booking conflicts with intelligent scheduling.",
            // Reduced gradient, used for the icon/border accent
            color: "blue-500",
            span: "col-span-1 md:col-span-2 row-span-2",
            delay: 0.2,
            image: assets.onlineBooking
        },
        {
            icon: <FaChartLine size={28} className="text-white" />,
            title: "Live Queue",
            desc: "Real-time queue management for silent waiting rooms.",
            color: "emerald-500",
            span: "col-span-1 md:col-span-1 row-span-1",
            delay: 0.4,
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
        },
        {
            icon: <FaPills size={28} className="text-white" />,
            title: "Pharmacy Sync",
            desc: "Auto-dispense directly from doctor prescriptions.",
            color: "orange-500",
            span: "col-span-1 md:col-span-1 row-span-1",
            delay: 0.5,
            image: assets.prescription
        },
        {
            icon: <FaUserMd size={28} className="text-primary" />,
            title: "Digital Records",
            desc: "Instant access to patient histories and allergies.",
            color: "slate-500",
            span: "col-span-1 md:col-span-2 row-span-1",
            delay: 0.6,
            light: true,
            image: assets.digitalRecords
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafcff] font-sans selection:bg-primary/30 overflow-hidden">
            <Navbar />

            {/* --- HERO SECTION --- */}
            <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 min-h-screen flex items-center">

                {/* Premium Background Mesh / Grid */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-dark">
                    <img src={assets.heroBg} alt="" className='w-full h-full object-cover opacity-20' />
                    <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary blur-[150px] opacity-20 animate-blob"></div>
                    <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400 blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-indigo-300 blur-[120px] y opacity-10 animate-blob animation-delay-4000"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" style={{ mixBlendMode: 'overlay' }}></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
                </div>

                <div className="container mx-auto relative z-10 max-w-7xl">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">

                        {/* Hero Text */}
                        <motion.div
                            className="lg:w-[55%] text-center lg:text-left"
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-white/40 shadow-sm text-primary-dark text-xs sm:text-sm font-bold uppercase tracking-widest mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Skip the Waiting Room
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-[5rem] font-extrabold text-sky-200 leading-[1.1] mb-6 tracking-tight">
                                Better Care. <br /> <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-sky-400 to-blue-400">Zero Friction.</span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Eliminate waiting room chaos, simplify prescribing, and keep your entire clinic running with beautiful, intelligent precision.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
                                {user ? (
                                    <Link to="/dashboard" className="group relative px-8 py-4 bg-dark text-white text-lg font-bold rounded-2xl overflow-hidden shadow-2xl shadow-dark/20 hover:shadow-dark/40 transition-all hover:-translate-y-1 w-full sm:w-auto text-center">
                                        <div className="absolute inset-0 bg-linear-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <span className="relative flex items-center justify-center gap-2 z-10">Go to Dashboard <FaArrowRight className="group-hover:translate-x-1 transition-transform" /></span>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/auth/login" className="group relative px-8 py-4 w-full sm:w-auto bg-primary text-white text-lg font-bold rounded-2xl overflow-hidden shadow-2xl shadow-dark/20 hover:shadow-dark/40 transition-all hover:-translate-y-1 text-center">
                                            <div className="absolute inset-0 bg-linear-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <span className="relative flex items-center justify-center gap-2 z-10">Sign In to Clinic <FaArrowRight className="group-hover:translate-x-1 transition-transform" /></span>
                                        </Link>
                                        <Link to="/track" className="w-full sm:w-auto px-8 py-4 bg-white/60 backdrop-blur-md border border-white/50 text-dark text-lg font-bold rounded-2xl shadow-sm hover:bg-white transition-all text-center">
                                            Track Token
                                        </Link>
                                    </>
                                )}
                            </motion.div>

                            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-60 grayscale text-white">
                                <span className="font-bold text-xl flex items-center gap-2"><FaShieldAlt /> HIPAA Ready</span>
                                <span className="font-bold text-xl flex items-center gap-2"><FaRegClock /> 24/7 Runtime</span>
                            </motion.div>
                        </motion.div>

                        {/* Visuals / Floating UI Image Composition */}
                        <motion.div
                            className="lg:w-[45%] relative w-full aspect-4/3 md:h-[650px] flex items-center justify-center mt-12 lg:mt-0"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ y: mapY }}
                        >
                            {/* Abstract Glow behind the image */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-linear-to-tr from-primary to-blue-400 rounded-full blur-[80px] opacity-30"></div>

                            {/* Main Image */}
                            <motion.div
                                className="relative z-10 w-[90%] h-[80%] rounded-4xl shadow-2xl overflow-hidden border-4 border-white transform lg:rotate-2 hover:rotate-0 transition-transform duration-700"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img
                                    src={assets.heroContainer}
                                    alt="Modern Clinic"
                                    className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000"
                                />
                                {/* Soft overlay at bottom */}
                                <div className="absolute inset-0 bg-linear-to-t from-dark/50 via-transparent to-transparent"></div>

                                <div className="absolute bottom-6 left-6 text-white text-left max-w-[80%]">
                                    <p className="font-bold text-lg leading-tight mb-1">State-of-the-Art Clinics</p>
                                    <p className="text-white/80 text-sm font-medium">Equipped with the fastest modern technology to serve you.</p>
                                </div>
                            </motion.div>

                            {/* Floating Analytics Card overlapping the image */}
                            <motion.div
                                animate={{ y: [0, 15, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -bottom-4 md:bottom-12 -left-4 md:-left-8 z-20 bg-white/90 backdrop-blur-xl border border-white p-5 rounded-2xl shadow-2xl shadow-dark/10 flex items-center gap-4 hover:scale-105 transition-transform"
                            >
                                <div className="bg-linear-to-br from-success-light to-success p-3 rounded-xl shadow-inner text-white">
                                    <FaUsers size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Patients Today</p>
                                    <p className="text-2xl font-black text-dark tracking-tight">124<span className="text-success text-sm ml-1">+12%</span></p>
                                </div>
                            </motion.div>

                            {/* Floating Notification */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="absolute top-12 -right-4 md:-right-8 z-20 bg-dark/95 backdrop-blur-md border border-gray-700 p-4 rounded-2xl shadow-2xl shadow-dark/20 flex items-center gap-3 hover:scale-105 transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                                    <FaPills />
                                </div>
                                <div className="pr-2">
                                    <p className="text-white text-sm font-bold">Amoxicillin Dispensed</p>
                                    <p className="text-gray-400 text-xs mt-0.5">Token #042 • Just now</p>
                                </div>
                            </motion.div>

                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- BENTO GRID FEATURES --- */}
            <section id="features" className="py-32 relative bg-white z-10 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center max-w-3xl mx-auto mb-20 text-balance">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-black text-dark mb-6 tracking-tight"
                        >
                            A <span className='text-primary'>smarter </span> way to run your practice
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 text-xl font-medium"
                        >
                            Ditch the paperwork and scattered tools. Our unified platform integrates every step of the patient journey perfectly.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:grid-rows-2 h-auto md:h-[600px]">
                        {bentoCards.map((card, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: card.delay }}
                                whileHover={{ scale: 0.99 }}
                                className={`group ${card.span} rounded-4xl p-8 flex flex-col justify-between overflow-hidden relative shadow-xl border border-gray-100 bg-white`}
                            >
                                {/* --- THE IMAGE ENGINE --- */}
                                {card.image && (
                                    <div className="absolute inset-0 z-0 transition-transform duration-700 ease-in-out group-hover:scale-110">
                                        <img
                                            src={card.image}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                        {/* This is the "Magic Overlay": 
                   Transparent at the top to show the image, 
                   Dark at the bottom so white text is readable.
                */}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                                    </div>
                                )}

                                {/* --- CONTENT --- */}
                                {/* Icon Container */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative z-10 backdrop-blur-md border border-white/20 
            ${card.light ? 'bg-white/90' : 'bg-white/20'}`}>
                                    {/* We force the icon color to be white/primary based on card type */}
                                    <div className={card.light ? "text-primary" : "text-white"}>
                                        {card.icon}
                                    </div>
                                </div>

                                {/* Text Container */}
                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                        {card.title}
                                    </h3>
                                    <p className="text-gray-200 text-lg font-medium leading-snug max-w-[90%] group-hover:text-white transition-colors">
                                        {card.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- MEET THE DOCTOR SECTION --- */}
            <section id="about" className="py-32 bg-[#fafcff] relative overflow-hidden">
                {/* Background Decorative Element */}
                <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />

                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                        {/* Image Side */}
                        <motion.div
                            className="lg:w-1/2 relative"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Decorative Frame */}
                            <div className="absolute -inset-4 border-2 border-primary/10 rounded-[3rem] -rotate-3 z-0" />

                            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-4/5 bg-slate-200">
                                <img
                                    src={assets.doctorImage || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80"}
                                    alt="Lead Physician"
                                    className="w-full h-full object-cover"
                                />
                                {/* Floating Experience Badge */}
                                <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/50">
                                    <p className="text-primary font-black text-3xl leading-none">15+</p>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Years Experience</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Text Side */}
                        <motion.div
                            className="lg:w-1/2"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest mb-6">
                                Lead Physician
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-dark mb-6 leading-tight">
                                Dedicated to your <br />
                                <span className="text-primary">personal wellness.</span>
                            </h2>

                            <p className="text-slate-600 text-xl leading-relaxed mb-8 font-medium">
                                "I founded this dispensary with a simple mission: to bridge the gap between advanced medical technology and compassionate, one-on-one patient care."
                            </p>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div>
                                    <h4 className="font-bold text-dark text-lg mb-1">Dr. Cassandra Riley</h4>
                                    <p className="text-slate-500 font-medium">Chief Medical Officer</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-lg mb-1">Specialization</h4>
                                    <p className="text-slate-500 font-medium">Internal Medicine & Pharmacy Tech</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 border-l-4 border-primary/20 pl-6 italic text-slate-500 mb-10">
                                <p>"Technology should make healthcare faster, but it should never make it feel less human."</p>
                            </div>

                            <Link to="/book" className="inline-flex items-center gap-3 text-primary font-bold text-lg group">
                                Schedule a Consultation
                                <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* --- SERVICES SECTION --- */}
            <section id="services" className="py-32 bg-white relative">
                <div className="container mx-auto px-6 max-w-7xl">

                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                        <div className="max-w-2xl text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-primary font-bold uppercase tracking-[0.2em] text-sm mb-4"
                            >
                                Specialized Care
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-5xl font-black text-dark tracking-tight"
                            >
                                Comprehensive healthcare, <br />
                                <span className="text-slate-400 font-medium">digitally empowered.</span>
                            </motion.h2>
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-slate-500 text-lg max-w-md font-medium leading-relaxed"
                        >
                            We’ve redesigned every touchpoint of your medical visit to ensure speed, privacy, and clinical excellence.
                        </motion.p>
                    </div>

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Private Consultations",
                                desc: "One-on-one sessions with our lead physician in a quiet, modern environment.",
                                icon: <FaUserMd />,
                                tag: "Priority"
                            },
                            {
                                title: "Digital Prescriptions",
                                desc: "Paperless scripting synced instantly to our dispensary for immediate collection.",
                                icon: <FaPills />,
                                tag: "Synced"
                            },
                            {
                                title: "Live Token Tracking",
                                desc: "Monitor your queue status from your phone. Arrive exactly when you are called.",
                                icon: <FaRegClock />,
                                tag: "Real-time"
                            },
                            {
                                title: "Health Analytics",
                                desc: "Access your medical history, vitals, and lab results through your private portal.",
                                icon: <FaChartLine />,
                                tag: "Secure"
                            },
                            {
                                title: "Automated Reminders",
                                desc: "Never miss a check-up. Get smart notifications for follow-ups and refills.",
                                icon: <FaCalendarCheck />,
                                tag: "Smart"
                            },
                            {
                                title: "Pharmacy Dispensing",
                                desc: "In-house dispensary stocked with essential medications for instant recovery.",
                                icon: <FaShieldAlt />,
                                tag: "Verified"
                            }
                        ].map((service, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="p-10 rounded-[2.5rem] bg-[#fafcff] border border-slate-100 hover:border-primary/20 border-t-4 border-t-primary shadow-lg hover:shadow-xl transition-all duration-500 group"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary text-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        {service.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {service.tag}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-dark mb-4">{service.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    {service.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <FAQ />

            <Contact />

            {/* --- MINIMAL FOOTER --- */}
            <footer className="bg-dark border-t border-gray-100 pt-20 pb-10">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary text-white p-2 rounded-xl group-hover:scale-110 shadow-lg shadow-primary/30 transition-all">
                                <FaUserMd size={20} />
                            </div>
                            <span className="font-extrabold text-2xl text-white tracking-tight">
                                Medicle<span className='text-primary'>Center</span>
                            </span>
                        </Link>

                        <div className="flex gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest flex-wrap justify-center">
                            <button onClick={() => window.scrollTo(0, 0)} className="hover:text-primary cursor-pointer transition-colors">Home</button>
                            <Link to="/auth/login" className="hover:text-primary cursor-pointer transition-colors">Login</Link>
                            <Link to="/book" className="hover:text-primary cursor-pointer transition-colors">Book Appointment</Link>
                            <Link to="/track" className="hover:text-primary cursor-pointer transition-colors">Track Token</Link>
                            <Link to="/live-board" className="hover:text-primary cursor-pointer transition-colors flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>Live Queue
                            </Link>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-400">
                        <p>&copy; {new Date().getFullYear()} CureSync Technologies. All rights reserved.</p>
                        <div className="flex gap-6">
                            <span className="hover:text-dark cursor-pointer transition-colors">Privacy Policy</span>
                            <span className="hover:text-dark cursor-pointer transition-colors">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;