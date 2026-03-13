/**
 * Standard API Response wrapper
 * Every successful response in the app uses this shape:
 * { success: true, message: "...", data: {...} }
 * Keeps frontend consumption consitent and predictable
*/

export class ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;

    constructor(message: string, data: T) {
        this.success = true;
        this.message = message;
        this.data = data;
    }
}
