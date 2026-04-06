import { useEffect, useState } from 'react';
import Icon from '@/Components/Icon';

interface ToastItem {
    id: number;
    type: 'success' | 'error';
    message: string;
}

let toastId = 0;
let addToastFn: ((type: 'success' | 'error', message: string) => void) | null = null;

export function showToast(type: 'success' | 'error', message: string) {
    addToastFn?.(type, message);
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        addToastFn = (type, message) => {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, type, message }]);
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
        };
        return () => { addToastFn = null; };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-slide-in ${
                        t.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                >
                    <Icon
                        name={t.type === 'success' ? 'check-circle' : 'exclamation-triangle'}
                        className={`w-5 h-5 flex-shrink-0 ${t.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}
                    />
                    <span className="flex-1">{t.message}</span>
                    <button
                        onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                        className="ml-1 opacity-50 hover:opacity-100 transition"
                    >
                        <Icon name="x-mark" className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
