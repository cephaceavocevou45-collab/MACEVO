import {
  FileText,
  Type,
  Save,
  History,
  Languages,
} from "lucide-react";

export default function StatusBar() {

  // Valeurs temporaires
  const wordCount = 0;
  const charCount = 0;
  const version = 1;
  const language = "Français";

  return (

    <footer className="h-12 bg-white border-t px-6 flex items-center justify-between text-sm">

      {/* Informations */}

      <div className="flex items-center gap-6">

        <div className="flex items-center gap-2 text-gray-600">

          <FileText size={16} />

          <span>{wordCount} mots</span>

        </div>

        <div className="flex items-center gap-2 text-gray-600">

          <Type size={16} />

          <span>{charCount} caractères</span>

        </div>

      </div>

      {/* État */}

      <div className="flex items-center gap-6">

        <div className="flex items-center gap-2 text-green-600">

          <Save size={16} />

          <span>Sauvegardé</span>

        </div>

        <div className="flex items-center gap-2 text-gray-600">

          <History size={16} />

          <span>Version {version}</span>

        </div>

        <div className="flex items-center gap-2 text-gray-600">

          <Languages size={16} />

          <span>{language}</span>

        </div>

      </div>

    </footer>

  );

}