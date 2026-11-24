/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonButton.jsx
 * Version  : 5.0.0
 * Statut  : Ruban Word
 * ==========================================================
 */

function RibbonButton({
    icon: Icon,
    label,
    tooltip,
    active = false,
    disabled = false,
    size = "normal",
    onMouseDown,
    onClick,
}) {

    const isSmall = size === "small";

    const handleMouseDown = (event) => {
        if (disabled) {
            event.preventDefault();
            return;
        }

        onMouseDown?.(event);
    };

    const handleClick = (event) => {
        if (disabled) {
            return;
        }

        onClick?.(event);
    };

    return (
        <button
            type="button"
            title={tooltip || label}
            aria-label={tooltip || label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            className={`
                group
                relative
                flex
                min-w-0
                shrink-0
                items-center
                justify-center
                rounded-[3px]
                border
                select-none
                transition-colors
                duration-100
                focus:outline-none
                focus-visible:ring-1
                focus-visible:ring-blue-500

                ${
                    isSmall
                        ? "h-[30px] gap-1 px-1.5"
                        : "h-[58px] w-auto min-w-[48px] flex-col gap-1 px-1.5"
                }

                ${
                    disabled
                        ? `
                            cursor-not-allowed
                            border-transparent
                            bg-transparent
                            text-slate-400
                            opacity-50
                        `
                        : active
                            ? `
                                cursor-pointer
                                border-blue-300
                                bg-blue-100
                                text-blue-700
                            `
                            : `
                                cursor-pointer
                                border-transparent
                                bg-transparent
                                text-slate-700
                                hover:border-slate-200
                                hover:bg-slate-100
                            `
                }
            `}
        >

            {Icon && (
                <Icon
                    size={isSmall ? 16 : 20}
                    strokeWidth={1.8}
                    className="shrink-0"
                />
            )}

            {label && (
                <span
                    className={`
                        max-w-full
                        truncate
                        text-center
                        font-medium

                        ${
                            isSmall
                                ? "text-[9px] leading-none"
                                : "text-[10px] leading-tight"
                        }
                    `}
                >
                    {label}
                </span>
            )}

        </button>
    );
}

export default RibbonButton;