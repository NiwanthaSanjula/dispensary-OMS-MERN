import api from "../axios";

export interface AISuggestion {
    name: string;
    dosage: string;
    duration: string;
    quantity: number;
    warning: string | null;
}

const aiService = {

    /**
     * Get AI patient briefing
     * Doctor clicks button -> Gemini summarises patient history
     */
    getPatientSummary: async (
        patientId: string,
        consultationId?: string
    ): Promise<string> => {
        const params = consultationId ? { consultationId } : {};
        const { data } = await api.get<{ data: { summary: string } }>(
            `/ai/summary/${patientId}`, { params }
        );
        return data.data.summary;
    },

    /**
     * Get AI prescription suggestions
     * Doctor types diagnosis -> Gemini suggests medicines from inventory
     */
    getSuggestions: async (payload: {
        diagnosis: string;
        patientAllergies: string[];
        consultationId?: string;
    }): Promise<AISuggestion[]> => {
        const { data } = await api.post<{ data: { suggestions: AISuggestion[] } }>(
            "/ai/suggest", payload
        );
        return data.data.suggestions;
    },

    /**
     * AI symptom checker
     * Patient describes symptoms → Gemini returns guidance
     * No auth required — public endpoint
     */
    checkSymptoms: async (symptoms: string): Promise<string> => {
        const { data } = await api.post<{ data: { guidance: string } }>(
            "/ai/symptom-check", { symptoms }
        );
        return data.data.guidance;
    },
};

export default aiService;