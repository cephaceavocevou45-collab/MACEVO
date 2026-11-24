import {
  Info,
  Globe,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

export default function AboutSection() {

  return (

    <div>

      <div className="flex items-center gap-3 mb-2">

        <Info size={28} />

        <h2 className="text-2xl font-bold">
          À propos de MACEVO
        </h2>

      </div>

      <p className="text-gray-500 mb-8">
        Informations sur votre plateforme de rédaction académique intelligente.
      </p>

      <div className="space-y-5">

        <div className="border rounded-2xl p-5">

          <h3 className="font-semibold mb-2">
            Nom du logiciel
          </h3>

          <p>MACEVO</p>

        </div>

        <div className="border rounded-2xl p-5">

          <h3 className="font-semibold mb-2">
            Version
          </h3>

          <p>4.0.0 Professional</p>

        </div>

        <div className="border rounded-2xl p-5 flex items-center gap-3">

          <ShieldCheck size={22} />

          <div>

            <h3 className="font-semibold">
              Licence
            </h3>

            <p className="text-gray-500">
              Licence officielle MACEVO.
            </p>

          </div>

        </div>

        <div className="border rounded-2xl p-5 flex items-center gap-3">

          <BookOpen size={22} />

          <div>

            <h3 className="font-semibold">
              Description
            </h3>

            <p className="text-gray-500">
              Plateforme intelligente dédiée à la rédaction académique,
              scientifique et professionnelle avec assistance IA.
            </p>

          </div>

        </div>

        <div className="border rounded-2xl p-5 flex items-center gap-3">

          <Globe size={22} />

          <div>

            <h3 className="font-semibold">
              Site officiel
            </h3>

            <p className="text-blue-600">
              https://macevo.ai
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}