/**
 * CARD COMPONENT
 * 
 * Container card riutilizzabile con varianti
 */

export default function Card({
    children,
    title,
    subtitle,
    icon,
    footer,
    variant = 'default',
    className = '',
    padding = true,
    hover = false
}) {

    const variants = {
        default: 'bg-white shadow-md',
        glass: 'bg-white/80 backdrop-blur-lg shadow-xl border border-white/20',
        gradient: 'bg-gradient-to-br from-green-50 to-blue-50 shadow-lg',
        outlined: 'bg-white border-2 border-gray-200'
    };

    const hoverEffect = hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : '';

    return (
        <div className={`rounded-lg overflow-hidden ${variants[variant]} ${hoverEffect} ${className}`}>
            {/* Header */}
            {(title || icon) && (
                <div className={`${padding ? 'p-6' : 'p-4'} border-b border-gray-100`}>
                    <div className="flex items-center gap-3">
                        {icon && <div className="text-3xl">{icon}</div>}
                        <div className="flex-1">
                            {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
                            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className={padding ? 'p-6' : 'p-0'}>
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className={`${padding ? 'px-6 py-4' : 'p-4'} bg-gray-50 border-t border-gray-100`}>
                    {footer}
                </div>
            )}
        </div>
    );
}