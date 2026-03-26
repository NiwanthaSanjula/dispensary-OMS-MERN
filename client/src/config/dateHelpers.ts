/**
 * Get today's date as YYYY-MM-DD in local timezone
 * Never use toISOString() for the date comparision - it returns UTC
 * which causes off-by-one day error in UTC+5:30 and similar timezones
 */
export const getTodayLocal = (): string => {
    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
};


/**
 * Convert any date to YYYY-MM-DD in Local timezone
 */
export const toLocalDateString = (date: Date | string): string => {
    const d = new Date(date);
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");

}