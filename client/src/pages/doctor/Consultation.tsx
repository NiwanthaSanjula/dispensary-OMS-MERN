import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { IPatient } from "../../types/patient.types";
import type { IAppointment } from "../../types/appointment.types";
import type { IConsultation } from "../../types/consultation.types";
import type { IMedicine } from "../../types/medicine.types";
import type { IPrescriptionMedicine } from "../../types/prescription.types";
import appointmentService from "../../api/services/appointment.service";
import consultationService from "../../api/services/consultation.service";
import prescriptionService from "../../api/services/prescription.service";
import medicineService from "../../api/services/medicine.service";
import { checkAllergyConflict } from "../../config/allergyCheck";
import aiService, { type AISuggestion } from "../../api/services/ai.service";

/**
 * Doctor Consultation Screen
 * 3-panel layout:
 *   LEFT   → Patient profile + allergies + AI Summary (Phase 8)
 *   CENTER → Consultation form + Prescription builder
 *   RIGHT  → Visit history timeline
 *
 * Flow:
 *   1. Load appointment + patient data
 *   2. Create or load existing consultation
 *   3. Doctor fills form + adds medicines
 *   4. Allergy check runs on frontend before submit
 *   5. Complete → creates prescription → stock deducted
 */
const Consultation = () => {
    const { id: appointmentId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // ___ Data state ___
    const [appointment, setAppointment] = useState<IAppointment | null>(null);
    const [patient, setPatient] = useState<IPatient | null>(null);
    const [consultation, setConsultation] = useState<IConsultation | null>(null);
    const [visitHistory, setVisitHistory] = useState<IConsultation[]>([]);
    const [allMedicines, setAllMedicines] = useState<IMedicine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    // ___ Consultation form state ___
    const [symptoms, setSymptoms] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [followUpDate, setFollowUpDate] = useState("");
    //const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // ___ Prescription builder state ___
    const [medicines, setMedicines] = useState<IPrescriptionMedicine[]>([]);
    const [instructions, setInstructions] = useState("");
    const [medicineSearch, setMedicineSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    // ___ Allergy warning state ___
    const [allergyConflicts, setAllergyConflicts] = useState<string[]>([]);
    const [showAllergyModal, setShowAllergyModal] = useState(false);
    const [allergyOverride, setAllergyOverride] = useState(false);

    const [showAISummaryModal, setShowAISummaryModal] = useState(false);
    const [aiSummary, setAISummary] = useState("");
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [aiSummaryError, setAISummaryError] = useState("");

    const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [aiSuggestError, setAISuggestError] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ─────────────────────────────────────────────────────────────────
    // Load all data on mount
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            if (!appointmentId) return;
            try {
                setIsLoading(true);

                // Load appointment with patient details
                const appt = await appointmentService.getById(appointmentId);
                setAppointment(appt);

                const pat = appt.patientId as unknown as IPatient;
                setPatient(pat);

                // Load or create consultation
                const existingConsultation =
                    await consultationService.getByAppointment(appointmentId);

                if (existingConsultation) {
                    // Consultation already started — load its data
                    setConsultation(existingConsultation);
                    setSymptoms(existingConsultation.symptoms || "");
                    setDiagnosis(existingConsultation.diagnosis || "");
                    setNotes(existingConsultation.notes || "");
                } else {
                    // Start new consultation
                    const newConsultation = await consultationService.create({
                        appointmentId,
                        patientId: pat._id,
                    });
                    setConsultation(newConsultation);
                }

                // Load visit history for right panel
                const history = await consultationService.getByPatient(pat._id);
                setVisitHistory(history);

                // Load all active medicines for prescription builder
                const meds = await medicineService.getAll();
                setAllMedicines(meds.filter((m) => m.isActive && m.stockQty > 0));

            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setPageError(e.response?.data?.message || "Failed to load consultation");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [appointmentId]);

    // ─────────────────────────────────────────────────────────────────
    // Auto-save consultation notes (debounced feel — saves on blur)
    // ─────────────────────────────────────────────────────────────────
    const handleSaveNotes = async () => {
        if (!consultation) return;
        try {
            await consultationService.update(consultation._id, {
                symptoms,
                diagnosis,
                notes,
                followUpDate: followUpDate || undefined,
            });
        } catch {
            // Silent fail on auto-save — don't disrupt the doctor
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Prescription Builder
    // ─────────────────────────────────────────────────────────────────

    // Medicines filtered by search input
    const filteredMedicines = allMedicines.filter(
        (m) =>
            m.name.toLowerCase().includes(medicineSearch.toLowerCase()) &&
            !medicines.find((added) => added.medicineId === m._id)
    );

    const handleAddMedicine = (medicine: IMedicine) => {
        setMedicines((prev) => [
            ...prev,
            {
                medicineId: medicine._id,
                medicineName: medicine.name,
                dosage: "",
                duration: "",
                quantity: 1,
            },
        ]);
        setMedicineSearch("");
        setShowDropdown(false);
        setAllergyOverride(false); // Reset override when medicines change
    };

    const handleRemoveMedicine = (medicineId: string) => {
        setMedicines((prev) => prev.filter((m) => m.medicineId !== medicineId));
        setAllergyOverride(false);
    };

    const handleMedicineFieldChange = (
        medicineId: string,
        field: keyof IPrescriptionMedicine,
        value: string | number
    ) => {
        setMedicines((prev) =>
            prev.map((m) =>
                m.medicineId === medicineId ? { ...m, [field]: value } : m
            )
        );
    };

    // ─────────────────────────────────────────────────────────────────
    // AI Patient Briefing
    // Fetches summary then shows modal
    // Sets aiSummaryUsed = true on consultation via query param
    // ─────────────────────────────────────────────────────────────────
    const handleGetAISummary = async () => {
        if (!patient || !consultation) return;
        setIsLoadingSummary(true);
        setAISummaryError("");
        setShowAISummaryModal(true);

        try {
            const summary = await aiService.getPatientSummary(
                patient._id,
                consultation._id
            );
            setAISummary(summary);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setAISummaryError(
                e.response?.data?.message || "Failed to generate AI summary"
            );
        } finally {
            setIsLoadingSummary(false);
        }
    };


    // ─────────────────────────────────────────────────────────────────
    // AI Prescription Suggestions
    // Sends diagnosis + allergies + available medicines to Gemini
    // Returns suggested medicines doctor can add with one click
    // ─────────────────────────────────────────────────────────────────
    const handleGetAISuggestions = async () => {
        if (!diagnosis.trim()) {
            setAISuggestError("Please enter a diagnosis first");
            setShowSuggestions(true);
            return;
        }

        setIsLoadingSuggestions(true);
        setAISuggestError("");
        setShowSuggestions(true);

        try {
            const patientAllergies =
                (patientData?.allergies as string[]) || [];

            const suggestions = await aiService.getSuggestions({
                diagnosis,
                patientAllergies,
                consultationId: consultation?._id,
            });
            setAISuggestions(suggestions);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setAISuggestError(
                e.response?.data?.message || "Failed to get AI suggestions"
            );
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Add an AI-suggested medicine to prescription builder
    // ─────────────────────────────────────────────────────────────────
    const handleAddSuggestion = (suggestion: AISuggestion) => {
        // Find the medicine in our loaded list to get the ID
        const medicine = allMedicines.find(
            (m) => m.name.toLowerCase() === suggestion.name.toLowerCase()
        );
        if (!medicine) return;

        // Don't add if already in list
        if (medicines.find((m) => m.medicineId === medicine._id)) return;

        setMedicines((prev) => [
            ...prev,
            {
                medicineId: medicine._id,
                medicineName: medicine.name,
                dosage: suggestion.dosage,
                duration: suggestion.duration,
                quantity: suggestion.quantity,
            },
        ]);
    };

    // ─────────────────────────────────────────────────────────────────
    // Complete Consultation
    // ─────────────────────────────────────────────────────────────────
    const handleComplete = async () => {
        if (!consultation || !patient || !appointment) return;
        setSaveError("");

        // Validate form
        if (!diagnosis.trim()) {
            setSaveError("Diagnosis is required to complete the consultation");
            return;
        }

        // Run allergy check if medicines added
        if (medicines.length > 0 && !allergyOverride) {
            const patientData = patient as unknown as { allergies: string[] };
            const conflicts = checkAllergyConflict(
                medicines.map((m) => m.medicineName),
                patientData.allergies || []
            );
            if (conflicts.length > 0) {
                setAllergyConflicts(conflicts);
                setShowAllergyModal(true);
                return;
            }
        }

        setIsCompleting(true);

        try {
            // Save final consultation notes
            await consultationService.update(consultation._id, {
                symptoms,
                diagnosis,
                notes,
                followUpDate: followUpDate || undefined,
            });

            // Issue prescription if medicines were added
            if (medicines.length > 0) {
                // Validate all medicine fields
                for (const med of medicines) {
                    if (!med.dosage || !med.duration || med.quantity < 1) {
                        setSaveError(
                            `Please fill dosage, duration and quantity for ${med.medicineName}`
                        );
                        setIsCompleting(false);
                        return;
                    }
                }

                await prescriptionService.create({
                    consultationId: consultation._id,
                    patientId: patient._id,
                    medicines,
                    instructions: instructions || undefined,
                });

                // After saving consultation notes and issuing prescription
                // Mark appointment as completed automatically
                await appointmentService.updateStatus(
                    appointmentId!,
                    "completed"
                );
            }

            // Navigate back to doctor dashboard
            navigate("/doctor/dashboard");

        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setSaveError(e.response?.data?.message || "Failed to complete consultation");
        } finally {
            setIsCompleting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Loading / Error states
    // ─────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-text">
                Loading consultation...
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="bg-danger-light text-danger px-4 py-3 rounded-lg">
                {pageError}
            </div>
        );
    }

    const patientData = patient as unknown as IPatient & { allergies: string[] };

    // ─────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full min-h-0">

            {/* ── LEFT PANEL — Patient Profile ──────────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col gap-4">

                {/* Back button */}
                <button
                    onClick={() => navigate("/doctor/dashboard")}
                    className="text-gray-text text-sm hover:text-dark transition-colors
                     flex items-center gap-1"
                >
                    ← Back to Queue
                </button>

                {/* Patient card */}
                <div className="card">
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center
                            justify-center text-white text-2xl font-bold mb-2">
                            {patientData?.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-dark text-base text-center">
                            {patientData?.name}
                        </p>
                        <p className="text-gray-text text-xs">
                            {appointment?.tokenCode}
                        </p>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-2 text-sm border-t border-gray-border pt-3">
                        {patientData?.dateOfBirth && (
                            <div className="flex justify-between">
                                <span className="text-gray-text text-xs">Age</span>
                                <span className="text-dark text-xs font-medium">
                                    {new Date().getFullYear() -
                                        new Date(patientData.dateOfBirth).getFullYear()} yrs
                                </span>
                            </div>
                        )}
                        {patientData?.gender && (
                            <div className="flex justify-between">
                                <span className="text-gray-text text-xs">Gender</span>
                                <span className="text-dark text-xs font-medium capitalize">
                                    {patientData.gender}
                                </span>
                            </div>
                        )}
                        {patientData?.booldGroup && (
                            <div className="flex justify-between">
                                <span className="text-gray-text text-xs">Blood Group</span>
                                <span className="text-dark text-xs font-bold">
                                    {patientData.booldGroup}
                                </span>
                            </div>
                        )}
                        {patientData?.phone && (
                            <div className="flex justify-between">
                                <span className="text-gray-text text-xs">Phone</span>
                                <span className="text-dark text-xs">{patientData.phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Allergies */}
                    <div className="mt-3 border-t border-gray-border pt-3">
                        <p className="text-xs font-semibold text-danger mb-2">
                            ⚠ Allergies
                        </p>
                        {patientData?.allergies && patientData.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {patientData.allergies.map((a) => (
                                    <span
                                        key={a}
                                        className="bg-danger-light text-danger text-xs
                               px-2 py-0.5 rounded-full font-medium"
                                    >
                                        {a}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-text text-xs">None recorded</p>
                        )}
                    </div>
                </div>

                {/* AI Summary button — placeholder until Phase 8 */}
                <button
                    onClick={handleGetAISummary}
                    disabled={isLoadingSummary}
                    className="btn-secondary w-full flex items-center
                               justify-center gap-2"
                >
                    {isLoadingSummary ? (
                        <><span className="animate-spin">⟳</span> Generating...</>
                    ) : (
                        <>✦ AI Patient Briefing</>
                    )}
                </button>
                <p className="text-xs text-gray-text text-center -mt-2">
                    Available in Phase 8
                </p>
            </div>

            {/* ── CENTER PANEL — Consultation Form ──────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">

                {/* Panel header */}
                <div className="card py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-dark text-base">
                                Consultation — {appointment?.tokenCode}
                            </h2>
                            <p className="text-gray-text text-xs mt-0.5">
                                {appointment
                                    ? new Date(appointment.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    : ""}
                            </p>
                        </div>
                        <span className="badge-serving">In Progress</span>
                    </div>
                </div>

                {/* Error banner */}
                {saveError && (
                    <div className="bg-danger-light text-danger text-sm
                          px-4 py-3 rounded-lg">
                        {saveError}
                    </div>
                )}

                {/* Consultation notes */}
                <div className="card space-y-4">
                    <h3 className="section-title mb-0">Clinical Notes</h3>

                    <div>
                        <label className="input-label">Symptoms</label>
                        <textarea
                            className="input-field resize-none"
                            rows={3}
                            placeholder="Describe patient's symptoms..."
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            onBlur={handleSaveNotes}
                        />
                    </div>

                    <div>
                        <label className="input-label">
                            Diagnosis
                            <span className="text-danger ml-1 text-xs">*required</span>
                        </label>
                        <textarea
                            className="input-field resize-none"
                            rows={2}
                            placeholder="Enter diagnosis..."
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            onBlur={handleSaveNotes}
                        />
                    </div>

                    <div>
                        <label className="input-label">Notes</label>
                        <textarea
                            className="input-field resize-none"
                            rows={2}
                            placeholder="Additional clinical notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleSaveNotes}
                        />
                    </div>

                    <div>
                        <label className="input-label">
                            Follow-up Date
                            <span className="text-gray-text font-normal ml-1">(optional)</span>
                        </label>
                        <input
                            type="date"
                            className="input-field"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            onBlur={handleSaveNotes}
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>
                </div>

                {/* Prescription Builder */}
                <div className="card space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="section-title mb-0">Prescription</h3>

                        {/* AI Suggest placeholder — Phase 8 */}
                        <button
                            onClick={handleGetAISuggestions}
                            disabled={isLoadingSuggestions}
                            className="btn-secondary text-xs py-1.5 px-3
                                        flex items-center gap-1"
                        >
                            {isLoadingSuggestions ? (
                                <><span className="animate-spin text-xs">⟳</span> Loading...</>
                            ) : (
                                <>✦ AI Suggest</>
                            )}
                        </button>
                    </div>

                    {/* Medicine search */}
                    <div className="relative">
                        <label className="input-label">Add Medicine</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search medicine by name..."
                            value={medicineSearch}
                            onChange={(e) => {
                                setMedicineSearch(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() =>
                                setTimeout(() => setShowDropdown(false), 200)
                            }
                        />

                        {/* Dropdown */}
                        {showDropdown && medicineSearch && (
                            <div className="absolute z-10 left-0 right-0 bg-white border
                              border-gray-border rounded-lg shadow-lg
                              max-h-48 overflow-y-auto mt-1">
                                {filteredMedicines.length === 0 ? (
                                    <p className="text-gray-text text-sm px-3 py-2">
                                        No medicines found
                                    </p>
                                ) : (
                                    filteredMedicines.map((med) => (
                                        <button
                                            key={med._id}
                                            onMouseDown={() => handleAddMedicine(med)}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-bg
                                 text-sm transition-colors"
                                        >
                                            <p className="font-medium text-dark">{med.name}</p>
                                            <p className="text-gray-text text-xs">
                                                {med.category} · {med.stockQty} {med.unit} in stock
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* AI Suggestions Panel */}
                    {showSuggestions && (
                        <div className="border border-accent/30 rounded-lg
                  bg-accent-light p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-accent text-xs font-semibold flex
                    items-center gap-1">
                                    ✦ AI Suggestions
                                </p>
                                <button
                                    onClick={() => setShowSuggestions(false)}
                                    className="text-gray-text text-xs hover:text-dark"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Loading */}
                            {isLoadingSuggestions && (
                                <p className="text-gray-text text-xs text-center py-3">
                                    Gemini is thinking...
                                </p>
                            )}

                            {/* Error */}
                            {aiSuggestError && !isLoadingSuggestions && (
                                <p className="text-danger text-xs">{aiSuggestError}</p>
                            )}

                            {/* Suggestions list */}
                            {!isLoadingSuggestions && aiSuggestions.length > 0 && (
                                <div className="space-y-2">
                                    {aiSuggestions.map((suggestion, i) => {
                                        const alreadyAdded = medicines.find(
                                            (m) =>
                                                m.medicineName.toLowerCase() ===
                                                suggestion.name.toLowerCase()
                                        );
                                        const notInInventory = !allMedicines.find(
                                            (m) =>
                                                m.name.toLowerCase() ===
                                                suggestion.name.toLowerCase()
                                        );

                                        return (
                                            <div
                                                key={i}
                                                className={`bg-white rounded-lg p-2.5 border ${suggestion.warning
                                                    ? "border-warning"
                                                    : "border-gray-border"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-dark text-xs font-semibold">
                                                            {suggestion.name}
                                                        </p>
                                                        <p className="text-gray-text text-xs mt-0.5">
                                                            {suggestion.dosage} · {suggestion.duration} ·
                                                            Qty: {suggestion.quantity}
                                                        </p>
                                                        {/* Allergy warning */}
                                                        {suggestion.warning && (
                                                            <p className="text-warning text-xs mt-1 flex
                                                                            items-center gap-1">
                                                                ⚠ {suggestion.warning}
                                                            </p>
                                                        )}
                                                        {/* Not in inventory */}
                                                        {notInInventory && (
                                                            <p className="text-danger text-xs mt-1">
                                                                ✕ Not in inventory
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Add button */}
                                                    {!notInInventory && (
                                                        <button
                                                            onClick={() => handleAddSuggestion(suggestion)}
                                                            disabled={!!alreadyAdded}
                                                            className={`text-xs px-2.5 py-1 rounded-lg
                                                                        shrink-0 font-medium
                                                                        transition-colors ${alreadyAdded
                                                                    ? "bg-gray-bg text-gray-text cursor-not-allowed"
                                                                    : "bg-accent text-white hover:bg-blue-700"
                                                                }`}
                                                        >
                                                            {alreadyAdded ? "Added ✓" : "+ Add"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* No suggestions */}
                            {!isLoadingSuggestions &&
                                !aiSuggestError &&
                                aiSuggestions.length === 0 && (
                                    <p className="text-gray-text text-xs text-center py-2">
                                        No suggestions returned
                                    </p>
                                )}
                        </div>
                    )}



                    {/* Added medicines list */}
                    {medicines.length > 0 && (
                        <div className="space-y-3">
                            {medicines.map((med) => (
                                <div
                                    key={med.medicineId}
                                    className="border border-gray-border rounded-lg p-3 bg-gray-bg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-dark text-sm">
                                            {med.medicineName}
                                        </p>
                                        <button
                                            onClick={() => handleRemoveMedicine(med.medicineId)}
                                            className="text-danger text-xs hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="input-label text-xs">Dosage</label>
                                            <input
                                                type="text"
                                                className="input-field text-xs py-1.5"
                                                placeholder="1 tab 3x daily"
                                                value={med.dosage}
                                                onChange={(e) =>
                                                    handleMedicineFieldChange(
                                                        med.medicineId, "dosage", e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="input-label text-xs">Duration</label>
                                            <input
                                                type="text"
                                                className="input-field text-xs py-1.5"
                                                placeholder="5 days"
                                                value={med.duration}
                                                onChange={(e) =>
                                                    handleMedicineFieldChange(
                                                        med.medicineId, "duration", e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="input-label text-xs">Qty</label>
                                            <input
                                                type="number"
                                                className="input-field text-xs py-1.5"
                                                min={1}
                                                value={med.quantity}
                                                onChange={(e) =>
                                                    handleMedicineFieldChange(
                                                        med.medicineId,
                                                        "quantity",
                                                        parseInt(e.target.value) || 1
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* General instructions */}
                            <div>
                                <label className="input-label">
                                    General Instructions
                                    <span className="text-gray-text font-normal ml-1">(optional)</span>
                                </label>
                                <textarea
                                    className="input-field resize-none"
                                    rows={2}
                                    placeholder="e.g. Take after food, drink plenty of water..."
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {medicines.length === 0 && (
                        <p className="text-gray-text text-sm text-center py-4 border-2
                          border-dashed border-gray-border rounded-lg">
                            No medicines added yet
                        </p>
                    )}
                </div>

                {/* Complete button */}
                <button
                    onClick={handleComplete}
                    disabled={isCompleting || !diagnosis.trim()}
                    className="btn-primary w-full py-3 text-base font-bold
                     sticky bottom-0 disabled:opacity-50"
                >
                    {isCompleting
                        ? "Completing..."
                        : "✓ Complete Consultation"}
                </button>

            </div>

            {/* ── RIGHT PANEL — Visit History ────────────────────────────── */}
            <div className="w-64 shrink-0">
                <div className="card h-full overflow-y-auto">
                    <h3 className="section-title">
                        Visit History
                        <span className="text-gray-text font-normal ml-1 text-xs">
                            ({visitHistory.length})
                        </span>
                    </h3>

                    {visitHistory.length === 0 ? (
                        <p className="text-gray-text text-sm text-center py-8">
                            No previous visits
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {visitHistory.map((visit, index) => {
                                const apptInfo = visit.appointmentId as unknown as {
                                    tokenCode: string;
                                    date: string;
                                };
                                return (
                                    <div key={visit._id}>
                                        <div className="flex items-start gap-2">
                                            {/* Timeline dot */}
                                            <div className="flex flex-col items-center mt-1">
                                                <div className="w-2 h-2 rounded-full bg-accent
                                                    shrink-0" />
                                                {index < visitHistory.length - 1 && (
                                                    <div className="w-px h-full bg-gray-border
                                                         grow mt-1"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 pb-4">
                                                <p className="text-accent text-xs font-semibold">
                                                    {apptInfo?.date
                                                        ? new Date(apptInfo.date).toLocaleDateString(
                                                            "en-US",
                                                            { month: "short", day: "numeric", year: "numeric" }
                                                        )
                                                        : new Date(visit.createdAt).toLocaleDateString(
                                                            "en-US",
                                                            { month: "short", day: "numeric", year: "numeric" }
                                                        )}
                                                </p>
                                                {visit.diagnosis && (
                                                    <p className="text-dark text-xs font-medium mt-0.5">
                                                        {visit.diagnosis}
                                                    </p>
                                                )}
                                                {visit.symptoms && (
                                                    <p className="text-gray-text text-xs mt-0.5 truncate">
                                                        {visit.symptoms}
                                                    </p>
                                                )}
                                                {apptInfo?.tokenCode && (
                                                    <span className="font-mono text-xs text-gray-text">
                                                        {apptInfo.tokenCode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── AI Summary Modal ── */}
            {showAISummaryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center
                  justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full
                    max-w-md p-6">

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-dark text-base flex
                       items-center gap-2">
                                ✦ AI Patient Briefing
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAISummaryModal(false);
                                    setAISummary("");
                                    setAISummaryError("");
                                }}
                                className="text-gray-text hover:text-dark text-xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Loading */}
                        {isLoadingSummary && (
                            <div className="text-center py-8">
                                <div className="w-10 h-10 border-4 border-accent
                          border-t-transparent rounded-full
                          animate-spin mx-auto mb-3" />
                                <p className="text-gray-text text-sm">
                                    Gemini is reading patient history...
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {aiSummaryError && !isLoadingSummary && (
                            <div className="bg-danger-light text-danger text-sm
                        px-4 py-3 rounded-lg">
                                {aiSummaryError}
                            </div>
                        )}

                        {/* Summary text */}
                        {aiSummary && !isLoadingSummary && (
                            <>
                                <div className="bg-accent-light rounded-lg p-4">
                                    <p className="text-dark text-sm leading-relaxed">
                                        {aiSummary}
                                    </p>
                                </div>
                                <p className="text-gray-text text-xs mt-3 text-center">
                                    ✦ Generated by Gemini AI · Not a clinical decision tool
                                </p>
                            </>
                        )}

                        <button
                            onClick={() => {
                                setShowAISummaryModal(false);
                                setAISummary("");
                                setAISummaryError("");
                            }}
                            className="btn-outlined w-full mt-4"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ── Allergy Warning Modal ──────────────────────────────────── */}
            {showAllergyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center
                        justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-danger-light rounded-full flex
                              items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="font-bold text-danger text-lg">
                                Allergy Conflict Detected
                            </h3>
                        </div>

                        <p className="text-gray-text text-sm text-center mb-3">
                            The following medicines conflict with the patient's known allergies:
                        </p>

                        <div className="bg-danger-light rounded-lg p-3 mb-5">
                            {allergyConflicts.map((conflict) => (
                                <p key={conflict}
                                    className="text-danger text-sm font-semibold text-center">
                                    🔴 {conflict}
                                </p>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    // Remove conflicting medicines
                                    setMedicines((prev) =>
                                        prev.filter(
                                            (m) => !allergyConflicts.includes(m.medicineName)
                                        )
                                    );
                                    setShowAllergyModal(false);
                                    setAllergyConflicts([]);
                                }}
                                className="btn-danger flex-1"
                            >
                                Remove Medicine
                            </button>
                            <button
                                onClick={() => {
                                    setAllergyOverride(true);
                                    setShowAllergyModal(false);
                                    // Re-trigger complete after override
                                    setTimeout(() => handleComplete(), 100);
                                }}
                                className="btn-outlined flex-1"
                            >
                                Override & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Consultation;