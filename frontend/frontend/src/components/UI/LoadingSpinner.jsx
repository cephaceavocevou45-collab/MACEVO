import { Loader2 } from "lucide-react";

export default function LoadingSpinner({

  size = 40,

  text = "Chargement...",

  fullScreen = false,

}) {

  const content = (

    <div className="flex flex-col items-center justify-center gap-4">

      <Loader2
        size={size}
        className="animate-spin text-blue-600"
      />

      <p className="text-gray-500 text-sm">

        {text}

      </p>

    </div>

  );

  if (fullScreen) {

    return (

      <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">

        {content}

      </div>

    );

  }

  return (

    <div className="py-10 flex items-center justify-center">

      {content}

    </div>

  );

}