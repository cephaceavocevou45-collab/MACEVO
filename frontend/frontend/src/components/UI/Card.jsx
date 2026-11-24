export default function Card({

  children,

  className = "",

  padding = "md",

  shadow = "md",

  hover = true,

}) {

  const paddings = {

    none: "",

    sm: "p-4",

    md: "p-6",

    lg: "p-8",

  };

  const shadows = {

    none: "",

    sm: "shadow",

    md: "shadow-md",

    lg: "shadow-xl",

  };

  return (

    <div

      className={`
        bg-white
        rounded-2xl
        border
        border-gray-200
        ${paddings[padding]}
        ${shadows[shadow]}
        ${hover ? "hover:shadow-2xl transition duration-300" : ""}
        ${className}
      `}

    >

      {children}

    </div>

  );

}