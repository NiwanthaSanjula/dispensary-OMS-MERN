

/**
 * Inventory Page — shared by doctor and assistant
 * Two tabs: Medicines | Stock History
 *
 * Features:
 *   - Color coded stock status dots
 *   - Add medicine modal
 *   - Edit medicine modal
 *   - Add stock modal
 *   - Soft deactivate
 *   - Full stock movement history
 */

import { useEffect, useMemo, useState } from "react";
import type { CreateMedicinePayload } from "../../api/services/medicine.service";
import type { IMedicine, IStockLog } from "../../types/medicine.types";
import medicineService from "../../api/services/medicine.service";
import { motion } from "framer-motion";

// Stock status helper_________________________________________________________________________
type StockLevel = "sufficient" | "low" | "critical";

const getStockLevel = (medicine: IMedicine): StockLevel => {
    if (medicine.stockQty <= medicine.alertThreshold / 2) return "critical";
    if (medicine.stockQty <= medicine.alertThreshold) return "low";
    return "sufficient";
};

const stockLevelStyles: Record<StockLevel, {
    dot: string; row: string; badge: string;
}> = {
    sufficient: {
        dot: "bg-primary",
        row: "",
        badge: "bg-primary-light text-primary-dark",
    },
    low: {
        dot: "bg-warning",
        row: "bg-orange-50",
        badge: "bg-orange-50 text-warning",
    },
    critical: {
        dot: "bg-danger",
        row: "bg-danger-light/40",
        badge: "bg-danger-light text-danger",
    },
};

// Empty form state____________________________________________________________________________
const emptyForm: CreateMedicinePayload = {
    name: "",
    category: "",
    unit: "",
    stockQty: 0,
    alertThreshold: 20,
    supplierName: "",
    supplierPhone: "",
};

