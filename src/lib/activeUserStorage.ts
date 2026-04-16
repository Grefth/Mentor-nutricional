const ACTIVE_PHONE_KEY = 'mentor-nutricional:activePhone';

export function readActivePhone(): string | null {
    try {
        const v = localStorage.getItem(ACTIVE_PHONE_KEY);
        return v?.trim() ? v.trim() : null;
    } catch {
        return null;
    }
}

export function writeActivePhone(phone: string): void {
    try {
        localStorage.setItem(ACTIVE_PHONE_KEY, phone.trim());
    } catch {
        /* ignore quota / private mode */
    }
}
