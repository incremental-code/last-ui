import { createElement, signal, computed } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface AvatarProps {
    /** Image URL. If undefined or fails to load, falls back to initials. */
    src?: string;
    /** Display name; used to derive initials. */
    name: string;
    /** Optional alt for the image; defaults to name. */
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Optional background color override for the initials state. */
    color?: string;
    /** Optional shape: 'circle' (default) | 'square' */
    shape?: 'circle' | 'square';
}

const SIZE_PX = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 } as const;

function initialsFor(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/** Deterministic hue from name via simple djb2-style hash. */
function hashHue(name: string): number {
    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) + hash + name.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 360;
}

function colorFor(name: string): string {
    return `hsl(${hashHue(name)}, 55%, 45%)`;
}

export function Avatar({ src, name, alt, size = 'md', color, shape = 'circle' }: AvatarProps) {
    const px = SIZE_PX[size];
    const radius = shape === 'circle' ? '50%' : tokens.radius.md;
    const fontSize = Math.round(px * 0.42);
    const bg = color ?? colorFor(name);
    const imgFailed = signal(false);

    const content = computed(() => {
        if (src && !imgFailed.get()) {
            return createElement('img', {
                src,
                alt: alt ?? name,
                onerror: () => imgFailed.set(true),
                attributes: {
                    style: css({
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }),
                },
            });
        }
        return createElement('span', {
            attributes: {
                'aria-hidden': 'true',
                style: css({
                    fontFamily: tokens.font.family,
                    fontSize: `${fontSize}px`,
                    fontWeight: '600',
                    color: '#ffffff',
                    lineHeight: '1',
                }),
            },
        }, initialsFor(name));
    });

    return createElement('span', {
        attributes: {
            role: 'img',
            'aria-label': alt ?? name,
            style: css({
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${px}px`,
                height: `${px}px`,
                background: bg,
                borderRadius: radius,
                overflow: 'hidden',
                flex: '0 0 auto',
                verticalAlign: 'middle',
            }),
        },
    }, content);
}
