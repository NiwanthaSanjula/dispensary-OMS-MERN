import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQueue } from '../../hooks/useQueue';
import type { IPatient } from '../../types/patient.types';
import queueService from '../../api/services/queue.service';
import patientService from '../../api/services/patient.service';
import type { AppointmentStatus, IAppointment } from '../../types/appointment.types';

import { FaCalendarPlus } from "react-icons/fa";
import { IoDocuments } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa"
import { getTodayLocal } from '../../config/dateHelpers';

/**
 * Assistant Dashboard
 * Shows today's queuee + allows booking appointments for patients
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

    // Queue init state_________________________________________________________________________________
    const [isInitializing, setIsInitializing] = useState(false);
    const [initError, setInitError] = useState("");

    // Book model state_________________________________________________________________________________
    const [showBookModal, setshowBookModal] = useState(false);
    const [bookStep, setbookStep] = useState<"phone" | "details" | "date">("phone");
    const [phoneInput, setphoneInput] = useState("");
    const [foundPatient, setfoundPatient] = useState<IPatient | null>(null);
    const [isNewPatient, setisNewPatient] = useState(false);
    const [newPatientName, setnewPatientName] = useState("");
    const [selectedDate, setselectedDate] = useState("");
    const [bookingNotes, setbookingNotes] = useState("")
    const [isBooking, setisBooking] = useState(false);
    const [bookError, setbookError] = useState("");
    const [bookSuccess, setbookSuccess] = useState<{
        tokenCode: string;
        estimatedTime: string;
    } | null>(null);


    /** ______________________________________________________________________________________________
     * 
     * Available dates state
     * _______________________________________________________________________________________________
     */

    const [availableDates, setavailableDates] = useState<{
        date: string;
        availableSlots: number;
        totalSlots: number
    }[]>([]);


    /** ______________________________________________________________________________________________
     * 
     * Handlers
     * _______________________________________________________________________________________________
     */
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

    /**
     * Look up patient by phone
     * If found: go to date selection
     * If not found: show name filed to create new patient
     */
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

            // Load available dayes next step
            const dates = await queueService.getAvailableDates();
            setavailableDates(dates);
            setbookStep("details");

        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setbookError(e.response?.data?.message || "Phone lookup failed");
        }
    };

    /**
     * Confirm patient details and select date
     * Issue token
     */
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

            // Create new patient if they dont't exist
            if (isNewPatient) {
                const newPatient = await patientService.createNewPatient({
                    name: newPatientName.trim(),
                    phone: phoneInput.trim(),
                });
                patientId = newPatient._id
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


    /** ______________________________________________________________________________________________
     * 
     * Sub components
     * _______________________________________________________________________________________________
     */
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


    return (
        <div>

            {/* Header */}
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-6'>
                <div>
                    <h1 className='page-title'>Welcome, {user?.name}</h1>
                    <p className='text-gray-text text-sm'>
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>

                {/* Queue status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mt-3 md:mt-0
                                ${queue?.status === "open"
                        ? "bg-primary-light text-primary-dark"
                        : queue?.status === "paused"
                            ? "bg-warning/25 text-warning"
                            : "bg-gray-bg text-gary-text"
                    }
                `}>
                    <div
                        className={`w-2 h-2 rounded-full ${queue?.status === "open" ? "bg-primary animate-pulse" :
                            queue?.status === "paused" ? "bg-warning" : "bg-gray-400"
                            }`}
                    />
                    {queue?.status === "open" ? "Queue Open" :
                        queue?.status === "paused" ? "Queue Paused" :
                            queue?.status === "closed" ? "Queue Closed" : "Queue Not Initialized"
                    }
                </div>
            </div>

            {/* Error banner */}
            {(error || initError) && (
                <div className='bg-danger-light text-danger text-sm px-4 py-3 rounded-lg mb-5' >
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

                    const colors: Record<string, string> = {
                        accent: "border-l-accent",
                        primary: "border-l-primary",
                        warning: "border-l-warning",
                        danger: "border-l-danger",
                    };

                    return (

                        <div
                            key={stat.label}
                            className={`border border-gray-200 bg-white rounded-lg shadow-md border-l-3 ${colors[stat.color]} px-4 py-3`}
                        >
                            <p className={`text-4xl font-BabesNeue text-${stat.color}`}>
                                {stat.value}
                            </p>

                            <p className='text-gray-text text-sm'>
                                {stat.label}
                            </p>
                        </div>
                    )
                })}
            </div>


            {/* Queue Table */}
            <div className='card'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='section-title mb-0'>Today's Queue</h2>

                    <div>
                        {/* init queue if not initialized yet */}
                        {!queue && (
                            <button
                                onClick={handleInitQueue}
                                disabled={isInitializing}
                                className='btn-outlined text-sm'
                            >
                                {isInitializing ? "Initializing..." : "Initialize Queue"}
                            </button>
                        )}

                        {/* Book Appointment Button */}
                        {queue?.status === "open" && (
                            <button
                                onClick={() => setshowBookModal(true)}
                                className='btn-primary flex items-center gap-2'
                            >
                                <FaCalendarPlus size={18} />
                                Book Appointment
                            </button>
                        )}

                    </div>
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className=''>
                        Loading Queue..
                    </div>
                ) : appointments.length === 0 ? (
                    <div className='flex flex-col items-center gap-2'>
                        <IoDocuments size={32} className='text-gray-500' />
                        <p className='font-medium'>
                            No appointments scheduled for today.
                        </p>
                        <p className='text-sm mt-1'>
                            {queue ? "Queue open - use Book Appointment to add patients"
                                : "Initialize the queue to start  accepting appointments"
                            }
                        </p>
                    </div>

                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-gray-border'>
                                    {["Token", "Patient", "Type", "Est.Time", "Status"].map((header) => (
                                        <th
                                            key={header}
                                            className='text-left text-xs font-semibold text-gray-text pb-3 pr-4'
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className='divide-y divide-gray-border'>
                                {appointments.map((appt: IAppointment) => {
                                    const isServing = appt.status === 'serving';
                                    const patient = appt.patientId as unknown as {
                                        name: string; phone: string
                                    };

                                    return (
                                        <tr
                                            key={appt._id}
                                            className={`transition-colors text-left ${isServing
                                                ? "bg-primary-light border-l-4 border-l-primary"
                                                : "hover:bg-gray-bg"
                                                }`}
                                        >
                                            <td className='py-3 pr-4 pl-2 font-mono font-bold text-dark'>
                                                {appt.tokenCode}
                                            </td>

                                            <td className='py-3 pr-4'>
                                                <p>{patient?.name || "Unknown"}</p>
                                                <p>{patient?.phone || ""}</p>
                                            </td>

                                            <td className='py-3 pr-4'>
                                                <TypeBadge type={appt.type} />
                                            </td>

                                            <td className='py-3 pr-4'>
                                                {appt.estimatedTime}
                                            </td>

                                            <td className='py-3 pr-4'>
                                                <StatusBadge status={appt.status} />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Book Appointment model */}
            {showBookModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center
                        justify-center z-50 px-4'>
                    <div className='bg-white rounded-xl shadow-xl w-full max-w-md p-6'>

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
                                    <div className="bg-danger-light text-danger text-sm
                                  px-3 py-2 rounded-lg mb-4">
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
                                                <div className='bg-orange-50 text-warning text-sm
                                                                px-3 py-2 rounded-lg mb-3'>
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
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard