import { Appointment } from "../models/Appointment.model";
import { Queue } from "../models/Queue.model";
import { Settings } from "../models/Setting.model";
import { ApiError } from "../utils/ApiError";

/**
 * Queue Service
 * All queue business logic lives here - controllers stay thin
 * 
 * Key responsibilities:
 *   - Calculate estimated time per token
 *   - Check slot availability for a given date
 *   - Issue next token number for a date
 *   - Get availability booking dates for patients
 */




/**
 * calculateEstimatedTime
 * Formula: openningTime + ( token - 1 ) * avgConsulationMinutes
 * 
 * Example:
 *   openningTime = "09:00", avgMins = 20 , tokenNumber = 8
 *   = 09:00 = ( 7 * 20 ) = 09:00 + 140 minutes = 11:20 AM
 */
export const calculateEstimatedTime = (
    openningTime: string,
    tokenNumber: number,
    avgConsulationMinutes: number
): string => {
    //  Parse openning time
    const [hoursStr, minutesStr] = openningTime.split(":");
    const openningMinutes =
        parseInt(hoursStr) * 60 + parseInt(minutesStr)

    // Calculate total minutes from opening
    const totalMinutes =
        openningMinutes + (tokenNumber - 1) * avgConsulationMinutes;

    //  Convert back to HH:MM
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format as 12hr time e.g. "10:45 AM";
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    const minStr = minutes.toString().padStart(2, "0");

    return `${hours12}:${minStr} ${period}`;
};


/**
 * formatTokenCode
 * Converts a number to a formatted token string
 * e.g. 1 -> "T-001", 14 -> "T-014"
 */
export const formatedTokenCode = (num: number): string => {
    return `T-${String(num).padStart(3, "0")}`;
};


/**
 * getOrCreateTodayQueue
 * Gets today's queue document or throw if it doesn't exist
 * Queue must be explicity initialized each morning by assistant
 */
export const getTodayQueue = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queue = await Queue.findOne({ date: today });
    if (!queue) {
        throw new ApiError(
            404, "Today queue has not been initialized yet!"
        );
    }
    return queue;
}


/**
 * getAvailableDates
 * Returns dates available for booking ( today + advanceBookingDays ahead )
 * A date is unavailable if its apponitment count >= maxDailyLimit
 * 
 * Used by patient booking form to show/grey-out dates
 */
export const getAvailableDates = async (): Promise<{
    date: string,
    availableSlots: number,
    totalSlots: number
}[]> => {
    const settings = await Settings.findOne();
    if (!settings) throw new ApiError(500, "Settings not configured");

    const localDateStr = (d: Date): string => {
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0"),
        ].join("-");
    };

    const dates = []
    const today = new Date();
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i <= settings.advanceBookingDays; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        //  Count existing appointments for this date
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedCount = await Appointment.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ["cancelled"] }, // Don't count cancelled slots as taken
        });

        dates.push({
            date: localDateStr(date),
            availableSlots: Math.max(0, settings.maxDailyLimit - bookedCount),
            totalSlots: settings.maxDailyLimit
        });
    }

    return dates;
}

/**
 * issueToken
 * Core function - creates an Appointment with the next token number
 * 
 * Flow:
 *      1.Load setting for openningTime + avgConsultationMinutes
 *      2.Check date is within advanceBookingDays range
 *      3.Count existing appointments for that date
 *      4.Check slots availability
 *      5.Assign next token number (count + 1)
 *      6.Calculation estimated time
 *      7.Create Appointment document
 */
export const issueToken = async ({
    patientId,
    date,
    type,
    bookedBy,
    notes
}: {
    patientId: string;
    date: Date;
    type: "online" | "manual";
    bookedBy: string;
    notes?: string
}) => {
    const settings = await Settings.findOne();
    if (!settings) throw new ApiError(500, "Settings not configured!");

    // Normalize date to start of day for consitent comparison
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    //  Check date range - can't book beyond advanceBookingDays
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + settings.advanceBookingDays);

    if (bookingDate < today) {
        throw new ApiError(400, "Cannot book apponitments in the past")
    }
    if (bookingDate > maxDate) {
        throw new ApiError(400, `Bookings only available up to ${settings.advanceBookingDays} days in advance`)
    }

    // Check if patient already has as appointment on this date
    const existingAppointment = await Appointment.findOne({
        patientId,
        date: { $gte: bookingDate, $lte: endOfDay },
        status: { $nin: ["cancelled"] },
    });
    if (existingAppointment) {
        throw new ApiError(409, "Patient already has an appointment on this date!");
    }

    //  Count existing appointments for this date (excluding cancelled)
    const existingCount = await Appointment.countDocuments({
        date: { $gte: bookingDate, $lte: endOfDay },
        status: { $nin: ["cancelled"] },
    });

    // Check if slots are available
    if (existingCount >= settings.maxDailyLimit) {
        throw new ApiError(400, "No available slots for this date.Please choose another date")
    };

    // Next token number = existing count + 1
    const tokenNumber = existingCount + 1;
    const tokenCode = formatedTokenCode(tokenNumber);

    // Calculate estimated time
    const estimatedTime = calculateEstimatedTime(
        settings.openningTime,
        tokenNumber,
        settings.avgConsultationMinutes
    );

    // Create the appointment
    const appointment = await Appointment.create({
        patientId,
        tokenNumber,
        tokenCode,
        type,
        status: "waiting",
        date: bookingDate,
        estimatedTime,
        bookedBy,
        notes,
    });

    return appointment;
}


