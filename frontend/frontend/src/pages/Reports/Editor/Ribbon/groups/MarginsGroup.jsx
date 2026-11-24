import { Ruler } from "lucide-react";
import RibbonGroup from "../components/RibbonGroup";
import { useLayoutContext } from "../../LayoutContext";

const PRESETS = {
    normal: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
    narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
    moderate: { top: 25.4, right: 19.05, bottom: 25.4, left: 19.05 },
    wide: { top: 25.4, right: 50.8, bottom: 25.4, left: 50.8 },
    binding: { top: 25.4, right: 25.4, bottom: 25.4, left: 31.75 },
};

const LABELS = {
    normal: "Normales · 2,54 cm",
    narrow: "Étroites · 1,27 cm",
    moderate: "Modérées · 1,91 cm côtés",
    wide: "Larges · 5,08 cm côtés",
    binding: "Reliure · marge gauche 3,18 cm",
    custom: "Personnalisées",
};

function MarginsGroup() {
    const { layout, setMargins } = useLayoutContext();
    const margins = layout?.margins || PRESETS.normal;
    const preset = margins.preset || "custom";

    const applyPreset = (key) => {
        if (key === "custom") {
            setMargins({ ...margins, preset: "custom" });
            return;
        }
        setMargins({ preset: key, ...PRESETS[key] });
    };

    const changeEdge = (edge, centimeters) => {
        const value = Number(centimeters);
        if (!Number.isFinite(value)) return;
        setMargins({
            ...margins,
            preset: "custom",
            [edge]: Math.max(0, Math.min(8, value)) * 10,
        });
    };

    return (
        <RibbonGroup title="Marges de page" className={preset === "custom" ? "w-[310px] min-w-[310px]" : "w-[220px] min-w-[220px]"}>
            <div className="flex w-full flex-col gap-1 px-1">
                <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <Ruler size={14} aria-hidden="true" />
                    <span className="sr-only">Préréglage de marges</span>
                    <select
                        value={preset}
                        onChange={(event) => applyPreset(event.target.value)}
                        className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        aria-label="Préréglage de marges"
                    >
                        {Object.entries(LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>
                {preset === "custom" && (
                    <div className="grid grid-cols-4 gap-1" aria-label="Marges personnalisées en centimètres">
                        {[
                            ["top", "Haut"],
                            ["bottom", "Bas"],
                            ["left", "Gauche"],
                            ["right", "Droite"],
                        ].map(([edge, label]) => (
                            <label key={edge} className="min-w-0 text-[9px] text-slate-500">
                                {label}
                                <input
                                    type="number"
                                    min="0"
                                    max="8"
                                    step="0.1"
                                    value={(Number(margins[edge] ?? 25.4) / 10).toFixed(1)}
                                    onChange={(event) => changeEdge(edge, event.target.value)}
                                    className="mt-0.5 h-7 w-full rounded border border-slate-300 bg-white px-1.5 text-[11px] text-slate-800 outline-none focus:border-blue-500"
                                    aria-label={`Marge ${label.toLowerCase()} en centimètres`}
                                />
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </RibbonGroup>
    );
}

export default MarginsGroup;
