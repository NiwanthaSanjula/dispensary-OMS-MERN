
/*
* Book appointment - logged-in patient
* Patinet's own booking flow - phone pre-filled form account
* Similar than guest flow - no phone lookup step need
*/

import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import type { AvailableDates } from "../../api/services/queue.service";
import type { IPatient } from "../../types/patient.types";
import queueService from "../../api/services/queue.service";
import patientService from "../../api/services/patient.service";

const BookAppointment = () => {

    const navigate = useNavigate();
    const { user } = useAuth();

    const [patient, setPatient] = useState<IPatient | null>(null);
    const [availableDates, setAvailableDates] = useState<AvailableDates[]>([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState<{
        tokenCode: string;
        estimatedTime: string;
        date: string;
    } | null>(null);

    // Load patient profile + available dates on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Find patient record linked to this user account
                const myPatient = await patientService.getMyProfile();

                setPatient(myPatient || null);

                // Load available dates
                const dates = await queueService.getAvailableDates();
                setAvailableDates(dates);

            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to load booking data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleBook = async () => {
        if (!selectedDate) {
            setError("Please select a date");
            return;
        }

        if (!patient) {
            setError("Patient profile not found. Please contact the assistant.");
            return;
        }

        setIsBooking(true);
        setError("");

        try {
            const appointment = await queueService.issueToken({
                patientId: patient._id,
                date: selectedDate,
                type: "online",
                notes: notes || undefined
            })

            setSuccess({
                tokenCode: appointment.tokenCode,
                estimatedTime: appointment.estimatedTime,
                date: selectedDate
            })

        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "Booking failed. Please try again.");
        } finally {
            setIsBooking(false);
        }
    }

    // ── Success screen ──
    if (success) {
        return (
            <div className="space-y-5">
                <h1 className="page-title">Booking Confirmed ✅</h1>

                <div className="card text-center py-8">
                    <p className="text-gray-text text-sm mb-1">Your Token</p>
                    <p className="font-mono font-bold text-dark text-5xl mb-2">
                        {success.tokenCode}
                    </p>
                    <p className="text-gray-text text-sm">
                        {new Date(success.date + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "long", month: "long", day: "numeric",
                        })}
                    </p>
                    <div className="bg-primary-light rounded-lg px-4 py-3 mt-4 text-sm">
                        <p className="text-gray-text">Estimated time</p>
                        <p className="font-bold text-dark text-lg">
                            ~{success.estimatedTime}
                        </p>
                    </div>
                    <p className="text-xs text-gray-text mt-4">
                        Show this token when you arrive at the dispensary
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/patient/dashboard")}
                        className="btn-primary flex-1"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/track")}
                        className="btn-outlined flex-1"
                    >
                        Track Token
                    </button>
                </div>
            </div>
        );
    }

    // ── Loading ──
    if (isLoading) {
        return (
            <div className="text-center py-16 text-gray-text">
                Loading...
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-12">
            <div>
                <h1 className="page-title">Book Appointment</h1>
                <p className="text-gray-text text-sm" >
                    Select a date to book your appointment
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Patient info card */}
            {patient && (
                <div className="card flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center
                          justify-center text-white font-bold">
                        {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-dark text-sm">{patient.name}</p>
                        <p className="text-gray-text text-xs">{patient.phone}</p>
                    </div>
                </div>
            )}

            {/* Date selection */}
            <div className="card">
                <h2 className="section-title">Select Date</h2>
                <div className="grid grid-cols-3 gap-2">
                    {availableDates.map((d) => {
                        const dateObj = new Date(d.date + "T00:00:00");
                        const isToday = d.date === new Date().toISOString().split("T")[0];
                        const isFull = d.availableSlots === 0;
                        const isSelected = selectedDate === d.date;

                        return (
                            <button
                                key={d.date}
                                disabled={isFull}
                                onClick={() => setSelectedDate(d.date)}
                                className={`p-3 rounded-xl border text-center transition-all ${isFull
                                    ? "border-gray-border bg-gray-bg opacity-40 cursor-not-allowed"
                                    : isSelected
                                        ? "border-primary bg-primary-light"
                                        : "border-gray-border hover:border-accent"
                                    }`}
                            >
                                <p className="text-xs text-gray-text font-medium">
                                    {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                                </p>
                                <p className={`text-xl font-bold mt-0.5 ${isSelected ? "text-primary-dark" : "text-dark"
                                    }`}>
                                    {dateObj.getDate()}
                                </p>
                                <p className="text-xs text-gray-text mt-0.5">
                                    {dateObj.toLocaleDateString("en-US", { month: "short" })}
                                </p>
                                <p className={`text-xs mt-1 font-medium ${isFull ? "text-danger" :
                                    isSelected ? "text-primary-dark" :
                                        "text-gray-text"
                                    }`}>
                                    {isFull ? "Full" :
                                        isToday ? "Today" :
                                            `${d.availableSlots} slots`}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Notes */}
            <div className="card">
                <label className="input-label">
                    Reason for Visit
                    <span className="text-gray-text font-normal ml-1">(optional)</span>
                </label>
                <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Describe your symptoms or reason for visit..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            {/* Submit */}
            <button
                onClick={handleBook}
                disabled={isBooking || !selectedDate}
                className="btn-primary w-full py-3 text-base"
            >
                {isBooking ? "Booking..." : "Confirm Booking →"}
            </button>
        </div>
    )
}

export default BookAppointment