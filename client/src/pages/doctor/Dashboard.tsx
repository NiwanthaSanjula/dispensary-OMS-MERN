import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'
import { useQueue } from '../../hooks/useQueue';
import { useState } from 'react';
import queueService from '../../api/services/queue.service';
import type { IAppointment, AppointmentStatus } from '../../types/appointment.types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

import { GiPlayerNext } from "react-icons/gi";
import { TbPlayerTrackNextFilled, TbTriangleFilled } from "react-icons/tb";
import { FaArrowRight, FaPause, FaUsers, FaBoxOpen } from "react-icons/fa";
import { MdDoorSliding } from "react-icons/md";
import LowStockBanner from '../../components/LowStockBanner';

/**
 * Doctor Dashboard
 * Shows today's queue with live updates via Socket.io
 * Doctor can: Call Next, view stats, start consultation
 */
const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        queue,
        appointments,
        isLoading,
        error,
        waitingCount,
        completedCount,
        noShowCount,
        refetch
    } = useQueue();

    const [isCallingNext, setIsCallingNext] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const [actionError, setActionError] = useState("");

    const handleCallNext = async () => {
        setIsCallingNext(true);
        setActionError("");
        try {
            await queueService.callNext()
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to advance queue");
            refetch();
        } finally {
            setIsCallingNext(false)
        }
    };

    const handlePause = async () => {
        setIsActioning(true);
        try {
            await queueService.pause();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to pause queue");
        } finally {
            setIsActioning(false)
        }
    };

    const handleResume = async () => {
        setIsActioning(true);
        try {
            await queueService.resume();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to Resume queue");
        } finally {
            setIsActioning(false)
        }
    };

    const handleClose = async () => {
        const confirmed = window.confirm("Are you sure you want to close the queue for today?");
        if (!confirmed) return;
        setIsActioning(true);
        try {
            await queueService.close();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to close queue");
        } finally {
            setIsActioning(false)
        }
    };

    const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
        const classes: Record<AppointmentStatus, string> = {
            waiting: "badge-waiting",
            serving: "badge-serving",
            completed: "badge-completed",
            noshow: "badge-noshow",
            cancelled: "badge-cancelled"
        }
        return <span className={classes[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    };

    const TypeBadge = ({ type }: { type: "online" | "manual" }) => (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${type === "online" ? "bg-accent/10 text-accent-dark border border-accent/20" : "bg-gray-100 text-gray-text border border-gray-200"}`}>
            {type === "online" ? "Online" : "Walk-in"}
        </span>
    );

    // Mock chart data for weekly visual based on current queue logic
    // In a real app with more routes, this would fetch from /api/stats. Here we visualize current state effectively.
    //const activeAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'waiting' || a.status === 'serving');
    const chartData = [
        { name: 'Waiting', patients: waitingCount, fill: '#f59e0b' },
        { name: 'Treated', patients: completedCount, fill: '#10b981' },
    ];

    // Get recently treated patients exclusively filtering completed status
    const recentlyTreated = appointments.filter(a => a.status === 'completed').reverse().slice(0, 5);

    return (
        <div className='max-w-7xl mx-auto'>
            {/* Header */}
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-6'>
                <div>
                    <h1 className='page-title'>Good morning,<span className='text-primary'> Dr. {user?.name?.split(" ")[user.name.split(" ").length - 1] || user?.name}</span></h1>
                    <p className='text-gray-text text-sm font-medium'>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${queue?.status === "open" ? "bg-primary-light text-primary-dark" : queue?.status === "paused" ? "bg-warning/10 text-warning-dark border border-warning/20" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${queue?.status === "open" ? "bg-primary animate-pulse" : queue?.status === "paused" ? "bg-warning" : "bg-gray-400"}`} />
                    {queue?.status === "open" ? "Queue Open" : queue?.status === "paused" ? "Queue Paused" : queue ? "Queue Closed" : "Queue not Initialized"}
                </div>
            </div>

            <div className="mb-4">
                <LowStockBanner />
            </div>

            {(error || actionError) && (
                <div className='bg-danger-light border border-danger/30 text-danger text-sm font-medium px-4 py-3 rounded-xl mb-6 shadow-sm'>{error || actionError}</div>
            )}

            {/* Stats bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'
            >
                {[
                    { label: "Total Booked", value: appointments.length, color: "accent", },
                    { label: "Patients Treated", value: completedCount, color: "primary" },
                    { label: "Waiting Room", value: waitingCount, color: "warning" },
                    { label: "No Shows", value: noShowCount, color: "danger" },
                ].map((stat) => {
                    const colors: Record<string, string> = { accent: "border-l-accent", primary: "border-l-primary", warning: "border-l-warning", danger: "border-l-danger" };
                    return (
                        <div key={stat.label} className={`border border-gray-200 bg-white rounded-xl shadow-sm border-l-4 ${colors[stat.color]} p-5`}>
                            <p className={`text-4xl font-black text-dark mb-1`}>{stat.value}</p>
                            <p className='text-gray-text text-xs font-bold uppercase tracking-wider'>{stat.label}</p>
                        </div>
                    )
                })}
            </motion.div>

            {/* Queue Controllers */}
            {queue && queue.status !== 'closed' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
                    className='flex items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm'
                >
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Controls:</div>
                    {queue.status === "open" ? (
                        <button onClick={handlePause} disabled={isActioning} className='btn-secondary flex items-center gap-2 text-sm bg-gray-100 text-dark hover:bg-gray-200'>
                            <FaPause /> Pause Queue
                        </button>
                    ) : queue.status === "paused" ? (
                        <button onClick={handleResume} disabled={isActioning} className='btn-primary bg-warning hover:bg-warning-dark flex items-center gap-2 text-sm shadow-warning/30'>
                            <TbTriangleFilled className='rotate-90' /> Resume Queue
                        </button>
                    ) : null}
                    <button onClick={handleClose} disabled={isActioning} className='btn-outlined text-danger border-danger/30 hover:bg-danger hover:text-white flex items-center gap-2 text-sm ml-auto'>
                        <MdDoorSliding size={18} /> Close Clinic Day
                    </button>
                </motion.div>
            )}

            {/* Main 2-Column Dashboard Layout */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8"
            >

                {/* 📌 Left Column: Live Queue (Spans 2 cols on lg) */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className='card flex-1 p-0 overflow-hidden'>
                        <div className='p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50'>
                            <h2 className='inline-flex text-lg font-black text-dark items-center gap-2 m-0'>
                                <span className="bg-primary/20 text-primary p-2 rounded-lg"><GiPlayerNext size={20} /></span>
                                Active Queue
                            </h2>
                            <button onClick={handleCallNext} disabled={isCallingNext || queue?.status !== "open" || waitingCount === 0} className='btn-primary items-center gap-2 py-2 shadow-lg shadow-primary/30'>
                                {isCallingNext ? (
                                    <><span className='animate-spin inline-block mr-2'>⟳</span>Calling...</>
                                ) : (
                                    <span className='flex items-center gap-2 font-bold'>Next Patient <TbPlayerTrackNextFilled size={18} /></span>
                                )}
                            </button>
                        </div>

                        {isLoading ? (
                            <div className='text-center py-16 text-gray-text font-medium animate-pulse'>Loading Live Queue...</div>
                        ) : appointments.length === 0 ? (
                            <div className='text-center py-16 bg-white'>
                                <div className="text-gray-300 mb-3 flex justify-center"><GiPlayerNext size={48} /></div>
                                <p className='font-bold text-dark text-lg'>Waiting room is empty</p>
                                <p className='text-sm text-gray-text mt-1 max-w-sm mx-auto'>{queue ? "No patients have booked appointments yet today." : "Queue has not been initialized by the assistant yet."}</p>
                            </div>
                        ) : (
                            <div className='overflow-x-auto p-5'>
                                <table className='w-full text-sm text-left'>
                                    <thead>
                                        <tr className='border-b-2 border-gray-100'>
                                            {["Token", "Patient Info", "Type", "Est. Wait", "Status", ""].map((header) => (
                                                <th key={header} className='text-xs font-bold text-gray-400 uppercase tracking-wider pb-3'>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {appointments.map((appt: IAppointment) => {
                                            const isServing = appt.status === "serving";
                                            if (appt.status === 'completed' || appt.status === 'noshow') return null; // Only show active items in main table
                                            const patient = appt.patientId as unknown as { name: string; phone: string };

                                            return (
                                                <tr key={appt._id} className={`transition-all ${isServing ? "bg-primary/5 shadow-inner" : "hover:bg-gray-50"}`}>
                                                    <td className={`py-4 pr-4 pl-3 font-mono text-lg font-black ${isServing ? 'text-primary' : 'text-dark'}`}>{appt.tokenCode}</td>
                                                    <td className='py-4 pr-4'>
                                                        <p className='font-bold text-dark'>{patient?.name || "Unknown"}</p>
                                                        <p className='text-gray-500 text-xs mt-0.5'>{patient?.phone || ""}</p>
                                                    </td>
                                                    <td className='py-4 pr-4'><TypeBadge type={appt.type} /></td>
                                                    <td className='py-4 pr-4 font-medium text-gray-text'>{appt.estimatedTime}</td>
                                                    <td className='py-4 pr-4'><StatusBadge status={appt.status} /></td>
                                                    <td className='py-4 text-right pr-2'>
                                                        {isServing ? (
                                                            <button onClick={() => navigate(`/doctor/consultation/${appt._id}`)} className='bg-dark hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-xs transition-transform transform hover:scale-105 shadow-xl shadow-dark/20 ml-auto'>
                                                                Consult <FaArrowRight />
                                                            </button>
                                                        ) : (
                                                            <span className='w-full text-center inline-block text-gray-300'>-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* 📌 Right Column: Quick Actions & Recently Treated */}
                <div className="flex flex-col gap-6">
                    {/* Quick Access Grid */}
                    <div className="bg-dark rounded-2xl p-6 text-white shadow-xl shadow-dark/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Command Center</h3>
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <Link to="/management/patients" className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors">
                                <FaUsers size={24} className="text-primary-light" />
                                <span className="text-xs font-bold text-center text-white">Patient DB</span>
                            </Link>
                            <Link to="/management/inventory" className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors">
                                <FaBoxOpen size={24} className="text-warning" />
                                <span className="text-xs font-bold text-center text-white">Pharmacy</span>
                            </Link>
                        </div>
                    </div>

                    {/* Chart panel */}
                    <div className="card">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-dark mb-4">Daily Activity Segment</h3>
                        <div className="h-40 w-full mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} width={65} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="patients" radius={[0, 8, 8, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recently Treated Patients */}
                    <div className="card flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-dark">Recently Treated</h3>
                            <span className="bg-success/10 text-success-dark text-xs font-bold px-2 py-1 rounded-md">{recentlyTreated.length} Today</span>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                            {recentlyTreated.length > 0 ? (
                                recentlyTreated.map((appt) => {
                                    const patient = appt.patientId as unknown as { name: string; _id: string };
                                    return (
                                        <div key={appt._id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-success/20 text-success-dark flex items-center justify-center font-bold text-xs">
                                                    {patient.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-dark text-sm">{patient.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 font-mono">Token: {appt.tokenCode}</p>
                                                </div>
                                            </div>
                                            <Link to={`/management/patients/${patient._id}`} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition">
                                                <FaArrowRight size={12} />
                                            </Link>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <p className="font-bold text-dark text-sm">No patients treated yet</p>
                                    <p className="text-xs text-gray-text mt-1">Completed consultations will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </motion.div>

        </div>
    )
}

export default Dashboard