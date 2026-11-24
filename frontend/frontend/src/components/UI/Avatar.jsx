import { User } from "lucide-react";

export default function Avatar({

  src,

  alt = "Utilisateur",

  name = "",

  size = "md",

  online = false,

}) {

  const sizes = {

    xs: "w-8 h-8 text-xs",

    sm: "w-10 h-10 text-sm",

    md: "w-12 h-12 text-base",

    lg: "w-16 h-16 text-lg",

    xl: "w-20 h-20 text-xl",

  };

  const initials =

    name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "";

  return (

    <div className="relative inline-block">

      {src ? (

        <img

          src={src}

          alt={alt}

          className={`
            rounded-full
            object-cover
            border-2
            border-white
            shadow
            ${sizes[size]}
          `}

        />

      ) : (

        <div

          className={`
            rounded-full
            bg-blue-600
            text-white
            font-semibold
            flex
            items-center
            justify-center
            border-2
            border-white
            shadow
            ${sizes[size]}
          `}

        >

          {initials || <User size={18} />}

        </div>

      )}

      {online && (

        <span

          className="
            absolute
            bottom-0
            right-0
            w-3.5
            h-3.5
            bg-green-500
            border-2
            border-white
            rounded-full
          "

        />

      )}

    </div>

  );

}