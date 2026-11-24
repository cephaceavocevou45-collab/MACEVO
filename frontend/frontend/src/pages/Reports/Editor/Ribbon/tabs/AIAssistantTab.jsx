import {
  Bot,
  Sparkles,
  Wand2,
  Brain,
  Languages,
  Search,
  BookOpen,
  Lightbulb,
  FileText,
  MessageSquare,
} from "lucide-react";

import RibbonButton from "./RibbonButton";
import RibbonGroup from "./RibbonGroup";
import RibbonDivider from "./RibbonDivider";

export default function AIAssistantTab({ onAction, isLoading = false }) {
  const handleAction = (actionType) => {
    if (!isLoading && onAction) {
      onAction(actionType);
    }
  };

  return (
    <div className="flex items-stretch overflow-x-auto select-none py-1 border-b border-gray-200 bg-gray-50/50">
      {/* Génération */}
      <RibbonGroup title="Génération">
        <RibbonButton
          icon={<Bot size={22} />}
          label="Rédiger"
          disabled={isLoading}
          onClick={() => handleAction("write")}
        />
        <RibbonButton
          icon={<Sparkles size={22} />}
          label="Améliorer"
          disabled={isLoading}
          onClick={() => handleAction("enhance")}
        />
      </RibbonGroup>

      <RibbonDivider />

      {/* Analyse */}
      <RibbonGroup title="Analyse">
        <RibbonButton
          icon={<Brain size={22} />}
          label="Analyser"
          disabled={isLoading}
          onClick={() => handleAction("analyze")}
        />
        <RibbonButton
          icon={<Search size={22} />}
          label="Résumer"
          disabled={isLoading}
          onClick={() => handleAction("summarize")}
        />
      </RibbonGroup>

      <RibbonDivider />

      {/* Langues */}
      <RibbonGroup title="Langues">
        <RibbonButton
          icon={<Languages size={22} />}
          label="Traduire"
          disabled={isLoading}
          onClick={() => handleAction("translate")}
        />
        <RibbonButton
          icon={<Wand2 size={22} />}
          label="Reformuler"
          disabled={isLoading}
          onClick={() => handleAction("rephrase")}
        />
      </RibbonGroup>

      <RibbonDivider />

      {/* Recherche */}
      <RibbonGroup title="Recherche">
        <RibbonButton
          icon={<BookOpen size={22} />}
          label="Sources"
          disabled={isLoading}
          onClick={() => handleAction("sources")}
        />
        <RibbonButton
          icon={<Lightbulb size={22} />}
          label="Idées"
          disabled={isLoading}
          onClick={() => handleAction("ideas")}
        />
      </RibbonGroup>

      <RibbonDivider />

      {/* Assistant */}
      <RibbonGroup title="Assistant">
        <RibbonButton
          icon={<FileText size={22} />}
          label="Rapport"
          disabled={isLoading}
          onClick={() => handleAction("report")}
        />
        <RibbonButton
          icon={<MessageSquare size={22} />}
          label="Discussion"
          disabled={isLoading}
          onClick={() => handleAction("chat")}
        />
      </RibbonGroup>
    </div>
  );
}