const Inventory = () => {

    const [activeTab, setActiveTab] = useState<"medicines" | "history">(
        "medicines"
    );

    // Data
    const [medicines, setMedicines] = useState<IMedicine[]>([]);
    const [stockLogs, setStockLogs] = useState<IStockLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "low" | "critical">("all");

    //  Add / Edit medicine modal
    const [showMedicineModal, setShowMedicineModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<IMedicine | null>(null);
    const [medicineForm, setMedicineForm] = useState<CreateMedicinePayload>(emptyForm);
    const [isSavingMedicine, setIsSavingMedicine] = useState(false);
    const [medicineModalError, setMedicineModalError] = useState("");

    // Add stock modal
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockTarget, setStockTarget] = useState<IMedicine | null>(null);
    const [stockQtyInput, setStockQtyInput] = useState("");
    const [isAddingStock, setIsAddingStock] = useState(false);
    const [stockModalError, setStockModalError] = useState("");



    // Fetch data_________________________________________________________________
    const fetchMedicines = async () => {
        try {
            const data = await medicineService.getAll();
            setMedicines(data);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "Failed to load medicines");
        }
    };

    const fetchStockLogs = async () => {
        try {
            const data = await medicineService.getStockLogs();
            setStockLogs(data);
        } catch {/* silent */ }
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await Promise.all([fetchMedicines(), fetchStockLogs()]);
            setIsLoading(false);
        };
        load();
    }, []);



    // Filtered medicines list___________________________________________________________________
    const filteredMedicines = useMemo(() => {
        return medicines.filter((m) => {
            const matchesSearch = m.name
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesCategory =
                !categoryFilter || m.category === categoryFilter;
            const level = getStockLevel(m);
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "low" && level === "low") ||
                (statusFilter === "critical" && level === "critical");
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [medicines, search, categoryFilter, statusFilter]);


    // Unique categories for filter dropdown
    const categories = useMemo(
        () => [...new Set(medicines.map((m) => m.category))].sort(),
        [medicines]
    );

    // Add / Edit Medicine Modal_________________________________________________________________
    const openAddModal = () => {
        setEditingMedicine(null);
        setMedicineForm(emptyForm);
        setMedicineModalError("");
        setShowMedicineModal(true);
    };

    const openEditModal = (medicine: IMedicine) => {
        setEditingMedicine(medicine);
        setMedicineForm({
            name: medicine.name,
            category: medicine.category,
            unit: medicine.unit,
            stockQty: medicine.stockQty,
            alertThreshold: medicine.alertThreshold,
            supplierName: medicine.supplierName || "",
            supplierPhone: medicine.supplierPhone || "",
        });
        setMedicineModalError("");
        setShowMedicineModal(true);
    };

    const handleSaveMedicine = async () => {
        if (!medicineForm.name || !medicineForm.category || !medicineForm.unit) {
            setMedicineModalError("Name, category and unit are required");
            return;
        }
        setIsSavingMedicine(true);
        setMedicineModalError("");

        try {
            if (editingMedicine) {
                await medicineService.update(editingMedicine._id, medicineForm);
            } else {
                await medicineService.create(medicineForm);
            }
            await fetchMedicines();
            setShowMedicineModal(false);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setMedicineModalError(
                e.response?.data?.message || "Failed to save medicine"
            );
        } finally {
            setIsSavingMedicine(false);
        }
    };

    const handleDeactivate = async (medicine: IMedicine) => {
        const confirmed = window.confirm(
            `Deactivate "${medicine.name}"? It will no longer appear in the inventory.`
        );
        if (!confirmed) return;
        try {
            await medicineService.deactivate(medicine._id);
            await fetchMedicines();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "Failed to deactivate medicine");
        }
    };

    // Add Stock Modal______________________________________________________________________________
    const openStockModal = (medicine: IMedicine) => {
        setStockTarget(medicine);
        setStockQtyInput("");
        setStockModalError("");
        setShowStockModal(true);
    };

    const handleAddStock = async () => {
        const qty = parseInt(stockQtyInput);
        if (!qty || qty < 1) {
            setStockModalError("Please enter a valid quantity");
            return;
        }
        if (!stockTarget) return;

        setIsAddingStock(true);
        setStockModalError("");

        try {
            await medicineService.addStock(stockTarget._id, qty);
            await fetchMedicines();
            await fetchStockLogs();
            setShowStockModal(false);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setStockModalError(
                e.response?.data?.message || "Failed to add stock"
            );
        } finally {
            setIsAddingStock(false);
        }
    };






    return (
        <div className="max-w-7xl mx-auto ">

            {/* ____Page Header____ */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title">Inventory</h1>
                    <p className="text-gray-text text-sm">
                        {medicines.length} medicines ·{" "}
                        {medicines.filter((m) => getStockLevel(m) !== "sufficient").length}{" "}
                        need attention
                    </p>
                </div>
                <button onClick={openAddModal} className="btn-primary">
                    + Add Medicine
                </button>
            </motion.div>

            {error && (
                <div className="bg-danger-light text-danger text-sm px-4 py-3
                        rounded-lg mb-5">
                    {error}
                </div>
            )}

            {/* ___ Tabs ___ */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex gap-1 mb-5 border-b border-gray-border">
                {(["medicines", "history"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors
                        capitalize border-b-2 -mb-px ${activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-text hover:text-dark"
                            }`}
                    >
                        {tab === "medicines" ? "Medicines" : "Stock History"}
                    </button>
                ))}
            </motion.div>

            {/*_____________________________________________________________________________________ */}
            {/* TAB 1 - MEDICINES*/}
            {/*_____________________________________________________________________________________ */}

            {activeTab === "medicines" && (
                <>
                    {/* Filter row */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-4">
                        <input
                            type="text"
                            className="input-field flex-1"
                            placeholder="Search medicines..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="input-field sm:w-48"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            className="input-field sm:w-40"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as typeof statusFilter)
                            }
                        >
                            <option value="all">All Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="critical">Critical</option>
                        </select>
                    </motion.div>

                    {/* Medicines table */}
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="card">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-text">
                                Loading medicines...
                            </div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="text-center py-12 text-gray-text">
                                <p className="text-3xl mb-3">💊</p>
                                <p className="font-medium">No medicines found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-border">
                                            {[
                                                "Status", "Name", "Category", "Unit",
                                                "Stock", "Threshold", "Actions",
                                            ].map((h) => (
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
                                        {filteredMedicines.map((med) => {
                                            const level = getStockLevel(med);
                                            const styles = stockLevelStyles[level];

                                            return (
                                                <tr
                                                    key={med._id}
                                                    className={`transition-colors ${styles.row}`}
                                                >
                                                    {/* Status dot */}
                                                    <td className="py-3 pr-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full
                                              shrink-0 ${styles.dot}`} />
                                                            <span className={`text-xs px-2 py-0.5
                                               rounded-full font-medium
                                               ${styles.badge}`}>
                                                                {level.charAt(0).toUpperCase() +
                                                                    level.slice(1)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Name */}
                                                    <td className="py-3 pr-4">
                                                        <p className="font-medium text-dark">
                                                            {med.name}
                                                        </p>
                                                        {med.supplierName && (
                                                            <p className="text-gray-text text-xs">
                                                                {med.supplierName}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Category */}
                                                    <td className="py-3 pr-4 text-gray-text">
                                                        {med.category}
                                                    </td>

                                                    {/* Unit */}
                                                    <td className="py-3 pr-4 text-gray-text">
                                                        {med.unit}
                                                    </td>

                                                    {/* Stock */}
                                                    <td className="py-3 pr-4">
                                                        <span className={`font-bold text-base ${level === "critical" ? "text-danger" :
                                                            level === "low" ? "text-warning" :
                                                                "text-primary"
                                                            }`}>
                                                            {med.stockQty}
                                                        </span>
                                                    </td>

                                                    {/* Threshold */}
                                                    <td className="py-3 pr-4 text-gray-text">
                                                        {med.alertThreshold}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openStockModal(med)}
                                                                className="btn-primary text-xs py-1 px-3"
                                                            >
                                                                + Stock
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(med)}
                                                                className="btn-outlined text-xs py-1 px-3"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeactivate(med)}
                                                                className="text-danger text-xs
                                           hover:underline transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </>
            )}

            {/*_____________________________________________________________________________________ */}
            {/* TAB  - STOCK HISTORY  */}
            {/*_____________________________________________________________________________________ */}
            {activeTab === "history" && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="card">
                    {stockLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-text">
                            <p className="text-3xl mb-3">📋</p>
                            <p className="font-medium">No stock movements yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-border">
                                        {[
                                            "Medicine", "Type", "Qty", "Reason", "By", "Date",
                                        ].map((h) => (
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
                                    {stockLogs.map((log) => {
                                        const medicine = log.medicineId as unknown as {
                                            name: string; unit: string;
                                        };
                                        const performer = log.performedby as unknown as {
                                            name: string;
                                        };

                                        return (
                                            <tr key={log._id} className="hover:bg-gray-bg">
                                                {/* Medicine */}
                                                <td className="py-3 pr-4">
                                                    <p className="font-medium text-dark">
                                                        {medicine?.name || "—"}
                                                    </p>
                                                    <p className="text-gray-text text-xs">
                                                        {medicine?.unit}
                                                    </p>
                                                </td>

                                                {/* Type */}
                                                <td className="py-3 pr-4">
                                                    <span className={`text-xs font-semibold
                                           px-2.5 py-1 rounded-full ${log.type === "in"
                                                            ? "bg-primary-light text-primary-dark"
                                                            : "bg-danger-light text-danger"
                                                        }`}>
                                                        {log.type === "in" ? "▲ IN" : "▼ OUT"}
                                                    </span>
                                                </td>

                                                {/* Qty */}
                                                <td className={`py-3 pr-4 font-bold ${log.type === "in" ? "text-primary" : "text-danger"
                                                    }`}>
                                                    {log.type === "in" ? "+" : "-"}{log.quantity}
                                                </td>

                                                {/* Reason */}
                                                <td className="py-3 pr-4">
                                                    <span className="text-xs bg-gray-bg text-gray-text
                                           px-2 py-0.5 rounded-full capitalize">
                                                        {log.reason.replace("_", " ")}
                                                    </span>
                                                </td>

                                                {/* Performed by */}
                                                <td className="py-3 pr-4 text-gray-text text-xs">
                                                    {performer?.name || "—"}
                                                </td>

                                                {/* Date */}
                                                <td className="py-3 text-gray-text text-xs">
                                                    {new Date(log.createdAt).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short", day: "numeric",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/*_____________________________________________________________________________________1 */}
            {/* ADD / EDIT MEDICINE MODAL  */}
            {/*_____________________________________________________________________________________1 */}
            {showMedicineModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center
                        justify-center z-50 px-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl w-full
                          max-w-md p-6 max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-dark text-base">
                                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
                            </h3>
                            <button
                                onClick={() => setShowMedicineModal(false)}
                                className="text-gray-text hover:text-dark text-xl"
                            >
                                ×
                            </button>
                        </div>

                        {medicineModalError && (
                            <div className="bg-danger-light text-danger text-sm
                              px-3 py-2 rounded-lg mb-4">
                                {medicineModalError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="input-label">
                                    Medicine Name
                                    <span className="text-danger ml-1 text-xs">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Paracetamol 500mg"
                                    value={medicineForm.name}
                                    onChange={(e) =>
                                        setMedicineForm({ ...medicineForm, name: e.target.value })
                                    }
                                />
                            </div>

                            {/* Category + Unit */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="input-label">
                                        Category
                                        <span className="text-danger ml-1 text-xs">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Antibiotic"
                                        value={medicineForm.category}
                                        onChange={(e) =>
                                            setMedicineForm({
                                                ...medicineForm, category: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        Unit
                                        <span className="text-danger ml-1 text-xs">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. tablets"
                                        value={medicineForm.unit}
                                        onChange={(e) =>
                                            setMedicineForm({
                                                ...medicineForm, unit: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Initial stock + alert threshold */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="input-label">
                                        Initial Stock
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        min={0}
                                        value={medicineForm.stockQty}
                                        onChange={(e) =>
                                            setMedicineForm({
                                                ...medicineForm,
                                                stockQty: parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        Alert Threshold
                                        <span className="text-danger ml-1 text-xs">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        min={1}
                                        value={medicineForm.alertThreshold}
                                        onChange={(e) =>
                                            setMedicineForm({
                                                ...medicineForm,
                                                alertThreshold: parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Supplier info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="input-label">
                                        Supplier Name
                                        <span className="text-gray-text font-normal ml-1 text-xs">
                                            (optional)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Supplier name"
                                        value={medicineForm.supplierName}
                                        onChange={(e) =>
                                            setMedicineForm({
                                                ...medicineForm, supplierName: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        Supplier Phone
                                        <span className="text-gray-text font-normal ml-1 text-xs">
                                            (optional)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="07XXXXXXXX"
                                        value={medicineForm.supplierPhone}
                                        onChange={(e) =>
                                            setMedicineForm({
                                                ...medicineForm, supplierPhone: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowMedicineModal(false)}
                                    className="btn-outlined flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveMedicine}
                                    disabled={isSavingMedicine}
                                    className="btn-primary flex-1"
                                >
                                    {isSavingMedicine
                                        ? "Saving..."
                                        : editingMedicine
                                            ? "Save Changes"
                                            : "Add Medicine"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/*_____________________________________________________________________________________1 */}
            {/* ADD STOCK MODAL  */}
            {/*_____________________________________________________________________________________1 */}
            {showStockModal && stockTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center
                        justify-center z-50 px-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-dark text-base">Add Stock</h3>
                            <button
                                onClick={() => setShowStockModal(false)}
                                className="text-gray-text hover:text-dark text-xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Medicine info */}
                        <div className="bg-gray-bg rounded-lg p-3 mb-4">
                            <p className="font-semibold text-dark text-sm">
                                {stockTarget.name}
                            </p>
                            <p className="text-gray-text text-xs mt-0.5">
                                Current stock:{" "}
                                <span className="font-bold text-dark">
                                    {stockTarget.stockQty}
                                </span>{" "}
                                {stockTarget.unit}
                            </p>
                        </div>

                        {stockModalError && (
                            <div className="bg-danger-light text-danger text-sm
                              px-3 py-2 rounded-lg mb-4">
                                {stockModalError}
                            </div>
                        )}

                        <div className="mb-5">
                            <label className="input-label">Quantity to Add</label>
                            <input
                                type="number"
                                className="input-field text-lg font-bold"
                                placeholder="e.g. 100"
                                min={1}
                                value={stockQtyInput}
                                onChange={(e) => setStockQtyInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddStock()}
                                autoFocus
                            />

                            {/* Preview new total */}
                            {stockQtyInput && parseInt(stockQtyInput) > 0 && (
                                <p className="text-gray-text text-xs mt-2">
                                    New total:{" "}
                                    <span className="font-bold text-primary text-sm">
                                        {stockTarget.stockQty + parseInt(stockQtyInput)}{" "}
                                        {stockTarget.unit}
                                    </span>
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStockModal(false)}
                                className="btn-outlined flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddStock}
                                disabled={isAddingStock || !stockQtyInput}
                                className="btn-primary flex-1"
                            >
                                {isAddingStock ? "Adding..." : "Add Stock"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}


        </div>
    )
}

export default Inventory