import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import patientService from "../../api/services/patient.service";
import type { IPatient } from "../../types/patient.types";
import useDebounce from "../../hooks/useDebounce";

/**
 * Doctor Patient List
 * Search + browse all patients
 * Click any patient → goes to full profile
 */
const PatientManagement = () => {
    const navigate = useNavigate();

    const [patients, setPatients] = useState<IPatient[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Debounce search — wait 400ms after user stops typing
    // Prevents API call on every keystroke
    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setIsLoading(true);
                setError("");
                const data = await patientService.getAll(
                    debouncedSearch || undefined
                );
                setPatients(data);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to load patients");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, [debouncedSearch]);

    return (
        <div>

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title">Patients</h1>
                    <p className="text-gray-text text-sm">
                        {!isLoading && `${patients.length} patients found`}
                    </p>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="mb-5">
                <input
                    type="text"
                    className="input-field max-w-md"
                    placeholder="Search by name or phone number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="bg-danger-light text-danger text-sm
                        px-4 py-3 rounded-lg mb-5">
                    {error}
                </div>
            )}

            {/* ── Patient Table ── */}
            <div className="card">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-text">
                        Loading patients...
                    </div>

                ) : patients.length === 0 ? (
                    <div className="text-center py-12 text-gray-text">
                        <p className="text-4xl mb-3">👥</p>
                        <p className="font-medium">
                            {search ? "No patients match your search" : "No patients yet"}
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="text-accent text-sm mt-2 hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>

                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-border">
                                    {["Patient", "Phone", "Blood Group",
                                        "Allergies", "Action"].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left text-xs font-semibold
                                 text-gray-text pb-3 pr-4"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-border">
                                {patients.map((patient) => (
                                    <tr
                                        key={patient._id}
                                        className="hover:bg-gray-bg transition-colors"
                                    >
                                        {/* Patient name + email */}
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary
                                                    flex items-center justify-center
                                                    text-white text-sm font-bold shrink-0"
                                                >
                                                    {patient.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-dark">
                                                        {patient.name}
                                                    </p>
                                                    {patient.email && (
                                                        <p className="text-gray-text text-xs">
                                                            {patient.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Phone */}
                                        <td className="py-3 pr-4 text-gray-text">
                                            {patient.phone}
                                        </td>

                                        {/* Blood group */}
                                        <td className="py-3 pr-4">
                                            {patient.booldGroup ? (
                                                <span className="font-bold text-dark">
                                                    {patient.booldGroup}
                                                </span>
                                            ) : (
                                                <span className="text-gray-text">—</span>
                                            )}
                                        </td>

                                        {/* Allergies */}
                                        <td className="py-3 pr-4">
                                            {patient.allergies && patient.allergies.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {patient.allergies.slice(0, 2).map((a) => (
                                                        <span
                                                            key={a}
                                                            className="bg-danger-light text-danger
                                         text-xs px-2 py-0.5 rounded-full"
                                                        >
                                                            {a}
                                                        </span>
                                                    ))}
                                                    {patient.allergies.length > 2 && (
                                                        <span className="text-gray-text text-xs">
                                                            +{patient.allergies.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-text text-xs">None</span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="py-3">
                                            <button
                                                onClick={() =>
                                                    navigate(`/management/patients/${patient._id}`)
                                                }
                                                className="btn-outlined text-xs py-1.5 px-3"
                                            >
                                                View Profile →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientManagement;