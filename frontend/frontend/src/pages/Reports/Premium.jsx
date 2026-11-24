import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, ShieldCheck, Crown } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function Premium() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");

  const plans = [
    {
      name: "Gratuit",
      priceMonthly: "0 €",
      priceYearly: "0 €",
      description: "Idéal pour découvrir les fonctionnalités de base de MACEVO.",
      features: [
        "10 Go de stockage cloud",
        "Génération de rapports standard",
        "Conversion Word → LaTeX basique",
        "Support communautaire"
      ],
      current: true,
      buttonText: "Offre actuelle",
      popular: false
    },
    {
      name: "MACEVO Premium",
      priceMonthly: "12 €",
      priceYearly: "9 €",
      priceSub: "par mois",
      description: "Pour les chercheurs, étudiants et professionnels exigeants.",
      features: [
        "100 Go de stockage cloud sécurisé",
        "Outils avancés de rédaction et d’export",
        "Conversion LaTeX professionnelle haute fidélité",
        "Analyses statistiques approfondies",
        "Support technique prioritaire 24/7"
      ],
      current: false,
      buttonText: "Passer à Premium",
      popular: true
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117] overflow-hidden select-none">
      {/* Barre latérale intégrée */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* En-tête de la page */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <Crown size={14} /> Offres & Abonnements
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
              Libérez tout le potentiel de MACEVO
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choisissez l'offre qui correspond le mieux à vos besoins de rédaction académique et scientifique.
            </p>

            {/* Sélecteur Mensuel / Annuel */}
            <div className="inline-flex items-center bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm mt-4">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${billingCycle === "monthly" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${billingCycle === "yearly" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
              >
                Annuel <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">-25%</span>
              </button>
            </div>
          </div>

          {/* Grille des Tarifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-[#161b22] border rounded-3xl p-8 flex flex-col justify-between shadow-sm transition ${plan.popular ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-800"}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md uppercase tracking-wider">
                    Le plus populaire
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {plan.name} {plan.popular && <Sparkles className="text-amber-500" size={18} />}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                    </span>
                    {plan.priceSub && <span className="text-xs text-slate-400">{plan.priceSub}</span>}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Ce qui est inclus :</p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    disabled={plan.current}
                    type="button"
                    onClick={() => navigate("/support")}
                    className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-sm ${plan.current ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                  >
                    {plan.current ? plan.buttonText : "Contacter l’équipe"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Badge de réassurance */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-4">
            <ShieldCheck size={16} className="text-emerald-500" /> Paiement 100% sécurisé • Annulable à tout moment en un clic.
          </div>

        </div>
      </main>
      </div>
    </div>
  );
}
