export type StyleMap = Record<string, string | number | undefined | null>;

const KEBAB = /[A-Z]/g;

export function css(...maps: (StyleMap | string | false | null | undefined)[]): string {
    const parts: string[] = [];
    for (const map of maps) {
        if (!map) continue;
        if (typeof map === 'string') {
            parts.push(map.trim().replace(/;?$/, ''));
            continue;
        }
        for (const [key, value] of Object.entries(map)) {
            if (value === undefined || value === null || value === '') continue;
            parts.push(`${toKebab(key)}: ${value}`);
        }
    }
    return parts.join('; ');
}

function toKebab(key: string): string {
    return key.replace(KEBAB, m => '-' + m.toLowerCase());
}
