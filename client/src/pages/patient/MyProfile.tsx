import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import authService from '../../api/services/auth.service';
import patientService from '../../api/services/patient.service';
import type { IPatient } from '../../types/patient.types';
import { FiLogOut, FiEdit2, FiSave, FiX } from 'react-icons/fi';

const MyProfile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [profile, setProfile] = useState<IPatient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [form, setForm] = useState({
        name: "",
        email: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        address: "",
        allergies: "",
    });

    // ─── FETCH PROFILE ───
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const data = await patientService.getMyProfile();
                setProfile(data);
                populateForm(data);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to load profile details");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const populateForm = (data: IPatient) => {
        setForm({
            name: data.name || "",
            email: data.email || "",
            // Provide a default empty string if not found, else format date suitable for input type="date"
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
            gender: data.gender || "",
            bloodGroup: data.bloodGroup || "",
            address: data.address || "",
            allergies: data.allergies?.length ? data.allergies.join(", ") : "",
        });
    };

    // ─── HANDLERS ───
    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            // clear frontend state regardless
        } finally {
            logout();
            navigate("/auth/login", { replace: true });
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        setError("");

        try {
            // Prepare payload
            const payload = {
                name: form.name,
                email: form.email,
                dateOfBirth: form.dateOfBirth,
                gender: form.gender,
                bloodGroup: form.bloodGroup,
                address: form.address,
                allergies: form.allergies ? form.allergies.split(",").map((a) => a.trim()).filter(Boolean) : [],
            };

            const updatedProfile = await patientService.update(profile._id, payload);
            setProfile(updatedProfile);
            populateForm(updatedProfile);
            setIsEditing(false);

            // Temporary success feedback could be added here
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (profile) populateForm(profile);
        setIsEditing(false);
        setError("");
    };

    // ─── RENDERING ───
    if (!user) return null;

    if (isLoading) {
        return <div className="text-center py-10 text-gray-text">Loading profile...</div>;
    }

    if (error && !isEditing) {
        return <div className="text-center py-10 text-danger bg-danger-light rounded-lg">{error}</div>;
    }

    if (!profile) {
        return <div className="text-center py-10 text-gray-text">Profile data not available...</div>;
    }

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="text-gray-text text-sm">View and manage your personal medical information</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn-danger flex items-center justify-center gap-2 text-sm px-4 py-2 w-full md:w-auto"
                >
                    <FiLogOut size={16} />
                    Logout
                </button>
            </div>

            {/* Profile Card */}
            <div className="card">
                {error && isEditing && (
                    <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-border pb-4 mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold uppercase shadow-md">
                            {profile.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-dark">{profile.name}</h2>
                            <p className="text-gray-text text-sm">Patient ID: <span className="font-mono text-dark">{profile._id.slice(-6).toUpperCase()}</span></p>
                            <p className="text-primary font-semibold text-sm mt-0.5">{profile.phone}</p>
                        </div>
                    </div>

                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="btn-outlined flex items-center gap-2 py-1.5 w-full md:w-auto justify-center">
                            <FiEdit2 size={16} />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={handleCancelEdit} disabled={isSaving} className="btn-outlined flex items-center gap-2 py-1.5 flex-1 justify-center">
                                <FiX size={16} />
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2 py-1.5 flex-1 justify-center">
                                <FiSave size={16} />
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information Block */}
                    <div className="space-y-4">
                        <h3 className="section-title text-sm border-none mb-2">Basic Information</h3>

                        <div>
                            <label className="input-label">Full Name</label>
                            {isEditing ? (
                                <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            ) : (
                                <p className="text-dark font-medium capitalize">{profile.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="input-label">Email Address</label>
                            {isEditing ? (
                                <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            ) : (
                                <p className={`font-medium ${profile.email ? "text-dark" : "text-gray-400 italic"}`}>{profile.email || "Not provided"}</p>
                            )}
                        </div>

                        <div>
                            <label className="input-label">Date of Birth</label>
                            {isEditing ? (
                                <input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                            ) : (
                                <p className={`font-medium ${profile.dateOfBirth ? "text-dark" : "text-gray-400 italic"}`}>
                                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="input-label">Address</label>
                            {isEditing ? (
                                <textarea rows={2} className="input-field resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            ) : (
                                <p className={`font-medium ${profile.address ? "text-dark" : "text-gray-400 italic"}`}>{profile.address || "Not provided"}</p>
                            )}
                        </div>
                    </div>

                    {/* Medical Information Block */}
                    <div className="space-y-4">
                        <h3 className="section-title text-sm border-none mb-2">Medical Profile</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Gender</label>
                                {isEditing ? (
                                    <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                ) : (
                                    <p className={`font-medium capitalize ${profile.gender ? "text-dark" : "text-gray-400 italic"}`}>{profile.gender || "—"}</p>
                                )}
                            </div>

                            <div>
                                <label className="input-label">Blood Group</label>
                                {isEditing ? (
                                    <select className="input-field" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                ) : (
                                    <p className={`font-medium uppercase ${profile.bloodGroup ? "text-danger" : "text-gray-400 italic"}`}>{profile.bloodGroup || "—"}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Known Allergies</label>
                            {isEditing ? (
                                <>
                                    <textarea
                                        rows={2}
                                        className="input-field resize-none"
                                        value={form.allergies}
                                        onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                                        placeholder="E.g. Penicillin, Peanuts (comma separated)"
                                    />
                                    <p className="text-xs text-gray-text mt-1">Separate multiple allergies with commas</p>
                                </>
                            ) : (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {profile.allergies && profile.allergies.length > 0 ? (
                                        profile.allergies.map((allergy, index) => (
                                            <span key={index} className="px-3 py-1 bg-danger-light text-danger rounded-full text-xs font-semibold capitalize">
                                                {allergy}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 italic font-medium">None reported</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="pt-4 mt-2 border-t border-gray-border/50">
                                <label className="input-label">Registered On</label>
                                <p className="text-sm font-medium text-dark">
                                    {new Date(profile.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;