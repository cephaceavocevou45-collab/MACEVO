export default function Button({

  children,

  onClick,

  type = "button",

  variant = "primary",

  size = "md",

  disabled = false,

  icon,

  className = "",

}) {

  const variants = {

    primary:
      "bg-blue-600 hover:bg-blue-700 text-white",

    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800",

    success:
      "bg-green-600 hover:bg-green-700 text-white",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",

    warning:
      "bg-yellow-500 hover:bg-yellow-600 text-white",

    outline:
      "border border-blue-600 text-blue-600 hover:bg-blue-50",

  };

  const sizes = {

    sm: "px-3 py-2 text-sm",

    md: "px-5 py-2.5",

    lg: "px-6 py-3 text-lg",

  };

  return (

    <button

      type={type}

      disabled={disabled}

      onClick={onClick}

      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}

    >

      {icon}

      {children}

    </button>

  );

}