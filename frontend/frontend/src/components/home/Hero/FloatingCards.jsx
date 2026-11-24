import { motion } from "framer-motion";
import {
  FileCode2,
  FileText,
  FileDown,
  FileArchive,
} from "lucide-react";

const cards = [
  {
    id: 1,
    title: "LaTeX",
    icon: FileCode2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    position: "-top-8 left-0",
    duration: 5,
  },
  {
    id: 2,
    title: "PDF",
    icon: FileDown,
    color: "text-red-500",
    bg: "bg-red-50",
    position: "top-6 -right-10",
    duration: 6,
  },
  {
    id: 3,
    title: "Word",
    icon: FileText,
    color: "text-blue-700",
    bg: "bg-blue-100",
    position: "bottom-6 -left-10",
    duration: 7,
  },
  {
    id: 4,
    title: "ZIP",
    icon: FileArchive,
    color: "text-purple-600",
    bg: "bg-purple-100",
    position: "-bottom-8 right-2",
    duration: 5.5,
  },
];

export default function FloatingCards() {
  return (
    <>
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.id}
            className={`absolute ${card.position} flex items-center gap-3 rounded-2xl ${card.bg} px-4 py-3 shadow-xl backdrop-blur-md border border-white/60`}
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: card.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{
              scale: 1.08,
              rotate: 2,
            }}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow ${card.color}`}
            >
              <Icon size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-800">
                {card.title}
              </p>

              <p className="text-xs text-gray-500">
                Disponible
              </p>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}
