import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQueue } from '../../hooks/useQueue';
import type { IPatient } from '../../types/patient.types';
import queueService from '../../api/services/queue.service';
import patientService from '../../api/services/patient.service';
import type { AppointmentStatus, IAppointment } from '../../types/appointment.types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { FaCalendarPlus, FaChartPie } from "react-icons/fa";
import { IoDocuments } from "react-icons/io5";
import { FaCheckCircle, FaUsers, FaArrowRight, FaArrowLeft } from "react-icons/fa";
//import { getTodayLocal } from '../../config/dateHelpers';
import LowStockBanner from '../../components/LowStockBanner';
import { Link } from 'react-router-dom';

/**
 * Assistant Dashboard
 * Shows today's queue + allows booking appointments for patients
 */
const Dashboard = () => {
    const { user } = useAuth();
    const {
        queue,
        appointments,
        isLoading,
        error,
        waitingCount,
        completedCount,
        noShowCount,
        refetch,
    } = useQueue();

    // Queue init state
    const [isInitializing, setIsInitializing] = useState(false);
    const [initError, setInitError] = useState("");

    // Book model state
    const [showBookModal, setshowBookModal] = useState(false);
    const [bookStep, setbookStep] = useState<"phone" | "details" | "date">("phone");
    const [phoneInput, setphoneInput] = useState("");
    const [foundPatient, setfoundPatient] = useState<IPatient | null>(null);
    const [isNewPatient, setisNewPatient] = useState(false);
    const [newPatientName, setnewPatientName] = useState("");
    const [selectedDate, setselectedDate] = useState("");
    const [bookingNotes, setbookingNotes] = useState("");
    const [isBooking, setisBooking] = useState(false);
    const [bookError, setbookError] = useState("");
    const [bookSuccess, setbookSuccess] = useState<{
        tokenCode: string;
        estimatedTime: string;
    } | null>(null);

    // Available dates state
    const [availableDates, setavailableDates] = useState<{
        date: string;
        availableSlots: number;
        totalSlots: number
    }[]>([]);

    const handleInitQueue = async () => {
        setIsInitializing(true);
        setInitError("");
        try {
            await queueService.init();
            refetch();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setInitError(e.response?.data?.message || "Failed to initialize queue");
        } finally {
            setIsInitializing(false);
        }
    }

    const hanldePhoneLookup = async () => {
        if (!phoneInput.trim()) return;
        setbookError("");

        try {
            const patient = await patientService.getByPhone(phoneInput.trim());
            if (patient) {
                setfoundPatient(patient);
                setisNewPatient(false);
            } else {
                setfoundPatient(null);
                setisNewPatient(true);
            }

            // Load available dates
            const dates = await queueService.getAvailableDates();
            setavailableDates(dates);
            setbookStep("details");

        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setbookError(e.response?.data?.message || "Phone lookup failed");
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedDate) {
            setbookError("Please select a date");
            return;
        }
        if (isNewPatient && !newPatientName.trim()) {
            setbookError("Please enter a patient name");
            return;
        }

        setisBooking(true);
        setbookError("");

        try {
            let patientId = foundPatient?._id;

            if (isNewPatient) {
                const newPatient = await patientService.createNewPatient({
                    name: newPatientName.trim(),
                    phone: phoneInput.trim(),
                });
                patientId = newPatient._id;
            }

            if (!patientId) throw new Error("No patient ID available");

            const appointment = await queueService.issueToken({
                patientId,
                date: selectedDate,
                type: "manual",
                notes: bookingNotes || undefined,
            });

            setbookSuccess({
                tokenCode: appointment.tokenCode,
                estimatedTime: appointment.estimatedTime
            });
            refetch();

        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setbookError(e.response?.data?.message || "Booking failed");
        } finally {
            setisBooking(false);
        }
    };

    const handleCloseModel = () => {
        setshowBookModal(false);
        setbookStep("phone");
        setphoneInput("");
        setfoundPatient(null);
        setisNewPatient(false);
        setnewPatientName("");
        setselectedDate("");
        setbookingNotes("");
        setbookError("");
        setbookSuccess(null);
    }

    const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
        const classes: Record<AppointmentStatus, string> = {
            waiting: "badge-waiting",
            serving: "badge-serving",
            completed: "badge-completed",
            noshow: "badge-noshow",
            cancelled: "badge-cancelled",
        };
        return (
            <span className={classes[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const TypeBadge = ({ type }: { type: "online" | "manual" }) => (
        <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${type === "online"
                ? "bg-accent-light text-accent"
                : "bg-gray-bg text-gray-text border border-gray-border"
                }`}
        >
            {type === "online" ? "Online" : "Manual"}
        </span>
    );

    // Recharts Data
    const pieData = [
        { name: 'Waiting', value: waitingCount, color: '#f59e0b' },
        { name: 'Completed', value: completedCount, color: '#10b981' },
        { name: 'No Show', value: noShowCount, color: '#ef4444' }
    ].filter(d => d.value > 0);

    return (
        <div>
            {/* Header */}
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-6'>
                <div>
                    <h1 className='page-title'>Welcome, {user?.name}</h1>
                    <p className='text-gray-text text-sm'>
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                        })}
                    </p>
                </div>
                {/* Queue status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mt-3 md:mt-0 ${queue?.status === "open" ? "bg-primary-light text-primary-dark" : queue?.status === "paused" ? "bg-warning/25 text-warning" : "bg-gray-bg text-gray-text"}`}>
                    <div className={`w-2 h-2 rounded-full ${queue?.status === "open" ? "bg-primary animate-pulse" : queue?.status === "paused" ? "bg-warning" : "bg-gray-400"}`} />
                    {queue?.status === "open" ? "Queue Open" : queue?.status === "paused" ? "Queue Paused" : queue?.status === "closed" ? "Queue Closed" : "Queue Not Initialized"}
                </div>
            </div>

            <div className="my-2">
                <LowStockBanner />
            </div>

            {/* Error banner */}
            {(error || initError) && (
                <div className='bg-danger-light text-danger text-sm px-4 py-3 rounded-lg mb-5'>
                    {error || initError}
                </div>
            )}

            {/* Stats bar */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                {[
                    { label: "Total Today", value: appointments.length, color: "accent", },
                    { label: "Completed", value: completedCount, color: "primary" },
                    { label: "Waiting", value: waitingCount, color: "warning" },
                    { label: "No Show", value: noShowCount, color: "danger" },
                ].map((stat) => {
                    const colors: Record<string, string> = { accent: "border-l-accent", primary: "border-l-primary", warning: "border-l-warning", danger: "border-l-danger" };
                    return (
                        <div key={stat.label} className={`border border-gray-200 bg-white rounded-lg shadow-sm border-l-4 ${colors[stat.color]} px-5 py-4`}>
                            <p className={`text-4xl font-black text-dark mb-1`}>{stat.value}</p>
                            <p className='text-gray-text text-sm font-medium uppercase tracking-wider'>{stat.label}</p>
                        </div>
                    )
                })}
            </div>

            {/* Main Content Layout - 2 Columns */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

                {/* Column 1: Today's Queue Table */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className='card flex-1'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='section-title mb-0 flex items-center gap-2'>
                                <IoDocuments size={20} className="text-primary" /> Today's Queue
                            </h2>
                            <div>
                                {!queue && (
                                    <button onClick={handleInitQueue} disabled={isInitializing} className='btn-outlined text-sm'>
                                        {isInitializing ? "Initializing..." : "Initialize Queue"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Loading / Empty / Table */}
                        {isLoading ? (
                            <div className='py-8 text-center text-gray-text'>Loading Queue..</div>
                        ) : appointments.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-12 gap-3 text-center'>
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                    <IoDocuments size={32} className='text-gray-300' />
                                </div>
                                <p className='font-bold text-dark text-lg'>No appointments scheduled.</p>
                                <p className='text-sm text-gray-text max-w-sm'>
                                    {queue ? "The queue is open. Use the internal booking tool or wait for patients to book online." : "Initialize the queue to start accepting appointments today."}
                                </p>
                            </div>
                        ) : (
                            <div className='overflow-x-auto'>
                                <table className='w-full text-sm'>
                                    <thead>
                                        <tr className='border-b border-gray-border'>
                                            {["Token", "Patient", "Type", "Est.Time", "Status"].map((header) => (
                                                <th key={header} className='text-left text-xs font-bold text-gray-text uppercase tracking-wider pb-3 pr-4'>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-border'>
                                        {appointments.map((appt: IAppointment) => {
                                            const isServing = appt.status === 'serving';
                                            const patient = appt.patientId as unknown as { name: string; phone: string };
                                            return (
                                                <tr key={appt._id} className={`transition-colors text-left ${isServing ? "bg-primary-light border-l-4 border-l-primary" : "hover:bg-gray-bg"}`}>
                                                    <td className='py-3 pr-4 pl-2 font-mono font-bold text-dark'>{appt.tokenCode}</td>
                                                    <td className='py-3 pr-4'>
                                                        <p className="font-bold text-dark">{patient?.name || "Unknown"}</p>
                                                        <p className="text-xs text-gray-500">{patient?.phone || ""}</p>
                                                    </td>
                                                    <td className='py-3 pr-4'><TypeBadge type={appt.type} /></td>
                                                    <td className='py-3 pr-4 text-gray-text font-medium'>{appt.estimatedTime}</td>
                                                    <td className='py-3 pr-4'><StatusBadge status={appt.status} /></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Quick Actions & Charts */}
                <div className="flex flex-col gap-6">
                    {/* Quick Actions Panel */}
                    <div className="card">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-text mb-4">Command Center</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setshowBookModal(true)}
                                disabled={queue?.status !== "open"}
                                className="flex flex-col items-center justify-center p-4 bg-primary/10 hover:bg-primary/20 text-primary-dark rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center h-24"
                            >
                                <FaCalendarPlus size={24} className="mb-2" />
                                <span className="text-xs font-bold">Book Walk-in</span>
                            </button>
                            <Link
                                to="/management/patients"
                                className="flex flex-col items-center justify-center p-4 bg-accent/10 hover:bg-accent/20 text-accent-dark rounded-xl transition-colors text-center h-24"
                            >
                                <FaUsers size={24} className="mb-2" />
                                <span className="text-xs font-bold">Patient Records</span>
                            </Link>
                        </div>
                    </div>

                    {/* Pending Prescriptions Widget Tracker */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-text">Live Progress</h3>
                            <FaChartPie className="text-gray-400" />
                        </div>
                        {pieData.length > 0 ? (
                            <div className="h-48 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-sm font-medium text-gray-400 text-center px-4">
                                No activity yet today
                            </div>
                        )}
                        {/* Custom Legend */}
                        {pieData.length > 0 && (
                            <div className="flex justify-center gap-4 mt-2">
                                {pieData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-1.5 text-xs font-medium text-dark">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        {entry.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Book Appointment Modal (Unchanged) */}
            {showBookModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4'>
                    <div className='bg-white rounded-4xl shadow-2xl w-full max-w-md p-6 lg:p-8 transform transition-all'>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className='text-xl font-bold text-dark'>Book Walk-in</h3>
                            <button onClick={handleCloseModel} className='text-gray-400 hover:text-dark transition bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center'>x</button>
                        </div>
                        {bookSuccess ? (
                            <div className='text-center py-4'>
                                <div className='text-primary flex items-center justify-center mx-auto mb-4'><FaCheckCircle size={56} /></div>
                                <p className="font-bold text-dark text-xl mb-1">Booking Confirmed</p>
                                <div className='bg-gray-50 border border-gray-100 rounded-2xl p-6 mt-6'>
                                    <p className='text-gray-text text-sm font-medium uppercase tracking-widest mb-2'>Token Code</p>
                                    <p className='font-mono font-black text-primary text-4xl'>{bookSuccess.tokenCode}</p>
                                    <div className="w-full h-px bg-gray-200 my-4"></div>
                                    <p className='text-gray-text text-sm flex justify-between px-2'>
                                        Estimated Time: <span className='font-bold text-dark'>{bookSuccess.estimatedTime}</span>
                                    </p>
                                </div>
                                <button onClick={handleCloseModel} className='btn-primary w-full mt-6 py-3'>Done</button>
                            </div>
                        ) : (
                            <>
                                {bookError && <div className="bg-danger/10 text-danger text-sm font-medium px-4 py-3 rounded-xl mb-6 border border-danger/20">{bookError}</div>}
                                {bookStep === "phone" && (
                                    <div className="animate-fadeIn">
                                        <p className='text-gray-text text-sm mb-6'>Enter the patient's phone number to look them up instantly.</p>
                                        <label className='input-label'>Phone Number</label>
                                        <input type="tel" className='input-field mb-6 py-3 font-medium' placeholder='+94 77 XXX XXXX' value={phoneInput} onChange={(e) => setphoneInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && hanldePhoneLookup()} autoFocus />
                                        <button onClick={hanldePhoneLookup} disabled={!phoneInput.trim() || isBooking} className='btn-primary w-full py-3 flex items-center justify-center gap-2'>
                                            {isBooking ? <span className="animate-pulse">Searching...</span> : <>Lookup Patient <FaArrowRight /></>}
                                        </button>
                                    </div>
                                )}
                                {bookStep === "details" && (
                                    <div className='space-y-5 animate-fadeIn'>
                                        {foundPatient ? (
                                            <div className='bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4'>
                                                <div className='w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark font-black text-lg'>{foundPatient.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <p className='font-bold text-dark text-base'>{foundPatient.name}</p>
                                                    <p className='font-medium text-primary text-xs uppercase tracking-wider mt-0.5'>Verified Patient</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className='bg-warning/10 border border-warning/20 text-warning-dark text-sm font-medium px-4 py-3 rounded-xl mb-4'>New patient - {phoneInput}</div>
                                                <label className="input-label">Patient Name</label>
                                                <input type="text" className="input-field py-3" placeholder="Full legal name" value={newPatientName} onChange={(e) => setnewPatientName(e.target.value)} autoFocus />
                                            </div>
                                        )}
                                        <div>
                                            <label className='input-label mb-3'>Select Available Slot</label>
                                            <div className='grid grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-2 pb-2'>
                                                {availableDates.map((d) => {
                                                    const dateObj = new Date(d.date + "T00:00:00");
                                                    const isFull = d.availableSlots === 0;
                                                    const isSelected = selectedDate === d.date;
                                                    return (
                                                        <button key={d.date} disabled={isFull} onClick={() => setselectedDate(d.date)} className={`p-3 rounded-xl border-2 text-center transition-all ${isFull ? "border-gray-100 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed" : isSelected ? "border-primary bg-primary/5 text-primary-dark shadow-sm scale-[1.02]" : "border-gray-100 hover:border-primary/30 hover:bg-gray-50"}`}>
                                                            <p className='font-bold text-xs uppercase text-gray-500 tracking-wider mb-1'>{dateObj.toLocaleDateString("en-US", { weekday: "short" })}</p>
                                                            <p className={`text-xl font-black mb-1 ${isSelected ? 'text-primary' : 'text-dark'}`}>{dateObj.getDate()}</p>
                                                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block ${isFull ? "bg-danger/10 text-danger" : isSelected ? "bg-primary text-white" : "bg-success/10 text-success-dark"}`}>{isFull ? "FULL" : `${d.availableSlots} LEFT`}</div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <label className='input-label'>Reason for visit <span className="text-gray-400 font-normal ml-1">(optional)</span></label>
                                            <textarea className='input-field resize-none' rows={2} placeholder='e.g. fever, checkup...' value={bookingNotes} onChange={(e) => setbookingNotes(e.target.value)} />
                                        </div>
                                        <div className='flex gap-3 pt-2'>
                                            <button onClick={() => { setbookStep("phone"); setbookError(""); setfoundPatient(null); setisNewPatient(false); }} className='bg-gray-100 hover:bg-gray-200 text-dark font-bold px-4 rounded-xl flex items-center justify-center transition'>
                                                <FaArrowLeft />
                                            </button>
                                            <button onClick={handleBookAppointment} disabled={isBooking || !selectedDate} className='btn-primary flex-1 py-3 text-sm'>
                                                {isBooking ? <span className="animate-pulse">Confirming...</span> : "Confirm Booking"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard