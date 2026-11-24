import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from "lucide-react";

const styles = {

  success: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-500",
    iconColor: "text-green-600",
    titleColor: "text-green-800",
    textColor: "text-green-700",
  },

  error: {
    icon: AlertCircle,
    bg: "bg-red-50",
    border: "border-red-500",
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    textColor: "text-red-700",
  },

  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-50",
    border: "border-yellow-500",
    iconColor: "text-yellow-600",
    titleColor: "text-yellow-800",
    textColor: "text-yellow-700",
  },

  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-500",
    iconColor: "text-blue-600",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
  },

};

export default function Toast({

  type = "success",

  title,

  message,

  onClose,

}) {

  const style = styles[type];

  const Icon = style.icon;

  return (

    <div
      className={`
        w-96
        rounded-xl
        border-l-4
        shadow-xl
        p-4
        flex
        gap-4
        items-start
        animate-in
        slide-in-from-right
        duration-300
        ${style.bg}
        ${style.border}
      `}
    >

      <Icon
        size={24}
        className={style.iconColor}
      />

      <div className="flex-1">

        <h3
          className={`font-semibold ${style.titleColor}`}
        >
          {title}
        </h3>

        <p
          className={`text-sm mt-1 ${style.textColor}`}
        >
          {message}
        </p>

      </div>

      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-700 transition"
      >

        <X size={18} />

      </button>

    </div>

  );

}