import {
    FileText,
    FileCode2,
    FileType,
    FolderOpen,
    X,
} from "lucide-react";

export default function OpenDialog({

    open,
    onClose,

    onOpenMacevo,
    onOpenWord,
    onOpenLatex,
    onOpenText,

}) {

    if (!open) return null;

    return (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl shadow-xl w-[650px]">

                {/* ===========================
                    En-tête
                ============================ */}

                <div className="flex items-center justify-between p-5 border-b">

                    <div>

                        <h2 className="text-xl font-bold">

                            Ouvrir un document

                        </h2>

                        <p className="text-sm text-gray-500">

                            Sélectionnez le type de document à ouvrir.

                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="hover:bg-gray-100 p-2 rounded-lg"
                    >
                        <X size={22} />
                    </button>

                </div>

                {/* ===========================
                    Choix
                ============================ */}

                <div className="grid grid-cols-2 gap-5 p-6">

                    {/* Projet MACEVO */}

                    <button

                        onClick={onOpenMacevo}

                        className="
                            border rounded-xl p-6
                            hover:border-blue-500
                            hover:bg-blue-50
                            transition
                        "

                    >

                        <FolderOpen
                            size={42}
                            className="text-blue-600 mb-4"
                        />

                        <h3 className="font-semibold">

                            Projet MACEVO

                        </h3>

                        <p className="text-sm text-gray-500 mt-2">

                            Continuer un projet existant.

                        </p>

                    </button>

                    {/* Word */}

                    <button

                        onClick={onOpenWord}

                        className="
                            border rounded-xl p-6
                            hover:border-blue-500
                            hover:bg-blue-50
                            transition
                        "

                    >

                        <FileText
                            size={42}
                            className="text-blue-600 mb-4"
                        />

                        <h3 className="font-semibold">

                            Microsoft Word

                        </h3>

                        <p className="text-sm text-gray-500 mt-2">

                            Importer un fichier DOCX.

                        </p>

                    </button>

                    {/* LaTeX */}

                    <button

                        onClick={onOpenLatex}

                        className="
                            border rounded-xl p-6
                            hover:border-blue-500
                            hover:bg-blue-50
                            transition
                        "

                    >

                        <FileCode2
                            size={42}
                            className="text-green-600 mb-4"
                        />

                        <h3 className="font-semibold">

                            Document LaTeX

                        </h3>

                        <p className="text-sm text-gray-500 mt-2">

                            Importer un fichier TEX.

                        </p>

                    </button>

                    {/* Texte */}

                    <button

                        onClick={onOpenText}

                        className="
                            border rounded-xl p-6
                            hover:border-blue-500
                            hover:bg-blue-50
                            transition
                        "

                    >

                        <FileType
                            size={42}
                            className="text-purple-600 mb-4"
                        />

                        <h3 className="font-semibold">

                            Texte

                        </h3>

                        <p className="text-sm text-gray-500 mt-2">

                            Importer un fichier TXT.

                        </p>

                    </button>

                </div>

            </div>

        </div>

    );

}