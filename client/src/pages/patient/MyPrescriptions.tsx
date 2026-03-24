import { useState, useEffect } from "react";
import prescriptionService from "../../api/services/prescription.service";
import type { IPrescription } from "../../types/prescription.types";

/**
 * My Prescriptions — patient's full prescription history
 * Shows all prescriptions with medicines, dosage, instructions
 */
const MyPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState<IPrescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                // Backend auto-scopes to logged-in patient via userId
                // We need patient _id — get it via appointments or dedicated endpoint
                // For now we call getByPatient with "me" — backend resolves via auth
                const { data } = await import("../../api/axios").then((m) =>
                    m.default.get<{ data: IPrescription[] }>("/prescriptions/patient/me")
                );
                setPrescriptions(data.data);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to load prescriptions");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrescriptions();
    }, []);

    if (isLoading) {
        return (
            <div className="text-center py-16 text-gray-text text-sm">
                Loading prescriptions...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="page-title">My Prescriptions</h1>
                <p className="text-gray-text text-sm">
                    {prescriptions.length} prescription
                    {prescriptions.length !== 1 ? "s" : ""} total
                </p>
            </div>

            {error && (
                <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {prescriptions.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-3xl mb-3">💊</p>
                    <p className="font-medium text-dark">No prescriptions yet</p>
                    <p className="text-gray-text text-sm mt-1">
                        Your prescriptions will appear here after consultations
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {prescriptions.map((prescription) => {
                        const consultation = prescription.consultationId as unknown as {
                            diagnosis: string;
                            createdAt: string;
                        };

                        return (
                            <div key={prescription._id} className="card">

                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-dark text-sm">
                                            {consultation?.diagnosis || "Consultation"}
                                        </p>
                                        <p className="text-gray-text text-xs mt-0.5">
                                            {new Date(prescription.issuedAt).toLocaleDateString(
                                                "en-US",
                                                { month: "long", day: "numeric", year: "numeric" }
                                            )}
                                        </p>
                                    </div>
                                    <span className="text-xs bg-primary-light text-primary-dark
                                   px-2.5 py-1 rounded-full font-medium">
                                        Issued
                                    </span>
                                </div>

                                {/* Medicines table */}
                                <div className="border border-gray-border rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-bg border-b border-gray-border">
                                                {["Medicine", "Dosage", "Duration", "Qty"].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="text-left px-3 py-2 text-gray-text
                                       font-semibold"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-border">
                                            {prescription.medicines.map((med, i) => (
                                                <tr key={i} className="bg-white">
                                                    <td className="px-3 py-2 font-medium text-dark">
                                                        {med.medicineName}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-text">
                                                        {med.dosage}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-text">
                                                        {med.duration}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-text">
                                                        {med.quantity}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Instructions */}
                                {prescription.instructions && (
                                    <p className="text-gray-text text-xs mt-3 italic">
                                        📋 {prescription.instructions}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyPrescriptions;