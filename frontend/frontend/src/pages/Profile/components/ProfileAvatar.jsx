import { useRef, useState } from "react";
import { Camera, User } from "lucide-react";

export default function ProfileAvatar() {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  function handleClick() {
    inputRef.current.click();
  }

  function handleChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-md p-8 flex flex-col items-center transition-colors duration-200">
      {/* Avatar */}
      <div className="relative">
        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center transition-colors duration-200">
          {preview ? (
            <img
              src={preview}
              alt="Profil"
              className="w-full h-full object-cover"
            />
          ) : (
            <User
              size={70}
              className="text-gray-400 dark:text-slate-500 transition-colors"
            />
          )}
        </div>

        <button
          onClick={handleClick}
          className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-md"
        >
          <Camera size={18} />
        </button>
      </div>

      {/* Bouton */}
      <button
        onClick={handleClick}
        className="mt-6 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
      >
        Modifier la photo
      </button>

      {/* Input caché */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}