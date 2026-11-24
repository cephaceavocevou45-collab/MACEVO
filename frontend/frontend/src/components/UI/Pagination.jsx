import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Pagination({

  currentPage,

  totalPages,

  onPageChange,

}) {

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {

    pages.push(i);

  }

  return (

    <div className="flex items-center justify-center gap-2 mt-8">

      {/* Bouton précédent */}

      <button

        onClick={() =>
          onPageChange(currentPage - 1)
        }

        disabled={currentPage === 1}

        className="
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-lg
          border
          bg-white
          hover:bg-gray-100
          disabled:opacity-40
          disabled:cursor-not-allowed
          transition
        "

      >

        <ChevronLeft size={18} />

      </button>

      {/* Numéros */}

      {pages.map((page) => (

        <button

          key={page}

          onClick={() => onPageChange(page)}

          className={`
            w-10
            h-10
            rounded-lg
            transition

            ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-white border hover:bg-gray-100"
            }
          `}

        >

          {page}

        </button>

      ))}

      {/* Bouton suivant */}

      <button

        onClick={() =>
          onPageChange(currentPage + 1)
        }

        disabled={currentPage === totalPages}

        className="
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-lg
          border
          bg-white
          hover:bg-gray-100
          disabled:opacity-40
          disabled:cursor-not-allowed
          transition
        "

      >

        <ChevronRight size={18} />

      </button>

    </div>

  );

}