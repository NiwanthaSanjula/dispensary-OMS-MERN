import { useState, useEffect } from "react";

/**
 * useDebounce
 * Delays updating a value until the user stops typing
 * Prevents API call on every single keystroke
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchInput, 400);
 *   useEffect(() => { fetchData(debouncedSearch) }, [debouncedSearch]);
 */
const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup — cancel timer if value changes before delay
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

export default useDebounce;