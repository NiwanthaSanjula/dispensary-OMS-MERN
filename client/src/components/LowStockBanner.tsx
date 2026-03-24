import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import medicineService from "../api/services/medicine.service";
import type { IMedicine } from "../types/medicine.types";

/**
 * Low Stock Banner
 * Appears on both doctor and assistant dashboards
 * Shows when any medicine is at or below alert threshold
 * Links to inventory page
 */
const LowStockBanner = () => {
    const navigate = useNavigate();
    const [lowStockMeds, setLowStockMeds] = useState<IMedicine[]>([]);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await medicineService.getLowStock();
                setLowStockMeds(data);
            } catch {/* silent */ }
        };
        fetch();
    }, []);

    if (isDismissed || lowStockMeds.length === 0) return null;

    const criticalCount = lowStockMeds.filter(
        (m) => m.stockQty <= m.alertThreshold / 2
    ).length;

    return (
        <div className={`flex items-center justify-between px-4 py-3
                     rounded-lg mb-5 text-sm ${criticalCount > 0
                ? "bg-danger-light text-danger"
                : "bg-orange-50 text-warning"
            }`}>
            <div className="flex items-center gap-2">
                <span>{criticalCount > 0 ? "🔴" : "⚠️"}</span>
                <span className="font-medium">
                    {lowStockMeds.length} medicine
                    {lowStockMeds.length !== 1 ? "s" : ""} running low
                    {criticalCount > 0 && ` (${criticalCount} critical)`}
                    {" — "}
                    <span className="font-normal">
                        {lowStockMeds.slice(0, 2).map((m) => m.name).join(", ")}
                        {lowStockMeds.length > 2 && ` +${lowStockMeds.length - 2} more`}
                    </span>
                </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={() => navigate("/management/inventory")}
                    className="font-semibold underline underline-offset-2 text-xs"
                >
                    View Inventory →
                </button>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="opacity-60 hover:opacity-100 text-lg leading-none"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default LowStockBanner;