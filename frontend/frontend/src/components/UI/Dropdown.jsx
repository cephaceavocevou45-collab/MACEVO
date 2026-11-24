import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({

  isOpen,

  onClose,

  title,

  children,

  size = "md",

}) {

  useEffect(() => {

    const handleEscape = (event) => {

      if (event.key === "Escape") {

        onClose();

      }

    };

    if (isOpen) {

      document.addEventListener(
        "keydown",
        handleEscape
      );

    }

    return () => {

      document.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {

    sm: "max-w-md",

    md: "max-w-xl",

    lg: "max-w-3xl",

    xl: "max-w-5xl",

    full: "max-w-7xl",

  };

  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"

      onClick={onClose}

    >

      <div

        onClick={(e) => e.stopPropagation()}

        className={`bg-white rounded-2xl shadow-2xl w-full mx-4 ${sizes[size]}`}

      >

        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-xl font-bold">

            {title}

          </h2>

          <button

            onClick={onClose}

            className="p-2 rounded-lg hover:bg-gray-100"

          >

            <X size={20} />

          </button>

        </div>

        {/* Body */}

        <div className="p-6">

          {children}

        </div>

      </div>

    </div>

  );

}