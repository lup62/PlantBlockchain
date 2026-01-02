/**
 * ALERT COMPONENT
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export default function Alert({ type = 'info', title, message, onClose, className = '' }) {

    // Configurazione stili per tipo
    const types = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            titleColor: 'text-green-900'
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: <XCircle className="w-5 h-5 text-red-600" />,
            titleColor: 'text-red-900'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
            titleColor: 'text-yellow-900'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: <Info className="w-5 h-5 text-blue-600" />,
            titleColor: 'text-blue-900'
        }
    };

    const style = types[type] || types.info;

    return (
        <div className={`
            ${style.bg} ${style.border} 
            border rounded-md 
            p-4 mb-4
            flex items-start gap-3
            ${className}
        `} role="alert">
            <div className="flex-shrink-0 mt-0.5">
                {style.icon}
            </div>

            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={`text-sm font-semibold ${style.titleColor} mb-1`}>
                        {title}
                    </h4>
                )}
                <div className={`text-sm ${style.text}`}>
                    {message}
                </div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className={`
                        flex-shrink-0 -mt-1 -mr-1 
                        p-1.5 rounded-md 
                        hover:bg-white/50 
                        transition-colors
                        ${style.text}
                    `}
                    aria-label="Chiudi"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// Toast notification component
export function Toast({ message, type = 'success', onClose }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="shadow-lg rounded-lg overflow-hidden">
                <Alert
                    type={type}
                    message={message}
                    onClose={onClose}
                    className="mb-0 border-l-4 min-w-[300px]"
                />
            </div>
        </div>
    );
}