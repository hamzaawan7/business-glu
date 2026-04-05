import { ReactNode } from 'react';

interface PhonePreviewProps {
    title: string;
    backLabel?: string;
    activeNavIndex?: number;
    children: ReactNode;
    width?: number;
    height?: number;
}

export default function PhonePreview({
    title,
    backLabel = 'Back',
    activeNavIndex = 2,
    children,
    width = 280,
    height = 560,
}: PhonePreviewProps) {
    const navItems = [
        { icon: 'home', label: 'Home' },
        { icon: 'calendar', label: 'Schedule' },
        { icon: 'chat-bubble-left', label: 'Chat' },
        { icon: 'academic-cap', label: 'Learn' },
        { icon: 'user', label: 'Profile' },
    ];

    return (
        <div
            className="bg-slate-900 rounded-[2.5rem] p-3 shadow-xl flex-shrink-0"
            style={{ width, height }}
        >
            <div className="bg-white rounded-[2rem] h-full flex flex-col overflow-hidden relative">
                {/* Notch */}
                <div className="flex justify-center pt-2">
                    <div className="w-20 h-5 bg-slate-900 rounded-full" />
                </div>

                {/* Status Bar */}
                <div className="flex justify-between items-center px-6 py-1 text-[9px] text-slate-500 font-medium">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1.293 8.395C5.538 4.15 12 2.25 12 2.25s6.462 1.9 10.707 6.145a1 1 0 01-1.414 1.414C17.831 6.348 12 4.75 12 4.75S6.169 6.348 2.707 9.81A1 1 0 011.293 8.395z" />
                            <path d="M5.636 12.736C8.172 10.2 12 9 12 9s3.828 1.2 6.364 3.736a1 1 0 01-1.414 1.414C14.586 11.786 12 11 12 11s-2.586.786-4.95 3.15a1 1 0 01-1.414-1.414z" />
                            <circle cx="12" cy="18" r="2" />
                        </svg>
                        <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 28 14">
                            <rect x="0" y="0" width="24" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <rect x="2" y="2" width="18" height="10" rx="1.5" />
                            <rect x="25" y="4" width="3" height="6" rx="1" />
                        </svg>
                    </div>
                </div>

                {/* App Header */}
                <div className="px-4 py-2 border-b border-slate-100" style={{ backgroundColor: '#495B67' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-white/80 text-[10px]">← {backLabel}</span>
                    </div>
                    <h3 className="text-white font-semibold text-xs mt-0.5 truncate">{title}</h3>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-3 py-3 text-[11px] leading-relaxed">
                    {children}
                </div>

                {/* Bottom Nav */}
                <div className="border-t border-slate-100 px-2 py-1.5">
                    <div className="flex justify-around">
                        {navItems.map((item, idx) => (
                            <div
                                key={item.label}
                                className={`flex flex-col items-center gap-0.5 ${
                                    idx === activeNavIndex ? 'text-[#495B67]' : 'text-slate-300'
                                }`}
                            >
                                <div className="w-4 h-4 rounded-full bg-current opacity-30" />
                                <span className="text-[7px] font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Home Indicator */}
                <div className="flex justify-center pb-2">
                    <div className="w-24 h-1 bg-slate-200 rounded-full" />
                </div>
            </div>
        </div>
    );
}
