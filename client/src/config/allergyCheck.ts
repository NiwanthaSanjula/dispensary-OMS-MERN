/**
 * Allergy Guard — runs entirely on the frontend
 * Zero API calls — pure logic
 *
 * Cross-checks selected medicine names against patient's known allergies
 * Returns array of conflicting medicine names
 *
 * Used in PrescriptionBuilder before allowing submission
 * If conflicts found → AllergyWarning modal blocks completion
 */

export const checkAllergyConflict = (
    selectedMedicineNames: string[],
    patientAllergies: string[]
): string[] => {
    if (!patientAllergies || patientAllergies.length === 0) return [];

    return selectedMedicineNames.filter((med) =>
        patientAllergies.some(
            (allergy) =>
                med.toLowerCase().includes(allergy.toLowerCase()) ||
                allergy.toLowerCase().includes(med.toLowerCase())
        )
    );
};