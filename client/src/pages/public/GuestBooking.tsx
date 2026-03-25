import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import queueService, { type AvailableDates } from '../../api/services/queue.service';
import Navbar from '../../components/Navbar';
import { FaCalendarAlt, FaLock, FaUserPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';

const GuestBooking = () => {
    const [dates, setDates] = useState<AvailableDates[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchDates = async () => {
            try {
                const data = await queueService.getAvailableDates();
                setDates(data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load booking slots");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDates();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex-1 container mx-auto px-6 py-32 max-w-5xl">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6"
                    >
                        <FaCalendarAlt size={32} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-dark mb-4"
                    >
                        Book Your Visit
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-500 max-w-2xl mx-auto"
                    >
                        Select an available clinic day below. To guarantee the highest quality of service, an account is required to finalize your booking.
                    </motion.p>
                </div>

                {error && (
                    <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-xl text-center font-medium mb-8">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Calendar Selection */}
                    <div className="bg-white p-8 rounded-4xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <h2 className="text-xl font-bold text-dark mb-6">Available Dates</h2>

                        {isLoading ? (
                            <div className="grid grid-cols-2 gap-4 animate-pulse">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {dates.map((d) => {
                                    const dateObj = new Date(d.date + "T00:00:00");
                                    const isFull = d.availableSlots === 0;
                                    const isSelected = selectedDate === d.date;

                                    return (
                                        <button
                                            key={d.date}
                                            disabled={isFull}
                                            onClick={() => setSelectedDate(d.date)}
                                            className={`p-4 rounded-2xl border-2 text-center transition-all ${isFull
                                                    ? "border-gray-50 bg-gray-50 opacity-50 cursor-not-allowed"
                                                    : isSelected
                                                        ? "border-primary bg-primary/5 text-primary-dark shadow-md scale-105"
                                                        : "border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm"
                                                }`}
                                        >
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                                            </p>
                                            <p className={`text-3xl font-black mb-2 ${isSelected ? "text-primary" : "text-dark"}`}>
                                                {dateObj.getDate()}
                                            </p>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${isFull ? "bg-danger/10 text-danger" : isSelected ? "bg-primary text-white" : "bg-success/10 text-success-dark"
                                                }`}>
                                                {isFull ? "FULLY BOOKED" : `${d.availableSlots} SLOTS OPEN`}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Authentication Prompt */}
                    <div className="flex flex-col justify-center">
                        <div className={`transition-all duration-500 ${selectedDate ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none filter grayscale'}`}>
                            <div className="bg-dark rounded-4xl p-8 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Secure Your Slot</h3>
                                    <p className="text-gray-400 mb-8">
                                        {selectedDate
                                            ? `You have selected ${new Date(selectedDate + "T00:00:00").toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Please sign in to confirm your booking.`
                                            : "Select a date on the left to continue."}
                                    </p>

                                    <div className="flex flex-col gap-4">
                                        <Link
                                            to="/auth/login"
                                            state={{ returnTo: "/patient/book" }}
                                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-primary/30"
                                        >
                                            <FaLock /> Sign In to Book
                                        </Link>

                                        <div className="relative flex items-center py-2">
                                            <div className="grow border-t border-gray-700"></div>
                                            <span className="shrink-0 mx-4 text-gray-500 text-sm font-medium">New Patient?</span>
                                            <div className="grow border-t border-gray-700"></div>
                                        </div>

                                        <Link
                                            to="/auth/register"
                                            state={{ returnTo: "/patient/book" }}
                                            className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                                        >
                                            <FaUserPlus /> Create an Account
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default GuestBooking;