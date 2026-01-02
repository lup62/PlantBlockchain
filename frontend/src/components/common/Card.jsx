/**
 * REWRITTEN CARD COMPONENT
 * Style: GlassBento
 */

export default function Card({
    children,
    title,
    subtitle,
    icon, // Lucide icon component
    className = '',
    noPadding = false,
    spotlight = false // Upcoming feature: mouse spotlight
}) {
    return (
        <div className={`glass-card rounded-2xl overflow-hidden flex flex-col h-full ${className}`}>

            {/* Header Optional */}
            {(title || icon) && (
                <div className="px-6 pt-6 pb-2 flex items-start justify-between">
                    <div>
                        {title && (
                            <h3 className="text-xl font-bold text-white font-display tracking-tight">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-gray-400 mt-1 font-light">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {icon && (
                        <div className="p-2 rounded-lg bg-white/5 text-neon-green border border-white/5 shadow-inner">
                            {icon}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={`flex-1 ${noPadding ? '' : 'p-6'}`}>
                {children}
            </div>
        </div>
    );
}
