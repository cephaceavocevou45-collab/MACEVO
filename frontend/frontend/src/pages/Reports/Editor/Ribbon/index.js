/**
 * ============================================================
 * MACEVO - Ribbon
 * ------------------------------------------------------------
 * Point d'entrée officiel du Ribbon.
 * Tous les composants du ruban sont exportés ici.
 * ============================================================
 */

/* ============================================================
 * Conteneur principal
 * ============================================================
 */

export { default as Ribbon } from "./Ribbon";

/* ============================================================
 * Contexte
 * ============================================================
 */

export {
  RibbonProvider,
  useRibbon,
} from "./RibbonContext";

/* ============================================================
 * Structure
 * ============================================================
 */

export { default as RibbonTabs } from "./RibbonTabs";
export { default as RibbonGroup } from "./RibbonGroup";
export { default as RibbonButton } from "./RibbonButton";
export { default as RibbonDivider } from "./RibbonDivider";

/* ============================================================
 * Onglets
 * ============================================================
 */

export { default as HomeTab } from "./HomeTab";
export { default as InsertTab } from "./InsertTab";
export { default as ReferencesTab } from "./ReferencesTab";
export { default as LayoutTab } from "./LayoutTab";
export { default as ReviewTab } from "./ReviewTab";
export { default as ExportTab } from "./ExportTab";
export { default as AIAssistantTab } from "./AIAssistantTab";
export { default as LatexTab } from "./LatexTab";
