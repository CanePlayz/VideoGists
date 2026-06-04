import { useEffect, type ReactNode } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

export function Modal({ open, onClose, children }: Props) {
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
