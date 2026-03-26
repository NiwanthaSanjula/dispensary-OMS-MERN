import { useState } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../../api/services/ai.service";

/**
 * Symptom Checker — /patient/symptom-check
 * Patient describes symptoms -> Gemini gives general guidance
 *
 * Important UX rules:
 *   - Always show disclaimer BEFORE and AFTER AI response
 *   - Always show "Book Appointment" CTA after response
 *   - Never use the word "diagnosis" in the UI
 */
const SymptomCheck = () => {
    const navigate = useNavigate();

    const [symptoms, setSymptoms] = useState("");
    const [guidance, setGuidance] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasResult, setHasResult] = useState(false);

    const handleSubmit = async () => {
        if (!symptoms.trim() || symptoms.trim().length < 10) {
            setError("Please describe your symptoms in more detail (at least 10 characters)");
            return;
        }

        setIsLoading(true);
        setError("");
        setGuidance("");
        setHasResult(false);

        try {
            const result = await aiService.checkSymptoms(symptoms);
            setGuidance(result);
            setHasResult(true);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(
                e.response?.data?.message ||
                "Failed to get guidance. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSymptoms("");
        setGuidance("");
        setError("");
        setHasResult(false);
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <div>
                <h1 className="page-title">Symptom Check</h1>
                <p className="text-gray-text text-sm">
                    Describe your symptoms for general health guidance
                </p>
            </div>

            {/* Disclaimer banner — always visible */}
            <div className="bg-accent-light border border-accent/30
                      rounded-lg px-4 py-3 flex gap-3">
                <span className="text-accent text-lg shrink-0">ℹ</span>
                <p className="text-accent text-sm leading-relaxed">
                    This tool provides <strong>general health information only</strong>.
                    It is not a substitute for professional medical advice.
                    Always consult the doctor for proper assessment.
                </p>
            </div>

            {/* Input card */}
            <div className="card space-y-4">
                <div>
                    <label className="input-label">
                        Describe your symptoms
                    </label>
                    <textarea
                        className="input-field resize-none"
                        rows={5}
                        placeholder="e.g. I have had a fever of 38.5°C, sore throat, and mild headache for the past 2 days. I also feel tired and have a runny nose..."
                        value={symptoms}
                        onChange={(e) => {
                            setSymptoms(e.target.value);
                            setError("");
                        }}
                        disabled={isLoading}
                    />
                    <p className="text-gray-text text-xs mt-1">
                        {symptoms.length} characters
                        {symptoms.length < 10 && symptoms.length > 0
                            ? " — please provide more detail"
                            : ""}
                    </p>
                </div>

                {error && (
                    <div className="bg-danger-light text-danger text-sm
                          px-3 py-2 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    {hasResult && (
                        <button
                            onClick={handleReset}
                            className="btn-outlined flex-1"
                        >
                            Start Over
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !symptoms.trim()}
                        className="btn-primary flex-1 flex items-center
                       justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">⟳</span>
                                Checking...
                            </>
                        ) : (
                            <>✦ Get Guidance</>
                        )}
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="card text-center py-8">
                    <div className="w-10 h-10 border-4 border-accent
                          border-t-transparent rounded-full
                          animate-spin mx-auto mb-3" />
                    <p className="text-gray-text text-sm">
                        Analysing your symptoms...
                    </p>
                </div>
            )}

            {/* AI Response */}
            {guidance && !isLoading && (
                <div className="space-y-4">
                    <div className="card">
                        {/* AI label */}
                        <div className="flex items-center gap-2 mb-3 pb-3
                            border-b border-gray-border">
                            <span className="text-accent text-sm font-semibold">
                                ✦ AI
                            </span>
                            <span className="text-gray-text text-xs">
                                General health guidance
                            </span>
                        </div>

                        {/* Guidance text */}
                        <p className="text-dark text-sm leading-relaxed">
                            {guidance}
                        </p>
                    </div>

                    {/* CTA — always shown after response */}
                    <div className="card border-2 border-primary text-center py-5">
                        <p className="font-semibold text-dark text-sm mb-1">
                            Ready to see the doctor?
                        </p>
                        <p className="text-gray-text text-xs mb-4">
                            Book an appointment for proper assessment
                        </p>
                        <button
                            onClick={() => navigate("/patient/book")}
                            className="btn-primary px-8"
                        >
                            Book Appointment →
                        </button>
                    </div>

                    {/* Reminder disclaimer */}
                    <p className="text-gray-text text-xs text-center">
                        ✦ Generated by Gemini AI · For general information only
                    </p>
                </div>
            )}

        </div>
    );
};

export default SymptomCheck;