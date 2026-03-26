import { motion } from 'framer-motion';
import { FaPhoneAlt, FaMapMarkerAlt, FaWhatsapp, FaArrowRight, FaRegClock } from 'react-icons/fa';

const Contact = () => {
    return (
        <section id="contact" className="py-32 bg-white relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-primary/5 blur-[120px] rounded-full z-0" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 lg:items-stretch">

                    {/* LEFT SIDE: Contact Info Cards */}
                    <div className="lg:w-[40%] flex flex-col justify-between">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="text-primary font-black uppercase tracking-widest text-sm mb-4"
                            >
                                Get In Touch
                            </motion.div>
                            <h2 className="text-4xl md:text-5xl font-black text-dark mb-8 tracking-tight leading-tight">
                                We're here to <br />
                                <span className="text-primary">support your health.</span>
                            </h2>
                            <p className="text-slate-500 text-lg font-medium mb-12 leading-relaxed">
                                Have questions about our booking system or medical services? Reach out and our team will assist you within minutes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { icon: <FaPhoneAlt />, label: "Emergency Line", val: "066 3982136", color: "bg-blue-500" },
                                { icon: <FaWhatsapp />, label: "WhatsApp Support", val: "Chat with us live", color: "bg-emerald-500" },
                                { icon: <FaMapMarkerAlt />, label: "Our Clinic", val: "123 Medical Plaza, Health City", color: "bg-indigo-500" },
                                { icon: <FaRegClock />, label: "Working Hours", val: "Mon - Sat: 8:00 AM - 8:00 PM", color: "bg-orange-500" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ x: 10 }}
                                    className="flex items-center gap-5 p-4 rounded-2xl border border-slate-100 bg-[#fafcff] hover:shadow-md transition-all group"
                                >
                                    <div className={`w-12 h-12 ${item.color} text-white rounded-xl flex items-center justify-center text-lg shadow-lg`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                                        <p className="text-dark font-bold text-lg">{item.val}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Interactive Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:w-[60%] bg-dark rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                    >
                        {/* Glassmorphism subtle glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full" />

                        <form className="relative z-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-slate-400 text-sm font-bold ml-1">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-400 text-sm font-bold ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-400 text-sm font-bold ml-1">Reason for Contact</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all appearance-none">
                                    <option className="bg-dark">Booking Inquiry</option>
                                    <option className="bg-dark">Medical Question</option>
                                    <option className="bg-dark">Technical Support</option>
                                    <option className="bg-dark">Feedback</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-400 text-sm font-bold ml-1">Message</label>
                                <textarea
                                    rows={4}
                                    placeholder="How can we help you today?"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 outline-none focus:border-primary/50 focus:bg-white/10 transition-all resize-none"
                                ></textarea>
                            </div>

                            <button className="w-full py-5 bg-primary text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group">
                                Send Message
                                <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </form>

                        <p className="text-center text-slate-500 text-sm mt-8 font-medium">
                            Response time: <span className="text-slate-300 font-bold">~15 Minutes</span>
                        </p>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default Contact;