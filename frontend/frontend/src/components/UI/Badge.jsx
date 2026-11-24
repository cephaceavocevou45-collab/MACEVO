export default function Badge({

  children,

  color = "blue",

  size = "md",

}) {

  const colors = {

    blue: "bg-blue-100 text-blue-700",

    green: "bg-green-100 text-green-700",

    red: "bg-red-100 text-red-700",

    yellow: "bg-yellow-100 text-yellow-700",

    purple: "bg-purple-100 text-purple-700",

    gray: "bg-gray-100 text-gray-700",

    orange: "bg-orange-100 text-orange-700",

    pink: "bg-pink-100 text-pink-700",

    indigo: "bg-indigo-100 text-indigo-700",

  };

  const sizes = {

    sm: "px-2 py-1 text-xs",

    md: "px-3 py-1 text-sm",

    lg: "px-4 py-2 text-base",

  };

  return (

    <span

      className={`
        inline-flex
        items-center
        rounded-full
        font-semibold
        ${colors[color]}
        ${sizes[size]}
      `}

    >

      {children}

    </span>

  );

}
