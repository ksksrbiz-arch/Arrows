const STORAGE_VERSION = 'v1';

export function storageKey(name: string): string {
    return `arrows_${STORAGE_VERSION}_${name}`;
}

export function readNumber(key: string, fallback: number): number {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const value = Number(raw);
        return Number.isFinite(value) ? value : fallback;
    } catch {
        return fallback;
    }
}

export function writeNumber(key: string, value: number): void {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // localStorage may not be available.
    }
}

export function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : { ...fallback, ...JSON.parse(raw) };
    } catch {
        return fallback;
    }
}

export function writeJson<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // localStorage may not be available.
    }
}

export function removeKey(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // localStorage may not be available.
    }
}
