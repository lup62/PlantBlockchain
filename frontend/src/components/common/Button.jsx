/**
 * REWRITTEN BUTTON COMPONENT
 * Style: NeonTech
 */
import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    onClick,
    disabled = false,
    className = '',
    type = 'button',
    loading = false
}) {
    // Base classes
    const base = "relative inline-flex items-center justify-center font-display font-medium tracking-wide transition-all duration-300 rounded-lg group disabled:opacity-50 disabled:cursor-not-allowed";

    // Variants
    const variants = {
        primary: "btn-primary-glow",
        secondary: "glass-panel text-white hover:bg-white/5 border-white/10 hover:border-white/20",
        outline: "btn-neon",
        ghost: "text-gray-400 hover:text-white hover:bg-white/5",
        danger: "border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500"
    };

    // Sizes
    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!loading && icon && <span className="mr-2 group-hover:translate-x-0.5 transition-transform">{icon}</span>}
            {children}

            {/* Subtle gloss effect overlay */}
            {variant === 'primary' && (
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20 pointer-events-none" />
            )}
        </button>
    );
}
