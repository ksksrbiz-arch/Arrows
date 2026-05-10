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
        if (!fallback) return fallback;

        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;

        const parsed = JSON.parse(raw);
        if (
            !parsed || typeof parsed !== 'object' || Array.isArray(parsed)
            || !fallback || typeof fallback !== 'object' || Array.isArray(fallback)
        ) {
            return fallback;
        }

        const parsedRecord = parsed as Record<string, unknown>;
        const result = { ...fallback } as Record<string, unknown>;
        for (const key of Object.keys(fallback)) {
            if (key in parsedRecord) {
                result[key] = parsedRecord[key];
            }
        }

        return result as T;
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
