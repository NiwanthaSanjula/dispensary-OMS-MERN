import { useState, useEffect } from "react";
import appointmentService from "../../api/services/appointment.service";
import queueService from "../../api/services/queue.service";
import patientService from "../../api/services/patient.service";
import type { IAppointment, AppointmentStatus } from "../../types/appointment.types";
import type { IPatient } from "../../types/patient.types";

import { FaArrowRight, FaArrowLeft, FaCheckCircle, FaCalendarPlus } from "react-icons/fa";
import { getTodayLocal } from "../../config/dateHelpers";
import { motion } from "framer-motion";

const Appointments = () => {
    // ─── STATE: Appointments List ─────────
    const [appointments, setAppointments] = useState<IAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [listDate, setListDate] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    });

    // ─── STATE: Booking Modal (From Assistant Dashboard) ─────────
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
    const [availableDates, setavailableDates] = useState<{
        date: string;
        availableSlots: number;
        totalSlots: number;
    }[]>([]);


    // ─── FETCH: Appointments ─────────
    const fetchAppointments = async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await appointmentService.getAll({ date: listDate });
            setAppointments(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "Failed to load appointments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listDate]);

    // ─── HANDLERS: Status Updates ─────────
    const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
        try {
            await appointmentService.updateStatus(id, status);
            fetchAppointments();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || "Failed to update status");
        }
    };

    // ─── HANDLERS: Booking Modal ─────────
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

            // Load available dates for next step
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

            // Create new patient if they don't exist
            if (isNewPatient) {
                const newPatient = await patientService.createNewPatient({
                    name: newPatientName.trim(),
                    phone: phoneInput.trim(),
                });
                patientId = newPatient._id;
            }

            if (!patientId) throw new Error("No patient ID available");

            // Issue token
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

            // Refresh main table
            fetchAppointments();

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
    };

    // ─── STATS CALCULATION ─────────
    const total = appointments.length;
    const waiting = appointments.filter(a => a.status === "waiting").length;
    const completed = appointments.filter(a => a.status === "completed").length;

    // Helper: Safely get patient name
    const getPatientName = (patientId: IAppointment["patientId"]) => {
        if (!patientId) return "Unknown";
        if (typeof patientId === "string") return "Unknown (ID)";
        return patientId.name;
    };
    const getPatientPhone = (patientId: IAppointment["patientId"]) => {
        if (!patientId || typeof patientId === "string") return "";
        return patientId.phone;
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* ─── Header ─── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="page-title">Appointments</h1>
                    <p className="text-gray-text text-sm">Manage all appointments and walk-ins</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="date"
                        className="input-field"
                        value={listDate}
                        onChange={(e) => setListDate(e.target.value)}
                    />
                    <button onClick={() => setshowBookModal(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                        <FaCalendarPlus size={18} />
                        Book Appointment
                    </button>
                </div>
            </motion.div>

            {/* ─── Stats ─── */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-3 gap-4">
                <div className="card text-center py-4">
                    <div className="text-3xl font-bold text-dark">{total}</div>
                    <div className="text-xs text-gray-text mt-1 uppercase tracking-wide">Total</div>
                </div>
                <div className="card text-center py-4">
                    <div className="text-3xl font-bold text-warning">{waiting}</div>
                    <div className="text-xs text-gray-text mt-1 uppercase tracking-wide">Waiting</div>
                </div>
                <div className="card text-center py-4">
                    <div className="text-3xl font-bold text-success">{completed}</div>
                    <div className="text-xs text-gray-text mt-1 uppercase tracking-wide">Completed</div>
                </div>
            </motion.div>

            {/* ─── Appointments List ─── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="card">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-text">Loading appointments...</div>
                ) : error ? (
                    <div className="text-center py-10 text-danger">{error}</div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-text">No appointments found for this date.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-border text-sm text-gray-text">
                                    <th className="py-3 px-4 font-semibold">Token</th>
                                    <th className="py-3 px-4 font-semibold">Patient</th>
                                    <th className="py-3 px-4 font-semibold">Time</th>
                                    <th className="py-3 px-4 font-semibold">Type</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appt) => (
                                    <tr key={appt._id} className="border-b border-gray-border/50 hover:bg-gray-bg/50 transition">
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-primary-dark">{appt.tokenCode}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-dark">{getPatientName(appt.patientId)}</div>
                                            <div className="text-xs text-gray-text">{getPatientPhone(appt.patientId)}</div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-dark">
                                            {appt.estimatedTime}
                                        </td>
                                        <td className="py-3 px-4 text-sm capitalize">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${appt.type === "online" ? "bg-accent-light text-accent" : "bg-gray-bg text-gray-text border border-gray-border"}`}>
                                                {appt.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                                ${appt.status === "completed" ? "bg-success-light text-success" : ""}
                                                ${appt.status === "serving" ? "bg-primary-light text-primary-dark" : ""}
                                                ${appt.status === "waiting" ? "bg-warning-light text-warning" : ""}
                                                ${appt.status === "cancelled" ? "bg-danger-light text-danger" : ""}
                                                ${appt.status === "noshow" ? "bg-gray-border text-gray-text" : ""}
                                            `}>
                                                {appt.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <select
                                                className="input-field py-1 px-2 text-sm max-w-[130px]"
                                                value={appt.status}
                                                onChange={(e) => handleStatusUpdate(appt._id, e.target.value as AppointmentStatus)}
                                                disabled={appt.status === "completed" || appt.status === "cancelled"}
                                            >
                                                <option value="waiting">Waiting</option>
                                                <option value="serving">Serving</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="noshow">No Show</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* ─── BOOKING MODAL (Copied from Assistant Dashboard) ─── */}
            {showBookModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4'>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className='bg-white rounded-xl shadow-xl w-full max-w-md p-6'>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h3 className='text-base font-bold text-dark'>
                                Book Appointment
                            </h3>
                            <button
                                onClick={handleCloseModel}
                                className='text-gray-text hover:text-dark text-xl'
                            >
                                x
                            </button>
                        </div>

                        {/* Success State */}
                        {bookSuccess ? (
                            <div className='text-center py-4'>
                                <div className='text-primary flex items-center justify-center mx-auto mb-4'>
                                    <FaCheckCircle size={48} />
                                </div>
                                <p className="font-bold text-dark text-lg mb-1">
                                    Booking Confirmed
                                </p>

                                <div className='bg-primary-light rounded-xl p-4 mt-4'>
                                    <p className='text-gray-text text-sm mb-1'>Token Code</p>

                                    <p className='font-mono font-bold text-dark text-3xl'>
                                        {bookSuccess.tokenCode}
                                    </p>

                                    <p className='text-gray-text text-sm mt-2'>
                                        Estimated Time: {" "}
                                        <span className='font-medium text-dark'>
                                            {bookSuccess.estimatedTime}
                                        </span>
                                    </p>
                                </div>

                                <button
                                    onClick={handleCloseModel}
                                    className='btn-primary w-full mt-5'
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Error */}
                                {bookError && (
                                    <div className="bg-danger-light text-danger text-sm px-3 py-2 rounded-lg mb-4">
                                        {bookError}
                                    </div>
                                )}

                                {/* Step 1: Phone lookup */}
                                {bookStep === "phone" && (
                                    <div>
                                        <p className='text-gray-text text-sm mb-4'>
                                            Enter the patient's phone number to look them up
                                        </p>
                                        <label className='input-label'>
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            className='input-field mb-4'
                                            placeholder='07XXXXXXXX'
                                            value={phoneInput}
                                            onChange={(e) => setphoneInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && hanldePhoneLookup()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={hanldePhoneLookup}
                                            disabled={!phoneInput.trim()}
                                            className='btn-primary w-full flex items-center justify-center gap-2'
                                        >
                                            Lookup Up Patient
                                            <FaArrowRight />
                                        </button>
                                    </div>
                                )}

                                {/* Step 2: Patient Details + Date */}
                                {bookStep === "details" && (
                                    <div className='space-y-4'>
                                        {/* Patient info */}
                                        {foundPatient ? (
                                            <div className='bg-primary-light rounded-lg p-3 flex items-center gap-3'>
                                                <div className='w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm'>
                                                    {foundPatient.name.charAt(0).toUpperCase()}
                                                </div>

                                                <div>
                                                    <p className='font-semibold text-dark text-sm'>{foundPatient.name}</p>
                                                    <p className='font-semibold text-gray-text text-sm'>{foundPatient.phone} · Existing patient </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className='bg-orange-50 text-warning text-sm px-3 py-2 rounded-lg mb-3'>
                                                    New patient - {phoneInput}
                                                </div>
                                                <label className="input-label">Patient Name</label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Full name"
                                                    value={newPatientName}
                                                    onChange={(e) => setnewPatientName(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        )}

                                        {/* Date selection */}
                                        <div>
                                            <label className='input-label'>Select Date</label>
                                            <div className='grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1'>
                                                {availableDates.map((d) => {
                                                    const dateObj = new Date(d.date + "T00:00:00");
                                                    const isToday = d.date === getTodayLocal();
                                                    const isFull = d.availableSlots === 0;
                                                    const isSelected = selectedDate === d.date;

                                                    return (
                                                        <button
                                                            key={d.date}
                                                            disabled={isFull}
                                                            onClick={() => setselectedDate(d.date)}
                                                            className={`p-2 rounded-lg border text-center text-xs transition-colors
                                                                ${isFull
                                                                    ? "border-gray-border bg-gray-bg text-gray-text opacity-50 cursor-not-allowed"
                                                                    : isSelected
                                                                        ? "border-primary bg-primary-light text-primary-dark font-semibold"
                                                                        : "border-gray-border hover:border-accent hover:bg-accent-light"
                                                                }    
                                                            `}
                                                        >
                                                            <p className='font-semibold'>
                                                                {dateObj.toLocaleDateString("en-US", {
                                                                    weekday: "short",
                                                                })}
                                                            </p>

                                                            <p className='text-base font-bold'>
                                                                {dateObj.getDate()}
                                                            </p>

                                                            <p className={`text-xs mt-0.5 ${isFull ? "text-danger" : "text-gray-text"}`}>
                                                                {isFull ? "Full" : `${d.availableSlots} left`}
                                                            </p>

                                                            {isToday && (
                                                                <p className='text-primary text-xs font-bold'>Today</p>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Note */}
                                        <div>
                                            <label className='input-label'>
                                                Reason for visit
                                                <span className="text-gray-text font-normal ml-1">
                                                    (optional)
                                                </span>
                                            </label>
                                            <textarea
                                                className='input-field resize-none'
                                                rows={3}
                                                placeholder='e.g. fever, follow-up, checkup...'
                                                value={bookingNotes}
                                                onChange={(e) => setbookingNotes(e.target.value)}
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className='flex gap-2 pt-1'>
                                            <button
                                                onClick={() => {
                                                    setbookStep("phone")
                                                    setbookError("");
                                                    setfoundPatient(null);
                                                    setisNewPatient(false);
                                                }}
                                                className='btn-outlined flex flex-1 items-center gap-2 '
                                            >
                                                <FaArrowLeft size={16} />
                                                Back
                                            </button>

                                            <button
                                                onClick={handleBookAppointment}
                                                disabled={isBooking || !selectedDate}
                                                className='btn-primary flex-1'
                                            >
                                                {isBooking ? "Booking..." : "Confirm Booking"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Appointments;