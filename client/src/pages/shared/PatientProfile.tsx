import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import patientService from "../../api/services/patient.service";
import consultationService from "../../api/services/consultation.service";
import prescriptionService from "../../api/services/prescription.service";
import aiService from "../../api/services/ai.service";
import type { IPatient } from "../../types/patient.types";
import type { IConsultation } from "../../types/consultation.types";
import type { IPrescription } from "../../types/prescription.types";

type Tab = "history" | "prescriptions";

/**
 * Patient Profile Page
 * Shared by doctor and assistant
 *
 * Doctor sees:
 *   - Full profile + allergies
 *   - Visit history timeline
 *   - Prescriptions list
 *   - AI Summary button
 *
 * Assistant sees:
 *   - Full profile
 *   - Edit patient info
 *   - Visit history (read only)
 */
const PatientProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDoctor = user?.role === "doctor";
    const isAssistant = user?.role === "assistant";

    const [activeTab, setActiveTab] = useState<Tab>("history");
    const [patient, setPatient] = useState<IPatient | null>(null);
    const [consultations, setConsultations] = useState<IConsultation[]>([]);
    const [prescriptions, setPrescriptions] = useState<IPrescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // ── AI Summary state ──
    const [showAISummary, setShowAISummary] = useState(false);
    const [aiSummary, setAISummary] = useState("");
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiError, setAIError] = useState("");

    // ── Edit mode state ──
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "", phone: "", email: "",
        bloodGroup: "", address: "",
        allergies: "" // comma separated string for easy editing
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // ─────────────────────────────────────────────────────────────────
    // Load data
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                setError("");

                const pat = await patientService.getById(id);
                setPatient(pat);

                // Pre-fill edit form
                setEditForm({
                    name: pat.name || "",
                    phone: pat.phone || "",
                    email: pat.email || "",
                    bloodGroup: pat.booldGroup || "",
                    address: pat.address || "",
                    allergies: pat.allergies?.join(", ") || "",
                });

                // Doctor loads full history
                if (isDoctor) {
                    const [consults, prescripts] = await Promise.all([
                        consultationService.getByPatient(id),
                        prescriptionService.getByPatient(id),
                    ]);
                    setConsultations(consults);
                    setPrescriptions(prescripts);
                }

            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to load patient");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, isDoctor]);

    // ─────────────────────────────────────────────────────────────────
    // AI Summary
    // ─────────────────────────────────────────────────────────────────
    const handleAISummary = async () => {
        if (!id) return;
        setIsLoadingAI(true);
        setAIError("");
        setShowAISummary(true);
        setAISummary("");

        try {
            const summary = await aiService.getPatientSummary(id);
            setAISummary(summary);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setAIError(e.response?.data?.message || "Failed to generate summary");
        } finally {
            setIsLoadingAI(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Edit Patient
    // ─────────────────────────────────────────────────────────────────
    const handleSaveEdit = async () => {
        if (!id) return;
        setIsSaving(true);
        setSaveError("");

        try {
            const updated = await patientService.update(id, {
                name: editForm.name,
                phone: editForm.phone,
                email: editForm.email || undefined,
                bloodGroup: editForm.bloodGroup || undefined,
                address: editForm.address || undefined,
                // Convert comma-separated string back to array
                allergies: editForm.allergies
                    ? editForm.allergies.split(",").map((a) => a.trim()).filter(Boolean)
                    : [],
            });
            setPatient(updated);
            setIsEditing(false);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setSaveError(e.response?.data?.message || "Failed to update patient");
        } finally {
            setIsSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Loading / Error
    // ─────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="text-center py-16 text-gray-text">
                Loading patient profile...
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="bg-danger-light text-danger px-4 py-3 rounded-lg">
                {error || "Patient not found"}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────
    return (
        <div>

            {/* ── Back button ── */}
            <button
                onClick={() => navigate("/management/patients")}
                className="text-gray-text text-sm hover:text-dark
                   transition-colors flex items-center gap-1 mb-5"
            >
                ← Back to Patients
            </button>

            <div className="grid grid-cols-3 gap-5">

                {/* ══════════════════════════════════════════════════════ */}
                {/* LEFT COLUMN — Profile Card                            */}
                {/* ══════════════════════════════════════════════════════ */}
                <div className="col-span-1 space-y-4">

                    {/* Profile card */}
                    <div className="card">

                        {/* Avatar + name */}
                        <div className="flex flex-col items-center text-center
                            mb-4 pb-4 border-b border-gray-border">
                            <div className="w-16 h-16 rounded-full bg-primary
                              flex items-center justify-center
                              text-white text-2xl font-bold mb-3">
                                {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="font-bold text-dark text-base">
                                {patient.name}
                            </h2>
                            <p className="text-gray-text text-sm">{patient.phone}</p>
                            {patient.email && (
                                <p className="text-gray-text text-xs mt-0.5">
                                    {patient.email}
                                </p>
                            )}
                        </div>

                        {/* Info fields */}
                        {!isEditing ? (
                            <div className="space-y-3">
                                {[
                                    { label: "Gender", value: patient.gender },
                                    { label: "Blood Group", value: patient.booldGroup },
                                    { label: "Address", value: patient.address },
                                    {
                                        label: "Date of Birth",
                                        value: patient.dateOfBirth
                                            ? new Date(patient.dateOfBirth).toLocaleDateString(
                                                "en-US",
                                                { month: "long", day: "numeric", year: "numeric" }
                                            )
                                            : undefined,
                                    },
                                ].map(({ label, value }) => (
                                    value ? (
                                        <div key={label} className="flex justify-between
                                                items-start gap-2">
                                            <span className="text-gray-text text-xs
                                       shrink-0">
                                                {label}
                                            </span>
                                            <span className="text-dark text-xs font-medium
                                       text-right capitalize">
                                                {value}
                                            </span>
                                        </div>
                                    ) : null
                                ))}

                                {/* Allergies */}
                                <div className="pt-2 border-t border-gray-border">
                                    <p className="text-xs font-semibold text-danger mb-2">
                                        ⚠ Allergies
                                    </p>
                                    {patient.allergies && patient.allergies.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {patient.allergies.map((a) => (
                                                <span
                                                    key={a}
                                                    className="bg-danger-light text-danger
                                     text-xs px-2 py-0.5 rounded-full"
                                                >
                                                    {a}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-text text-xs">
                                            None recorded
                                        </p>
                                    )}
                                </div>

                                {/* Edit button — assistant only */}
                                {isAssistant && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-outlined w-full text-sm mt-2"
                                    >
                                        Edit Patient Info
                                    </button>
                                )}
                            </div>

                        ) : (
                            /* ── Edit Form ── */
                            <div className="space-y-3">
                                {saveError && (
                                    <p className="text-danger text-xs">{saveError}</p>
                                )}

                                {[
                                    { label: "Name", key: "name", type: "text" },
                                    { label: "Phone", key: "phone", type: "tel" },
                                    { label: "Email", key: "email", type: "email" },
                                    { label: "Blood Group", key: "bloodGroup", type: "text" },
                                    { label: "Address", key: "address", type: "text" },
                                ].map(({ label, key, type }) => (
                                    <div key={key}>
                                        <label className="input-label text-xs">{label}</label>
                                        <input
                                            type={type}
                                            className="input-field text-sm py-2"
                                            value={editForm[key as keyof typeof editForm]}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, [key]: e.target.value })
                                            }
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label className="input-label text-xs">
                                        Allergies
                                        <span className="text-gray-text font-normal ml-1">
                                            (comma separated)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field text-sm py-2"
                                        placeholder="Penicillin, Aspirin"
                                        value={editForm.allergies}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, allergies: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setSaveError("");
                                        }}
                                        className="btn-outlined flex-1 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving}
                                        className="btn-primary flex-1 text-sm"
                                    >
                                        {isSaving ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Summary button — doctor only */}
                    {isDoctor && (
                        <button
                            onClick={handleAISummary}
                            disabled={isLoadingAI}
                            className="btn-secondary w-full flex items-center
                         justify-center gap-2"
                        >
                            {isLoadingAI ? (
                                <><span className="animate-spin">⟳</span> Generating...</>
                            ) : (
                                <>✦ AI Patient Briefing</>
                            )}
                        </button>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* RIGHT COLUMN — History Tabs                           */}
                {/* ══════════════════════════════════════════════════════ */}
                <div className="col-span-2">

                    {/* Tabs — doctor only */}
                    {isDoctor && (
                        <>
                            <div className="flex gap-1 mb-4 border-b border-gray-border">
                                {(["history", "prescriptions"] as Tab[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 text-sm font-medium
                                transition-colors capitalize border-b-2
                                -mb-px ${activeTab === tab
                                                ? "border-primary text-primary"
                                                : "border-transparent text-gray-text hover:text-dark"
                                            }`}
                                    >
                                        {tab === "history"
                                            ? `Visit History (${consultations.length})`
                                            : `Prescriptions (${prescriptions.length})`}
                                    </button>
                                ))}
                            </div>

                            {/* ── Visit History Tab ── */}
                            {activeTab === "history" && (
                                <div className="space-y-3">
                                    {consultations.length === 0 ? (
                                        <div className="card text-center py-10 text-gray-text">
                                            <p className="text-3xl mb-2">📋</p>
                                            <p>No visit history yet</p>
                                        </div>
                                    ) : (
                                        consultations.map((c, index) => {
                                            const apptInfo = c.appointmentId as unknown as {
                                                tokenCode: string; date: string;
                                            };
                                            return (
                                                <div key={c._id} className="card">
                                                    <div className="flex items-start gap-3">
                                                        {/* Timeline number */}
                                                        <div className="w-7 h-7 rounded-full
                                            bg-accent-light text-accent
                                            flex items-center justify-center
                                            text-xs font-bold shrink-0">
                                                            {consultations.length - index}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            {/* Date + token */}
                                                            <div className="flex items-center
                                              justify-between mb-2">
                                                                <p className="text-accent text-xs
                                               font-semibold">
                                                                    {apptInfo?.date
                                                                        ? new Date(apptInfo.date)
                                                                            .toLocaleDateString("en-US", {
                                                                                month: "long",
                                                                                day: "numeric",
                                                                                year: "numeric",
                                                                            })
                                                                        : new Date(c.createdAt)
                                                                            .toLocaleDateString("en-US", {
                                                                                month: "long",
                                                                                day: "numeric",
                                                                                year: "numeric",
                                                                            })}
                                                                </p>
                                                                {apptInfo?.tokenCode && (
                                                                    <span className="font-mono text-xs
                                                   text-gray-text">
                                                                        {apptInfo.tokenCode}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Diagnosis */}
                                                            {c.diagnosis && (
                                                                <p className="font-semibold text-dark
                                               text-sm mb-1">
                                                                    {c.diagnosis}
                                                                </p>
                                                            )}

                                                            {/* Symptoms */}
                                                            {c.symptoms && (
                                                                <p className="text-gray-text text-xs">
                                                                    Symptoms: {c.symptoms}
                                                                </p>
                                                            )}

                                                            {/* Notes */}
                                                            {c.notes && (
                                                                <p className="text-gray-text text-xs mt-1">
                                                                    Notes: {c.notes}
                                                                </p>
                                                            )}

                                                            {/* Follow-up */}
                                                            {c.followUpDate && (
                                                                <p className="text-warning text-xs mt-1">
                                                                    Follow-up:{" "}
                                                                    {new Date(c.followUpDate)
                                                                        .toLocaleDateString("en-US", {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                            year: "numeric",
                                                                        })}
                                                                </p>
                                                            )}

                                                            {/* AI used badge */}
                                                            {c.aiSummaryUsed && (
                                                                <span className="inline-block mt-1
                                                  text-xs bg-accent-light
                                                  text-accent px-2 py-0.5
                                                  rounded-full">
                                                                    ✦ AI used
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* ── Prescriptions Tab ── */}
                            {activeTab === "prescriptions" && (
                                <div className="space-y-3">
                                    {prescriptions.length === 0 ? (
                                        <div className="card text-center py-10 text-gray-text">
                                            <p className="text-3xl mb-2">💊</p>
                                            <p>No prescriptions yet</p>
                                        </div>
                                    ) : (
                                        prescriptions.map((p) => {
                                            const consult = p.consultationId as unknown as {
                                                diagnosis: string;
                                            };
                                            return (
                                                <div key={p._id} className="card">
                                                    {/* Header */}
                                                    <div className="flex items-center
                                          justify-between mb-3">
                                                        <div>
                                                            <p className="font-semibold text-dark
                                             text-sm">
                                                                {consult?.diagnosis || "Consultation"}
                                                            </p>
                                                            <p className="text-gray-text text-xs">
                                                                {new Date(p.issuedAt).toLocaleDateString(
                                                                    "en-US",
                                                                    {
                                                                        month: "long",
                                                                        day: "numeric",
                                                                        year: "numeric",
                                                                    }
                                                                )}
                                                            </p>
                                                        </div>
                                                        {p.aiSuggestUsed && (
                                                            <span className="text-xs bg-accent-light
                                               text-accent px-2 py-0.5
                                               rounded-full">
                                                                ✦ AI suggested
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Medicines table */}
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="border-b border-gray-border">
                                                                    {["Medicine", "Dosage",
                                                                        "Duration", "Qty"].map((h) => (
                                                                            <th
                                                                                key={h}
                                                                                className="text-left pb-2 pr-3
                                                 text-gray-text font-semibold"
                                                                            >
                                                                                {h}
                                                                            </th>
                                                                        ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-border">
                                                                {p.medicines.map((med, i) => (
                                                                    <tr key={i}>
                                                                        <td className="py-2 pr-3 font-medium
                                                   text-dark">
                                                                            {med.medicineName}
                                                                        </td>
                                                                        <td className="py-2 pr-3 text-gray-text">
                                                                            {med.dosage}
                                                                        </td>
                                                                        <td className="py-2 pr-3 text-gray-text">
                                                                            {med.duration}
                                                                        </td>
                                                                        <td className="py-2 text-gray-text">
                                                                            {med.quantity}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Instructions */}
                                                    {p.instructions && (
                                                        <p className="text-gray-text text-xs mt-2 italic">
                                                            📋 {p.instructions}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Assistant — just shows basic info message */}
                    {isAssistant && (
                        <div className="card text-center py-10 text-gray-text">
                            <p className="text-3xl mb-2">🔒</p>
                            <p className="font-medium text-dark">
                                Medical records are private
                            </p>
                            <p className="text-sm mt-1">
                                Only the doctor can view consultation
                                and prescription history
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── AI Summary Modal ── */}
            {showAISummary && (
                <div className="fixed inset-0 bg-black/50 flex items-center
                        justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full
                          max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-dark text-base
                             flex items-center gap-2">
                                ✦ AI Patient Briefing
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAISummary(false);
                                    setAISummary("");
                                    setAIError("");
                                }}
                                className="text-gray-text hover:text-dark text-xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Loading */}
                        {isLoadingAI && (
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
                        {aiError && !isLoadingAI && (
                            <div className="bg-danger-light text-danger text-sm
                              px-4 py-3 rounded-lg">
                                {aiError}
                            </div>
                        )}

                        {/* Summary */}
                        {aiSummary && !isLoadingAI && (
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
                                setShowAISummary(false);
                                setAISummary("");
                                setAIError("");
                            }}
                            className="btn-outlined w-full mt-4"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PatientProfile;