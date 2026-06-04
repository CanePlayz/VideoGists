import type { ReactNode } from "react";

export type ViewMode = "comfortable" | "compact" | "list";

interface Props {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
}

const OPTIONS: { mode: ViewMode; label: string; icon: ReactNode }[] = [
    {
        mode: "comfortable",
        label: "Komfortabel",
        icon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="2" y="2.5" width="12" height="4.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
                <rect x="2" y="9" width="12" height="4.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
            </svg>
        ),
    },
    {
        mode: "compact",
        label: "Kompakt",
        icon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="2" y="2.5" width="12" height="2.6" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <rect x="2" y="6.7" width="12" height="2.6" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <rect x="2" y="10.9" width="12" height="2.6" rx="1" stroke="currentColor" strokeWidth="1.3" />
            </svg>
        ),
    },
    {
        mode: "list",
        label: "Liste",
        icon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="3" cy="4" r="1" fill="currentColor" />
                <circle cx="3" cy="8" r="1" fill="currentColor" />
                <circle cx="3" cy="12" r="1" fill="currentColor" />
                <line x1="6" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
        ),
    },
];

export function ViewSwitcher({ value, onChange }: Props) {
    return (
        <div className="view-switcher" role="group" aria-label="Ansicht">
            {OPTIONS.map((o) => (
                <button
                    key={o.mode}
                    type="button"
                    className={"view-btn" + (value === o.mode ? " active" : "")}
                    aria-pressed={value === o.mode}
                    title={o.label}
                    aria-label={o.label}
                    onClick={() => onChange(o.mode)}
                >
                    {o.icon}
                </button>
            ))}
        </div>
    );
}
