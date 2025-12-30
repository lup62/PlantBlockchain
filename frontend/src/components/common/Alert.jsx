/**
 * ALERT COMPONENT
 * 
 * Alert/Notification box
 */

import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export default function Alert({
    type = 'info',
    title,
    message,
    onClose,
    className = ''
}) {

    const types = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: <CheckCircle className="w-5 h-5" />
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: <XCircle className="w-5 h-5" />
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: <AlertCircle className="w-5 h-5" />
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: <Info className="w-5 h-5" />
        }
    };

    const style = types[type];

    return (
        <div
            className={`
        ${style.bg} ${style.border} ${style.text}
        border-l-4 p-4 rounded-lg flex items-start gap-3
        ${className}
      `}
        >
            <div className="flex-shrink-0 mt-0.5">
                {style.icon}
            </div>

            <div className="flex-1">
                {title && <h4 className="font-semibold mb-1">{title}</h4>}
                {message && <p className="text-sm">{message}</p>}
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 hover:opacity-70 transition-opacity"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// Toast notification (floating)
export function Toast({ type = 'info', message, onClose, duration = 5000 }) {

    // Auto close dopo duration
    useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const types = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };

    return (
        <div
            className={`
        ${types[type]} text-white
        px-6 py-4 rounded-lg shadow-xl
        flex items-center gap-3
        animate-in slide-in-from-top-4 duration-300
      `}
        >
            <p className="flex-1 font-medium">{message}</p>
            {onClose && (
                <button onClick={onClose} className="hover:opacity-70">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}