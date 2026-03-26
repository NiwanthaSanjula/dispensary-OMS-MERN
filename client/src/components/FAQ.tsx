import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaQuestionCircle } from 'react-icons/fa';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const questions = [
        {
            q: "How does the Live Token tracking work?",
            a: "Once you book an appointment, you receive a digital token. Our live dashboard updates in real-time, showing you exactly how many patients are ahead of you. You can monitor this from your phone and only head to the clinic when it's your turn."
        },
        {
            q: "Can I cancel or reschedule my appointment?",
            a: "Yes. Simply log into your Dashboard, go to 'My Appointments,' and select 'Reschedule.' Please note that for private consultations, we appreciate a 2-hour notice for cancellations."
        },
        {
            q: "Is my medical data secure and private?",
            a: "Absolutely. MedicalCenter is built with HIPAA-ready encryption. Your medical records, prescriptions, and personal details are encrypted and only accessible by you and your attending physician."
        },
        {
            q: "Do I need to print my prescription?",
            a: "No. Our system is fully paperless. Your doctor syncs the prescription directly to our in-house dispensary OS. You can collect your medication by simply showing your digital token at the pharmacy counter."
        },
        {
            q: "What happens if I miss my token number?",
            a: "Don't worry. If you aren't present when your token is called, the system moves to the next patient, but your token remains 'Active' in a priority pool for a short grace period until you arrive."
        }
    ];

    return (
        <section id="faq" className="py-32 bg-[#fafcff]">
            <div className="container mx-auto px-6 max-w-4xl">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4"
                    >
                        <FaQuestionCircle /> Support Center
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-black text-dark tracking-tight">
                        Common Questions
                    </h2>
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                    {questions.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`rounded-3xl border transition-all duration-300 ${activeIndex === index
                                ? 'border-primary bg-white shadow-xl shadow-primary/5'
                                : 'border-slate-200 bg-white/50 hover:bg-white'
                                }`}
                        >
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 md:p-8 text-left outline-none"
                            >
                                <span className={`text-lg md:text-xl font-bold transition-colors ${activeIndex === index ? 'text-primary' : 'text-dark'
                                    }`}>
                                    {item.q}
                                </span>
                                <div className={`shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeIndex === index ? 'bg-primary text-white rotate-180' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {activeIndex === index ? <FaMinus size={12} /> : <FaPlus size={12} />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 md:px-8 pb-8 text-slate-500 text-lg leading-relaxed font-medium border-t border-slate-50 pt-4">
                                            {item.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 p-8 rounded-[2.5rem] bg-dark text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                    <p className="text-white text-lg font-bold mb-2 relative z-10">Still have questions?</p>
                    <p className="text-slate-400 mb-6 relative z-10">Our support team is available 24/7 for technical assistance.</p>
                    <button className="px-8 py-3 bg-white text-dark font-black rounded-xl hover:scale-105 transition-transform relative z-10">
                        Contact Support
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default FAQ;