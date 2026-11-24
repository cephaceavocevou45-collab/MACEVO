import React, { useCallback, useEffect, useMemo, useState } from "react";

import {

 AlertCircle,

 ArrowLeft,

 BookOpen,

 Calendar,

 Check,

 ChevronRight,

 FileCheck2,

 FileSearch,

 FileText,

 GraduationCap,

 Globe2,

 Info,

 Library,

 Loader2,

 LockKeyhole,

 Plus,

 Search,

 Send,

 ShieldCheck,

 UploadCloud,

 User,

 X,

} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../api/axios";

import depotScientifiqueService from "../../services/depotScientifiqueService";

import Sidebar from "../../components/Sidebar";

import Navbar from "../../components/Navbar";

const DOCUMENT_TYPES = [

 { value: "RAP", label: "Rapport scientifique" },

 { value: "MEM", label: "Mémoire" },

 { value: "THE", label: "Thèse" },

 { value: "ART", label: "Article scientifique" },

 { value: "PFE", label: "Projet / PFE" },

 { value: "COU", label: "Cours" },

 { value: "DOC", label: "Document scientifique" },

 { value: "AUT", label: "Autre" },

];

const TYPE_LABELS = DOCUMENT_TYPES.reduce((acc, item) => {

 acc[item.value] = item.label;

 return acc;

}, {});

const STATUS_LABELS = {

 draft: "Brouillon",

 pending: "En attente",

 published: "Publié",

 withdrawn: "Retiré",

};

function normalizeList(data) {

    if (Array.isArray(data)) {

        return data;

    }

    if (Array.isArray(data?.results)) {

        return data.results;

    }

    if (Array.isArray(data?.data)) {

        return data.data;

    }

    if (Array.isArray(data?.reports)) {

        return data.reports;

    }

    if (Array.isArray(data?.deposits)) {

        return data.deposits;

    }

    return [];

}

function getTypeLabel(type) {

    return TYPE_LABELS[type] || type || "Document scientifique";

}

function getStatusLabel(status) {

    return STATUS_LABELS[status] || status || "Statut inconnu";

}

function getDocumentTitle(document) {

    return (

     document?.title ||

     document?.report_title ||

     document?.report?.title ||

     "Document sans titre"

    );

}

function getDocumentId(document) {

    return (

     document?.public_id ||

     document?.macevo_id ||

     document?.publicId ||

     ""

    );

}

function getAuthorName(document) {

    return (

     document?.author_username ||

     document?.author_name ||

     document?.author ||

     "Auteur non renseigné"

    );

}

function getField(document) {

    return (

     document?.scientific_field ||

     document?.field ||

     "Domaine non renseigné"

    );

}

function getInstitution(document) {

    return (

     document?.institution ||

     document?.university ||

     "Institution non renseignée"

    );

}

function getSummary(document) {

    return (

     document?.summary ||

     document?.abstract ||

     document?.description ||

     "Aucun résumé disponible."

    );

}

function formatDate(value) {

    if (!value) {

        return "Date non disponible";

    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {

        return "Date non disponible";

    }

    return new Intl.DateTimeFormat("fr-FR", {

        day: "2-digit",

        month: "long",

        year: "numeric",

    }).format(date);

}

function getEditorPath(document) {

    const reportId =

        document?.report_id ||

        document?.report?.id ||

        document?.reportId ||

        document?.id;

    return reportId ? `/rapports/editeur/${reportId}` : null;

}

function getReportId(report) {

    return report?.id || report?.report_id || report?.reportId || null;

}

function ReportSelectorCard({ report, selected, onSelect }) {

    const reportId = getReportId(report);

    return (

     <button

      type="button"

      className={`macevo-depot-report-selector ${

         selected ? "is-selected" : ""

      }`}

      onClick={() => onSelect(report)}

     >

      <span className="macevo-depot-report-selector-icon">

         {selected ? <Check size={21} /> : <FileText size={21} />}

      </span>

      <span className="macevo-depot-report-selector-content">

         <strong>{report?.title || "Rapport sans titre"}</strong>

         <span>

          {report?.scientific_field ||

            report?.report_type ||

            "Document scientifique"}

         </span>

         {report?.academic_level && (

          <span>{report.academic_level}</span>

         )}

         {reportId && (

          <span className="macevo-depot-report-internal-id">

              Rapport #{reportId}

          </span>

         )}

         </span>

         <ChevronRight size={18} />

     </button>

    );

}

function PublicDocumentCard({ document, onOpen }) {

    const title = getDocumentTitle(document);

    const publicId = getDocumentId(document);

    const editorPath = getEditorPath(document);

    return (

     <article className="macevo-depot-public-card">

         <div className="macevo-depot-public-card-top">

         <div className="macevo-depot-public-icon">

          <FileText size={22} />

         </div>

<span className="macevo-depot-type-badge">

 {getTypeLabel(document?.document_type)}

</span>

</div>

<div className="macevo-depot-public-card-body">

<h3>{title}</h3>

{publicId && (

 <div className="macevo-depot-public-id">

     <span>ID MACEVO</span>

     <strong>{publicId}</strong>

 </div>

)}

<p>{getSummary(document)}</p>

<div className="macevo-depot-public-meta">

 <span>

     <User size={14} />

     {getAuthorName(document)}

 </span>

 <span>

     <BookOpen size={14} />

     {getField(document)}

 </span>

 <span>

    <Library size={14} />

    {getInstitution(document)}

 </span>

 {document?.published_at && (

    <span>

      <Calendar size={14} />

      {formatDate(document.published_at)}

    </span>

 )}

</div>

</div>

<div className="macevo-depot-public-card-footer">

<span className="macevo-depot-published-label">

 <ShieldCheck size={15} />

 Publication publique

</span>

<button

 type="button"

 disabled={!editorPath}

 onClick={() => onOpen(document)}

>

 Ouvrir

 <ChevronRight size={16} />

</button>

         </div>

     </article>

    );

}

function DepotScientifique() {

    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("repository");

    const [reports, setReports] = useState([]);

    const [myDeposits, setMyDeposits] = useState([]);

    const [publicDocuments, setPublicDocuments] = useState([]);

    const [loadingReports, setLoadingReports] = useState(false);

    const [loadingRepository, setLoadingRepository] = useState(true);

    const [loadingDeposits, setLoadingDeposits] = useState(false);

    const [searchInput, setSearchInput] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    const [selectedType, setSelectedType] = useState("");

    const [selectedReport, setSelectedReport] = useState(null);

    const [documentType, setDocumentType] = useState("MEM");

    const [depositStep, setDepositStep] = useState(1);

const [depositMetadata, setDepositMetadata] = useState({

 title: "",

 summary: "",

 scientific_field: "",

 academic_level: "",

 language: "Français",

 institution: "",

 department: "",

 supervisor: "",

 academic_year: "",

});

const [consentAccepted, setConsentAccepted] = useState(false);

const [selectedDocument, setSelectedDocument] = useState(null);

const [loadingAction, setLoadingAction] = useState(false);

const [error, setError] = useState("");

const [actionMessage, setActionMessage] = useState("");

const currentStepTitle = useMemo(() => {

 if (depositStep === 1) {

     return "Sélectionner votre document";

 }

 if (depositStep === 2) {

     return "Informations scientifiques";

 }

 if (depositStep === 3) {

     return "Vérifier votre dépôt";

 }

 return "Autorisation de publication";

}, [depositStep]);

const loadReports = useCallback(async () => {

 setLoadingReports(true);

 try {

     const response = await api.get("reports/");

     setReports(normalizeList(response?.data));

 } catch (err) {

     console.error("Erreur chargement des rapports :", err);

     setReports([]);

     setError(

      err?.response?.data?.detail ||

          err?.response?.data?.message ||

          "Impossible de récupérer vos rapports."

     );

 } finally {

     setLoadingReports(false);

 }

}, []);

const loadRepository = useCallback(async () => {

setLoadingRepository(true);

try {

 const params = {};

 if (selectedType) {

     params.document_type = selectedType;

 }

 let data;

 if (searchQuery.trim()) {

     data = await depotScientifiqueService.search(

      searchQuery.trim(),

      params

     );

 } else {

     data = await depotScientifiqueService.list(params);

 }

 const results = normalizeList(data).filter((document) => {

     if (

      document?.publication_status &&

      document.publication_status !== "published"

     ){

      return false;

     }

     if (

         document?.visibility &&

         document.visibility !== "public"

     ){

         return false;

     }

     return true;

    });

    setPublicDocuments(results);

} catch (err) {

    console.error("Erreur dépôt scientifique :", err);

    setPublicDocuments([]);

    setError(

     err?.response?.data?.detail ||

         err?.response?.data?.message ||

         "Impossible de charger le repository scientifique."

    );

} finally {

    setLoadingRepository(false);

}

}, [searchQuery, selectedType]);

const loadMyDeposits = useCallback(async () => {

 setLoadingDeposits(true);

 try {

     const data = await depotScientifiqueService.myDeposits();

 const deposits = normalizeList(data);

     setMyDeposits(deposits);

 } catch (err) {

     console.error("Erreur chargement de mes dépôts :", err);

     setMyDeposits([]);

 } finally {

     setLoadingDeposits(false);

 }

}, []);

useEffect(() => {

 setError("");

 loadRepository();

}, [loadRepository]);

useEffect(() => {

 if (activeTab === "deposer") {

     loadReports();

 }

 if (activeTab === "mes-depots") {

     loadMyDeposits();

 }

}, [activeTab, loadReports, loadMyDeposits]);

const resetDeposit = () => {

 setSelectedReport(null);

 setDocumentType("MEM");

 setDepositStep(1);

 setDepositMetadata({

     title: "",

     summary: "",

     scientific_field: "",

     academic_level: "",

     language: "Français",

     institution: "",

     department: "",

     supervisor: "",

     academic_year: "",

 });

 setConsentAccepted(false);

 setActionMessage("");

 setError("");

};

const handleStartDeposit = () => {

 resetDeposit();

 setActiveTab("deposer");

 loadReports();

};

const handleSelectReport = (report) => {

 setSelectedReport(report);

 setDepositMetadata({

     title: report?.title || "",

     summary: report?.summary || "",

     scientific_field: report?.scientific_field || "",

     academic_level: report?.academic_level || "",

     language: report?.language || "Français",

     institution: report?.institution || "",

     department: report?.department || "",

     supervisor: report?.supervisor || "",

     academic_year: report?.academic_year || "",

 });

 if (report?.report_type) {

     const matchingType = DOCUMENT_TYPES.find(

      (item) =>

          item.value.toLowerCase() ===

          String(report.report_type).toLowerCase()

     );

     if (matchingType) {

         setDocumentType(matchingType.value);

     }

 }

};

const handleMetadataChange = (event) => {

 const { name, value } = event.target;

 setDepositMetadata((current) => ({

     ...current,

     [name]: value,

 }));

};

const handleNextStep = () => {

 setError("");

 if (depositStep === 1) {

     if (!selectedReport) {

         setError("Sélectionnez d'abord le rapport à déposer.");

         return;

     }

     setDepositStep(2);

     return;

 }

 if (depositStep === 2) {

     if (!depositMetadata.title.trim()) {

         setError("Le titre du document est obligatoire.");

         return;

     }

     if (!depositMetadata.scientific_field.trim()) {

         setError("Le domaine scientifique est obligatoire.");

         return;

     }

     setDepositStep(3);

     return;

 }

 if (depositStep === 3) {

     setDepositStep(4);

 }

};

const handlePreviousStep = () => {

 setError("");

 if (depositStep > 1) {

     setDepositStep((current) => current - 1);

 }

};

const handlePublish = async () => {

 if (!selectedReport) {

     setError("Aucun rapport n'a été sélectionné.");

     return;

 }

 if (!consentAccepted) {

     setError(
      "Vous devez confirmer votre autorisation de publication."
     );

     return;

 }

 const reportId = getReportId(selectedReport);

 if (!reportId) {

     setError("Impossible d'identifier le rapport sélectionné.");

     return;

 }

 setLoadingAction(true);
 setError("");
 setActionMessage("");

 try {

     /*
      * Le rapport peut déjà posséder un dépôt scientifique.
      * On le recherche d'abord afin d'éviter de recréer un dépôt
      * et de provoquer une réponse 400 du backend.
      */
     const depositsResponse = await depotScientifiqueService.myDeposits();
     const deposits = normalizeList(depositsResponse);

     const existingDeposit = deposits.find((deposit) => {
         const depositReportId =
             deposit?.report_id ??
             deposit?.report?.id ??
             deposit?.report?.pk;

         return Number(depositReportId) === Number(reportId);
     });

     let publicId =
         existingDeposit?.public_id ||
         existingDeposit?.data?.public_id ||
         existingDeposit?.deposit?.public_id;

     let currentDeposit = existingDeposit;

     /*
      * Si aucun dépôt n'existe encore, on en crée un en brouillon.
      */
     if (!publicId) {
         const created = await depotScientifiqueService.create({
             report: Number(reportId),
             document_type: documentType,
         });

         publicId =
             created?.public_id ||
             created?.data?.public_id ||
             created?.deposit?.public_id;

         currentDeposit = created;
     }

     if (!publicId) {
         throw new Error(
             "Le dépôt scientifique a été traité, mais son identifiant public MACEVO est introuvable."
         );
     }

     /*
      * Le consentement n'est envoyé que s'il n'est pas déjà enregistré.
      */
     if (currentDeposit?.consent_given !== true) {
         const consentResponse =
             await depotScientifiqueService.giveConsent(publicId, {
                 accepted: true,
                 consent_version: "1.0",
             });

         currentDeposit = {
             ...(currentDeposit || {}),
             ...(consentResponse || {}),
             consent_given: true,
         };
     }

     /*
      * Publication du dépôt existant ou nouvellement créé.
      */
     await depotScientifiqueService.publish(publicId);

     setActionMessage(
         `Votre document a été publié avec l'identifiant MACEVO ${publicId}.`
     );

     setDepositStep(5);

     await loadRepository();
     await loadMyDeposits();

 } catch (err) {

     console.error("Erreur publication scientifique :", err);

     const responseData = err?.response?.data;
     let message =
         responseData?.detail ||
         responseData?.message ||
         err?.message ||
         "La publication du document a échoué.";

     if (typeof message !== "string") {
         try {
             message = JSON.stringify(message);
         } catch {
             message = "La publication du document a échoué.";
         }
     }

     setError(message);

 } finally {

     setLoadingAction(false);

 }

};

const handleOpenEditor = (document) => {

 const editorPath = getEditorPath(document);

 if (!editorPath) {

     setError(

      "Impossible d'ouvrir l'éditeur : le rapport associé est introuvable."

     );

     return;

 }

 navigate(editorPath);

};

const handleSearchSubmit = (event) => {

 event.preventDefault();

 setSearchQuery(searchInput.trim());

};

const handleClearSearch = () => {

 setSearchInput("");

 setSearchQuery("");

};

const handleTypeChange = (event) => {

 setSelectedType(event.target.value);

};

const handleTabChange = (tab) => {

 setError("");

 setActionMessage("");

 if (tab === "deposer") {

     resetDeposit();

     loadReports();

 }

 setActiveTab(tab);

};

const publishedDocuments = useMemo(

 () =>

     myDeposits.filter(

      (deposit) =>

          deposit?.publication_status === "published" ||

          deposit?.is_public === true

     ),

 [myDeposits]

);

return (

 <div className="macevo-depot-layout">

     <style>{`

      .macevo-depot-layout {

          min-height: 100vh;

          width: 100%;

          display: flex;

    background: #f8fafc;

    color: #1f2937;

}

.macevo-depot-main {

    flex: 1;

    min-width: 0;

    display: flex;

    flex-direction: column;

    min-height: 100vh;

}

.macevo-depot-content {

    flex: 1;

    width: 100%;

    box-sizing: border-box;

    padding: 28px;

}

.macevo-depot-container {

    width: 100%;

    max-width: 1500px;

    margin: 0 auto;

}

.macevo-depot-hero {

    display: flex;

    justify-content: space-between;

    align-items: stretch;

    gap: 24px;

    padding: 30px;

    margin-bottom: 22px;

    border: 1px solid #e2e8f0;

    border-radius: 18px;

    background: #ffffff;

    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);

}

.macevo-depot-hero-main {

    flex: 1;

    min-width: 0;

}

.macevo-depot-kicker {

    display: inline-flex;

    align-items: center;

    gap: 7px;

    margin-bottom: 9px;

    color: #2563eb;

    font-size: 12px;

    font-weight: 800;

    letter-spacing: 0.06em;

    text-transform: uppercase;

}

.macevo-depot-hero h1 {

    margin: 0 0 10px;

    color: #0f172a;

    font-size: clamp(28px, 3vw, 40px);

    line-height: 1.1;

}

.macevo-depot-hero p {

    max-width: 850px;

    margin: 0;

    color: #64748b;

    font-size: 14px;

    line-height: 1.75;

}

.macevo-depot-hero-actions {

    display: flex;

    align-items: center;

    justify-content: center;

}

.macevo-depot-publish-button {

    min-height: 48px;

    padding: 0 18px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    border: 0;

    border-radius: 11px;

    background: #2563eb;

    color: #ffffff;

    font-weight: 800;

    cursor: pointer;

    white-space: nowrap;

    box-shadow: 0 7px 18px rgba(37, 99, 235, 0.18);

}

.macevo-depot-publish-button:hover {

    background: #1d4ed8;

}

.macevo-depot-tabs {

    display: flex;

    gap: 4px;

    margin-bottom: 22px;

    padding: 5px;

    border: 1px solid #e2e8f0;

    border-radius: 13px;

    background: #ffffff;

}

.macevo-depot-tab {

    flex: 1;

    min-height: 44px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    padding: 0 14px;

    border: 0;

    border-radius: 9px;

    background: transparent;

    color: #64748b;

    font-size: 13px;

    font-weight: 700;

    cursor: pointer;

}

.macevo-depot-tab:hover {

    background: #f8fafc;

    color: #334155;

}

.macevo-depot-tab.is-active {

    background: #eff6ff;

    color: #2563eb;

}

.macevo-depot-tab-count {

    min-width: 20px;

    height: 20px;

    padding: 0 6px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border-radius: 999px;

    background: #e2e8f0;

    color: #475569;

    font-size: 10px;

}

.macevo-depot-tab.is-active .macevo-depot-tab-count {

    background: #dbeafe;

    color: #1d4ed8;

}

.macevo-depot-alert {

    display: flex;

    align-items: flex-start;

    gap: 10px;

    margin-bottom: 20px;

    padding: 13px 15px;

    border: 1px solid #fecaca;

    border-radius: 11px;

    background: #fef2f2;

    color: #991b1b;

    font-size: 13px;

    line-height: 1.5;

}

.macevo-depot-alert svg {

    flex: 0 0 auto;

    margin-top: 1px;

}

.macevo-depot-success {

    display: flex;

    align-items: flex-start;

    gap: 11px;

    margin-bottom: 20px;

    padding: 15px;

    border: 1px solid #bbf7d0;

    border-radius: 11px;

    background: #f0fdf4;

    color: #166534;

    font-size: 13px;

    line-height: 1.6;

}

.macevo-depot-success svg {

    flex: 0 0 auto;

    margin-top: 2px;

}

.macevo-depot-search-panel {

    padding: 18px;

    margin-bottom: 22px;

    border: 1px solid #e2e8f0;

    border-radius: 15px;

    background: #ffffff;

}

.macevo-depot-search-form {

    display: flex;

    gap: 10px;

}

.macevo-depot-search-input-wrapper {

    position: relative;

    flex: 1;

}

.macevo-depot-search-input-wrapper > svg {

    position: absolute;

    left: 14px;

    top: 50%;

    transform: translateY(-50%);

    color: #94a3b8;

    pointer-events: none;

}

.macevo-depot-search-input {

    width: 100%;

    height: 48px;

    box-sizing: border-box;

    padding: 0 42px;

    border: 1px solid #cbd5e1;

    border-radius: 10px;

    outline: none;

    background: #ffffff;

    color: #0f172a;

    font-size: 13px;

}

.macevo-depot-search-input:focus {

    border-color: #2563eb;

    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);

}

.macevo-depot-clear-search {

    position: absolute;

    top: 50%;

    right: 10px;

    transform: translateY(-50%);

    width: 28px;

    height: 28px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    padding: 0;

    border: 0;

    border-radius: 7px;

    background: transparent;

    color: #64748b;

    cursor: pointer;

}

.macevo-depot-clear-search:hover {

    background: #f1f5f9;

}

.macevo-depot-search-submit {

    height: 48px;

    padding: 0 19px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    border: 0;

    border-radius: 10px;

    background: #2563eb;

    color: #ffffff;

    font-weight: 800;

    cursor: pointer;

}

.macevo-depot-search-submit:hover {

    background: #1d4ed8;

}

.macevo-depot-filters {

    display: flex;

    align-items: center;

    gap: 10px;

    margin-top: 13px;

}

.macevo-depot-filters label {

    color: #64748b;

    font-size: 12px;

    font-weight: 700;

}

.macevo-depot-type-select {

    height: 38px;

    padding: 0 32px 0 11px;

    border: 1px solid #cbd5e1;

    border-radius: 8px;

    background: #ffffff;

    color: #334155;

    outline: none;

    font-size: 12px;

}

.macevo-depot-section-heading {

    display: flex;

    justify-content: space-between;

    align-items: center;

    gap: 15px;

    margin-bottom: 15px;

}

.macevo-depot-section-heading h2 {

    margin: 0;

    color: #0f172a;

    font-size: 20px;

}

.macevo-depot-section-heading span {

    color: #64748b;

    font-size: 12px;

}

.macevo-depot-public-grid {

    display: grid;

    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));

    gap: 17px;

}

.macevo-depot-public-card {

    display: flex;

    flex-direction: column;

    min-width: 0;

    overflow: hidden;

    border: 1px solid #e2e8f0;

    border-radius: 15px;

    background: #ffffff;

    box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);

    transition: 0.2s ease;

}

.macevo-depot-public-card:hover {

    transform: translateY(-2px);

    border-color: #bfdbfe;

    box-shadow: 0 9px 25px rgba(15, 23, 42, 0.08);

}

.macevo-depot-public-card-top {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 10px;

    padding: 17px 17px 0;

}

.macevo-depot-public-icon {

    width: 43px;

    height: 43px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border-radius: 10px;

    background: #eff6ff;

    color: #2563eb;

}

.macevo-depot-type-badge {

    padding: 6px 9px;

    border-radius: 999px;

    background: #f1f5f9;

    color: #475569;

    font-size: 10px;

    font-weight: 800;

}

.macevo-depot-public-card-body {

    flex: 1;

    padding: 15px 17px 17px;

}

.macevo-depot-public-card-body h3 {

    margin: 0 0 11px;

    color: #0f172a;

    font-size: 17px;

    line-height: 1.4;

    display: -webkit-box;

    -webkit-line-clamp: 2;

    -webkit-box-orient: vertical;

    overflow: hidden;

}

.macevo-depot-public-id {

    display: flex;

    flex-direction: column;

    gap: 3px;

    margin-bottom: 12px;

       padding: 8px 10px;

       border: 1px solid #e2e8f0;

       border-radius: 9px;

       background: #f8fafc;

   }

   .macevo-depot-public-id span {

       color: #94a3b8;

       font-size: 9px;

       font-weight: 800;

       text-transform: uppercase;

       letter-spacing: 0.06em;

   }

   .macevo-depot-public-id strong {

       color: #334155;

   font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
monospace;

       font-size: 11px;

       word-break: break-all;

   }

   .macevo-depot-public-card-body > p {

       display: -webkit-box;

       -webkit-line-clamp: 3;

       -webkit-box-orient: vertical;

       overflow: hidden;

       margin: 0 0 16px;

    color: #64748b;

    font-size: 12px;

    line-height: 1.65;

}

.macevo-depot-public-meta {

    display: flex;

    flex-direction: column;

    gap: 8px;

}

.macevo-depot-public-meta span {

    display: flex;

    align-items: flex-start;

    gap: 7px;

    color: #64748b;

    font-size: 11px;

    line-height: 1.4;

}

.macevo-depot-public-meta svg {

    flex: 0 0 auto;

    color: #94a3b8;

    margin-top: 1px;

}

.macevo-depot-public-card-footer {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 10px;

    padding: 12px 17px;

    border-top: 1px solid #f1f5f9;

    background: #fafafa;

}

.macevo-depot-published-label {

    display: inline-flex;

    align-items: center;

    gap: 5px;

    color: #64748b;

    font-size: 10px;

}

.macevo-depot-published-label svg {

    color: #16a34a;

}

.macevo-depot-public-card-footer button {

    display: inline-flex;

    align-items: center;

    gap: 3px;

    border: 0;

    background: transparent;

    color: #2563eb;

    font-size: 11px;

    font-weight: 800;

    cursor: pointer;

}

.macevo-depot-public-card-footer button:disabled {

    opacity: 0.45;

    cursor: not-allowed;

}

.macevo-depot-state {

    min-height: 270px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    padding: 28px;

    border: 1px dashed #cbd5e1;

    border-radius: 15px;

    background: #ffffff;

    text-align: center;

}

.macevo-depot-state h3 {

    margin: 12px 0 7px;

    color: #0f172a;

    font-size: 17px;

}

.macevo-depot-state p {

    max-width: 550px;

    margin: 0;

    color: #64748b;

    font-size: 12px;

    line-height: 1.65;

}

.macevo-depot-empty-icon {

    color: #94a3b8;

}

.macevo-depot-retry {

    margin-top: 15px;

    min-height: 39px;

    padding: 0 14px;

    border: 1px solid #cbd5e1;

    border-radius: 8px;

    background: #ffffff;

    color: #334155;

    font-weight: 700;

    cursor: pointer;

}

.macevo-depot-retry:hover {

    background: #f8fafc;

}

/* Dépôt */

.macevo-depot-workspace {

    border: 1px solid #e2e8f0;

    border-radius: 16px;

    background: #ffffff;

    overflow: hidden;

}

.macevo-depot-workspace-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 20px;

    padding: 22px;

    border-bottom: 1px solid #e2e8f0;

}

.macevo-depot-workspace-header h2 {

    margin: 0 0 5px;

    color: #0f172a;

    font-size: 21px;

}

.macevo-depot-workspace-header p {

    margin: 0;

    color: #64748b;

    font-size: 12px;

}

.macevo-depot-back-button {

    min-height: 38px;

    padding: 0 12px;

    display: inline-flex;

    align-items: center;

    gap: 6px;

    border: 1px solid #cbd5e1;

    border-radius: 8px;

    background: #ffffff;

    color: #475569;

    font-weight: 700;

    cursor: pointer;

}

.macevo-depot-back-button:hover {

    background: #f8fafc;

}

.macevo-depot-steps {

    display: grid;

    grid-template-columns: repeat(4, 1fr);

    gap: 0;

    border-bottom: 1px solid #e2e8f0;

    background: #fafafa;

}

.macevo-depot-step {

    position: relative;

    display: flex;

    align-items: center;

    gap: 9px;

    padding: 15px;

    border-right: 1px solid #e2e8f0;

    color: #94a3b8;

}

.macevo-depot-step:last-child {

    border-right: 0;

}

.macevo-depot-step-number {

    width: 27px;

    height: 27px;

    flex: 0 0 auto;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border-radius: 50%;

    background: #e2e8f0;

    color: #64748b;

    font-size: 11px;

    font-weight: 800;

}

.macevo-depot-step span:last-child {

    font-size: 11px;

    font-weight: 700;

}

.macevo-depot-step.is-active {

    background: #eff6ff;

    color: #2563eb;

}

.macevo-depot-step.is-active .macevo-depot-step-number {

    background: #2563eb;

    color: #ffffff;

}

.macevo-depot-step.is-complete {

    color: #15803d;

}

.macevo-depot-step.is-complete .macevo-depot-step-number {

    background: #dcfce7;

    color: #15803d;

}

.macevo-depot-workspace-body {

    padding: 25px;

}

.macevo-depot-workspace-title {

    margin-bottom: 18px;

}

.macevo-depot-workspace-title h3 {

    margin: 0 0 6px;

    color: #0f172a;

    font-size: 18px;

}

.macevo-depot-workspace-title p {

    margin: 0;

    color: #64748b;

    font-size: 12px;

    line-height: 1.6;

}

.macevo-depot-report-list {

    display: grid;

    gap: 10px;

}

.macevo-depot-report-selector {

    width: 100%;

    display: flex;

    align-items: center;

    gap: 12px;

    padding: 14px;

    border: 1px solid #e2e8f0;

    border-radius: 11px;

    background: #ffffff;

    color: inherit;

    text-align: left;

    cursor: pointer;

    transition: 0.18s ease;

}

.macevo-depot-report-selector:hover {

    border-color: #bfdbfe;

    background: #f8fbff;

}

.macevo-depot-report-selector.is-selected {

    border-color: #60a5fa;

    background: #eff6ff;

    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.07);

}

.macevo-depot-report-selector-icon {

    width: 40px;

    height: 40px;

    flex: 0 0 auto;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border-radius: 9px;

    background: #f1f5f9;

    color: #64748b;

}

.macevo-depot-report-selector.is-selected

    .macevo-depot-report-selector-icon {

    background: #2563eb;

    color: #ffffff;

}

.macevo-depot-report-selector-content {

    min-width: 0;

    flex: 1;

    display: flex;

    flex-direction: column;

    gap: 3px;

}

.macevo-depot-report-selector-content strong {

    color: #0f172a;

    font-size: 13px;

    line-height: 1.4;

}

.macevo-depot-report-selector-content span {

    color: #64748b;

    font-size: 11px;

}

   .macevo-depot-report-internal-id {

       color: #94a3b8 !important;

   font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
monospace;

       font-size: 10px !important;

   }

   .macevo-depot-report-selector > svg {

       flex: 0 0 auto;

       color: #94a3b8;

   }

   .macevo-depot-form-grid {

       display: grid;

       grid-template-columns: repeat(2, minmax(0, 1fr));

       gap: 15px;

   }

   .macevo-depot-field {

       display: flex;

       flex-direction: column;

       gap: 6px;

   }

   .macevo-depot-field.full {

       grid-column: 1 / -1;

   }

.macevo-depot-field label {

    color: #334155;

    font-size: 11px;

    font-weight: 800;

}

.macevo-depot-field input,

.macevo-depot-field select,

.macevo-depot-field textarea {

    width: 100%;

    box-sizing: border-box;

    border: 1px solid #cbd5e1;

    border-radius: 9px;

    outline: none;

    background: #ffffff;

    color: #0f172a;

    font-size: 12px;

}

.macevo-depot-field input,

.macevo-depot-field select {

    height: 42px;

    padding: 0 11px;

}

.macevo-depot-field textarea {

    min-height: 105px;

    padding: 10px 11px;

    resize: vertical;

    line-height: 1.6;

}

.macevo-depot-field input:focus,

.macevo-depot-field select:focus,

.macevo-depot-field textarea:focus {

    border-color: #2563eb;

    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);

}

.macevo-depot-selected-document {

    display: flex;

    align-items: center;

    gap: 12px;

    padding: 13px;

    margin-bottom: 18px;

    border: 1px solid #dbeafe;

    border-radius: 10px;

    background: #eff6ff;

}

.macevo-depot-selected-document-icon {

    width: 38px;

    height: 38px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border-radius: 9px;

    background: #2563eb;

    color: #ffffff;

}

.macevo-depot-selected-document-info {

    min-width: 0;

    display: flex;

    flex-direction: column;

    gap: 3px;

}

.macevo-depot-selected-document-info strong {

    color: #1e3a8a;

    font-size: 12px;

}

.macevo-depot-selected-document-info span {

    color: #3b82f6;

    font-size: 10px;

}

.macevo-depot-review {

    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 12px;

}

.macevo-depot-review-card {

    padding: 14px;

    border: 1px solid #e2e8f0;

    border-radius: 10px;

    background: #ffffff;

}

.macevo-depot-review-card.full {

    grid-column: 1 / -1;

}

.macevo-depot-review-card span {

    display: block;

    margin-bottom: 5px;

    color: #94a3b8;

    font-size: 9px;

    font-weight: 800;

    text-transform: uppercase;

}

.macevo-depot-review-card strong,

.macevo-depot-review-card p {

    margin: 0;

    color: #334155;

    font-size: 12px;

    line-height: 1.6;

}

.macevo-depot-consent {

    padding: 18px;

    border: 1px solid #e2e8f0;

    border-radius: 12px;

    background: #f8fafc;

}

.macevo-depot-consent-header {

    display: flex;

    align-items: flex-start;

    gap: 12px;

    margin-bottom: 13px;

}

.macevo-depot-consent-icon {

    width: 40px;

    height: 40px;

    flex: 0 0 auto;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border-radius: 10px;

    background: #ffffff;

    color: #2563eb;

    border: 1px solid #dbeafe;

}

.macevo-depot-consent-header h3 {

    margin: 0 0 5px;

    color: #0f172a;

    font-size: 15px;

}

.macevo-depot-consent-header p {

    margin: 0;

    color: #64748b;

    font-size: 11px;

    line-height: 1.6;

}

.macevo-depot-consent-check {

    display: flex;

    align-items: flex-start;

    gap: 10px;

    padding: 12px;

    border: 1px solid #e2e8f0;

    border-radius: 9px;

    background: #ffffff;

    cursor: pointer;

}

.macevo-depot-consent-check input {

    margin-top: 2px;

    accent-color: #2563eb;

}

.macevo-depot-consent-check span {

    color: #334155;

    font-size: 11px;

    line-height: 1.6;

}

.macevo-depot-workspace-footer {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 10px;

    padding: 17px 25px;

    border-top: 1px solid #e2e8f0;

    background: #fafafa;

}

.macevo-depot-footer-left,

.macevo-depot-footer-right {

    display: flex;

    gap: 9px;

}

.macevo-depot-action-secondary,

.macevo-depot-action-primary {

    min-height: 42px;

    padding: 0 15px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    border-radius: 9px;

    font-size: 12px;

    font-weight: 800;

    cursor: pointer;

}

.macevo-depot-action-secondary {

    border: 1px solid #cbd5e1;

    background: #ffffff;

    color: #334155;

}

.macevo-depot-action-primary {

    border: 0;

    background: #2563eb;

    color: #ffffff;

}

.macevo-depot-action-primary:hover {

    background: #1d4ed8;

}

.macevo-depot-action-primary:disabled {

    opacity: 0.55;

    cursor: not-allowed;

}

.macevo-depot-final {

    display: flex;

    flex-direction: column;

    align-items: center;

    padding: 35px 20px;

    text-align: center;

}

.macevo-depot-final-icon {

    width: 68px;

    height: 68px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    margin-bottom: 16px;

    border-radius: 50%;

    background: #dcfce7;

    color: #15803d;

}

.macevo-depot-final h3 {

    margin: 0 0 8px;

    color: #0f172a;

    font-size: 22px;

}

.macevo-depot-final p {

    max-width: 620px;

    margin: 0 0 18px;

    color: #64748b;

    font-size: 12px;

    line-height: 1.7;

}

.macevo-depot-final-id {

    min-width: min(500px, 100%);

    box-sizing: border-box;

    padding: 16px;

    margin-bottom: 20px;

    border: 1px solid #dbeafe;

    border-radius: 11px;

    background: #eff6ff;

}

.macevo-depot-final-id span {

    display: block;

    margin-bottom: 5px;

    color: #3b82f6;

    font-size: 10px;

    font-weight: 800;

    text-transform: uppercase;

}

.macevo-depot-final-id strong {

       color: #1e3a8a;

   font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
monospace;

       font-size: 14px;

       word-break: break-all;

   }

   /* Mes dépôts */

   .macevo-depot-my-grid {

       display: grid;

       grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));

       gap: 16px;

   }

   .macevo-depot-my-card {

       padding: 17px;

       border: 1px solid #e2e8f0;

       border-radius: 14px;

       background: #ffffff;

   }

   .macevo-depot-my-card-header {

       display: flex;

       justify-content: space-between;

       gap: 10px;

       margin-bottom: 13px;

   }

   .macevo-depot-my-card h3 {

       margin: 0;

       color: #0f172a;

       font-size: 15px;

       line-height: 1.4;

   }

   .macevo-depot-status {

       flex: 0 0 auto;

       padding: 5px 8px;

       border-radius: 999px;

       background: #f1f5f9;

       color: #475569;

       font-size: 9px;

       font-weight: 800;

   }

   .macevo-depot-my-id {

       margin-bottom: 13px;

       color: #64748b;

       font-size: 10px;

   }

   .macevo-depot-my-id strong {

       color: #334155;

   font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
monospace;

}

.macevo-depot-my-meta {

    display: flex;

    flex-direction: column;

    gap: 7px;

    color: #64748b;

    font-size: 11px;

}

.macevo-depot-my-meta span {

    display: flex;

    gap: 7px;

    align-items: center;

}

.macevo-depot-my-actions {

    display: flex;

    gap: 8px;

    margin-top: 15px;

}

.macevo-depot-my-actions button {

    min-height: 36px;

    padding: 0 11px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 5px;

    border: 1px solid #cbd5e1;

    border-radius: 8px;

    background: #ffffff;

    color: #334155;

    font-size: 10px;

    font-weight: 800;

    cursor: pointer;

}

.macevo-depot-my-actions button:hover {

    background: #f8fafc;

}

/* Modal */

.macevo-depot-modal-overlay {

    position: fixed;

    inset: 0;

    z-index: 1000;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;

    background: rgba(15, 23, 42, 0.58);

    backdrop-filter: blur(3px);

}

.macevo-depot-modal {

    width: min(820px, 100%);
    height: min(760px, calc(100vh - 40px));
    max-height: calc(100vh - 40px);

    display: flex;

    flex-direction: column;

    overflow: hidden;

    border-radius: 16px;

    background: #ffffff;

    box-shadow: 0 25px 70px rgba(15, 23, 42, 0.25);

}

.macevo-depot-modal-header {

    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 15px;

    padding: 20px;

    border-bottom: 1px solid #e2e8f0;

}

.macevo-depot-modal-header span {

    display: block;

    margin-bottom: 5px;

    color: #2563eb;

    font-size: 10px;

    font-weight: 800;

    text-transform: uppercase;

}

.macevo-depot-modal-header h2 {

    margin: 0;

    color: #0f172a;

    font-size: 20px;

    line-height: 1.4;

}

.macevo-depot-modal-close {

    width: 34px;

    height: 34px;

    flex: 0 0 auto;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    border: 0;

    border-radius: 8px;

    background: #f1f5f9;

    color: #475569;

    cursor: pointer;

}

.macevo-depot-modal-content {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
}

.macevo-depot-modal-id {

       padding: 12px;

       margin-bottom: 17px;

       border: 1px solid #dbeafe;

       border-radius: 9px;

       background: #eff6ff;

   }

   .macevo-depot-modal-id span {

       display: block;

       margin-bottom: 4px;

       color: #3b82f6;

       font-size: 9px;

       font-weight: 800;

       text-transform: uppercase;

   }

   .macevo-depot-modal-id strong {

       color: #1e3a8a;

   font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
monospace;

       font-size: 12px;

       word-break: break-all;

   }

   .macevo-depot-modal-grid {

       display: grid;

       grid-template-columns: repeat(2, minmax(0, 1fr));

       gap: 11px;

}

.macevo-depot-modal-grid > div {

    padding: 11px;

    border: 1px solid #e2e8f0;

    border-radius: 9px;

}

.macevo-depot-modal-grid span {

    display: block;

    margin-bottom: 4px;

    color: #94a3b8;

    font-size: 9px;

    font-weight: 800;

    text-transform: uppercase;

}

.macevo-depot-modal-grid strong {

    color: #334155;

    font-size: 11px;

    line-height: 1.5;

}

.macevo-depot-modal-summary {

    margin-top: 17px;

}

.macevo-depot-modal-summary h3 {

    margin: 0 0 7px;

    color: #0f172a;

    font-size: 14px;

}

.macevo-depot-modal-summary p {

    margin: 0;

    color: #64748b;

    font-size: 11px;

    line-height: 1.7;

    white-space: pre-line;

}

.macevo-depot-modal-footer {
    flex: 0 0 auto;
    min-height: 72px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 15px 20px;
    border-top: 1px solid #e2e8f0;
    background: #fafafa;
}

.macevo-depot-modal-footer button {

    min-height: 42px;
    padding: 0 15px;

    display: inline-flex;

    align-items: center;

    gap: 6px;

    border-radius: 8px;

    font-size: 11px;

    font-weight: 800;

    cursor: pointer;
    white-space: nowrap;

}

.macevo-depot-modal-secondary {

    border: 1px solid #cbd5e1;

    background: #ffffff;

    color: #334155;

}

.macevo-depot-modal-primary {

    border: 0;

    background: #2563eb;

    color: #ffffff;

}

.macevo-depot-spin {

    animation: macevoDepotSpin 0.85s linear infinite;

}

@keyframes macevoDepotSpin {

    to {

        transform: rotate(360deg);

    }

}

@media (max-width: 950px) {

    .macevo-depot-content {

        padding: 18px;

    }

    .macevo-depot-hero {

        flex-direction: column;

    }

    .macevo-depot-hero-actions {

        justify-content: flex-start;

    }

    .macevo-depot-steps {

        grid-template-columns: repeat(2, 1fr);

    }

    .macevo-depot-step:nth-child(2) {

        border-right: 0;

    }

    .macevo-depot-step:nth-child(-n + 2) {

        border-bottom: 1px solid #e2e8f0;

    }

}

@media (max-width: 700px) {

    .macevo-depot-tabs {

    flex-direction: column;

}

.macevo-depot-search-form {

    flex-direction: column;

}

.macevo-depot-search-submit {

    width: 100%;

}

.macevo-depot-form-grid,

.macevo-depot-review,

.macevo-depot-modal-grid {

    grid-template-columns: 1fr;

}

.macevo-depot-field.full,

.macevo-depot-review-card.full {

    grid-column: auto;

}

.macevo-depot-workspace-body {

    padding: 17px;

}

.macevo-depot-workspace-footer {

    flex-direction: column;

        align-items: stretch;

    }

    .macevo-depot-footer-left,

    .macevo-depot-footer-right {

        width: 100%;

    }

    .macevo-depot-footer-left button,

    .macevo-depot-footer-right button {

        flex: 1;

    }

}

@media (max-width: 500px) {

    .macevo-depot-content {

        padding: 11px;

    }

    .macevo-depot-hero {

        padding: 20px;

    }

    .macevo-depot-steps {

        grid-template-columns: 1fr;

    }

    .macevo-depot-step {

        border-right: 0;

        border-bottom: 1px solid #e2e8f0;

    }

    .macevo-depot-step:last-child {

        border-bottom: 0;

    }

    .macevo-depot-public-grid,

    .macevo-depot-my-grid {

        grid-template-columns: 1fr;

    }

    .macevo-depot-modal-overlay {

        padding: 8px;

    }

    .macevo-depot-modal {
        width: 100%;
        height: calc(100vh - 16px);
        max-height: calc(100vh - 16px);
        border-radius: 14px;
    }

    .macevo-depot-modal-header {
        padding: 16px;
    }

    .macevo-depot-modal-content {
        padding: 16px;
    }

    .macevo-depot-modal-footer {
        min-height: 68px;
        padding: 12px 16px;
        flex-wrap: wrap;
    }

    .macevo-depot-modal-footer button {
        flex: 1 1 auto;
        justify-content: center;
    }

}

`}</style>

<Sidebar />

<div className="macevo-depot-main">

<Navbar />

<main className="macevo-depot-content">

<div className="macevo-depot-container">

 <section className="macevo-depot-hero">

  <div className="macevo-depot-hero-main">

   <div className="macevo-depot-kicker">

    <Globe2 size={16} />

    Bibliothèque scientifique MACEVO

   </div>

   <h1>Dépôt scientifique</h1>

   <p>

    Déposez, publiez et gérez vos mémoires, thèses,

    articles, rapports et autres travaux scientifiques.

    Chaque publication peut recevoir un identifiant

    scientifique MACEVO permettant de la retrouver

    durablement dans le repository.

   </p>

  </div>

  <div className="macevo-depot-hero-actions">

   <button

    type="button"

    className="macevo-depot-publish-button"

    onClick={handleStartDeposit}

   >

    <Plus size={18} />

      Déposer mon mémoire

     </button>

 </div>

</section>

{error && (

 <div className="macevo-depot-alert">

     <AlertCircle size={18} />

     <span>{error}</span>

 </div>

)}

{actionMessage && (

 <div className="macevo-depot-success">

     <Check size={19} />

     <span>{actionMessage}</span>

 </div>

)}

<nav className="macevo-depot-tabs">

 <button

     type="button"

     className={`macevo-depot-tab ${

      activeTab === "repository" ? "is-active" : ""

     }`}

     onClick={() => handleTabChange("repository")}

 >

     <Library size={16} />

Repository public

<span className="macevo-depot-tab-count">

    {publicDocuments.length}

</span>

</button>

<button

type="button"

className={`macevo-depot-tab ${

    activeTab === "mes-depots" ? "is-active" : ""

}`}

onClick={() => handleTabChange("mes-depots")}

>

<FileCheck2 size={16} />

Mes dépôts

<span className="macevo-depot-tab-count">

    {publishedDocuments.length}

</span>

</button>

<button

type="button"

className={`macevo-depot-tab ${

    activeTab === "deposer" ? "is-active" : ""

}`}

onClick={() => handleTabChange("deposer")}

>

<UploadCloud size={16} />

       Déposer un document

      </button>

     </nav>

     {activeTab === "repository" && (

      <>

       <section className="macevo-depot-search-panel">

        <form

           className="macevo-depot-search-form"

           onSubmit={handleSearchSubmit}

        >

           <div className="macevo-depot-search-input-wrapper">

            <Search size={18} />

            <input

            type="search"

            value={searchInput}

            onChange={(event) =>

                setSearchInput(event.target.value)

            }

             placeholder="Rechercher par ID MACEVO, titre, auteur, domaine ou
institution..."

            className="macevo-depot-search-input"

            aria-label="Rechercher dans le repository scientifique"

            />

            {searchInput && (

            <button

      type="button"

      className="macevo-depot-clear-search"

      onClick={handleClearSearch}

      aria-label="Effacer la recherche"

    >

      <X size={15} />

    </button>

 )}

</div>

<button

 type="submit"

 className="macevo-depot-search-submit"

>

 <FileSearch size={17} />

 Rechercher

</button>

</form>

<div className="macevo-depot-filters">

<label htmlFor="document-type-filter">

 Type de document

</label>

<select

 id="document-type-filter"

 value={selectedType}

 onChange={handleTypeChange}

  className="macevo-depot-type-select"

 >

  <option value="">Tous les documents</option>

  {DOCUMENT_TYPES.map((type) => (

     <option

       key={type.value}

       value={type.value}

     >

       {type.label}

     </option>

  ))}

 </select>

</div>

</section>

<section>

<div className="macevo-depot-section-heading">

 <div>

  <h2>Documents scientifiques publics</h2>

  {searchQuery && (

     <span>

       Recherche : « {searchQuery} »

     </span>

  )}

 </div>

{!loadingRepository && (

 <span>

     {publicDocuments.length} document

     {publicDocuments.length > 1 ? "s" : ""}

 </span>

)}

</div>

{loadingRepository ? (

<div className="macevo-depot-state">

 <Loader2

     size={34}

     className="macevo-depot-spin"

     color="#2563eb"

 />

 <h3>Chargement du repository</h3>

 <p>

     MACEVO récupère les publications scientifiques

     actuellement disponibles.

 </p>

</div>

) : publicDocuments.length === 0 ? (

<div className="macevo-depot-state">

 <FileSearch

     size={42}

     className="macevo-depot-empty-icon"

 />

 <h3>Aucun document public</h3>

 <p>

  Aucun document scientifique ne correspond aux

  critères actuels.

 </p>

 {(searchQuery || selectedType) && (

  <button

      type="button"

      className="macevo-depot-retry"

      onClick={() => {

       setSearchInput("");

       setSearchQuery("");

       setSelectedType("");

      }}

  >

      Réinitialiser les filtres

  </button>

 )}

</div>

):(

<div className="macevo-depot-public-grid">

 {publicDocuments.map((document, index) => (

  <PublicDocumentCard

      key={

                getDocumentId(document) ||

                document?.id ||

                `public-${index}`

            }

            document={document}

            onOpen={setSelectedDocument}

           />

          ))}

      </div>

     )}

     </section>

 </>

)}

{activeTab === "mes-depots" && (

 <section>

     <div className="macevo-depot-section-heading">

     <div>

      <h2>Mes dépôts scientifiques</h2>

      <span>

          Documents associés à votre activité de dépôt

      </span>

     </div>

     </div>

     {loadingDeposits ? (

     <div className="macevo-depot-state">

      <Loader2

  size={34}

  className="macevo-depot-spin"

  color="#2563eb"

 />

 <h3>Chargement de vos dépôts</h3>

 <p>

  MACEVO récupère vos publications scientifiques.

 </p>

</div>

) : myDeposits.length === 0 ? (

<div className="macevo-depot-state">

 <FileCheck2

  size={42}

  className="macevo-depot-empty-icon"

 />

 <h3>Vous n'avez encore aucun dépôt</h3>

 <p>

  Votre mémoire peut être déposé directement depuis

  cet espace.

 </p>

 <button

  type="button"

  className="macevo-depot-publish-button"

  style={{ marginTop: 16 }}

  onClick={handleStartDeposit}

 >

  <Plus size={17} />

  Déposer mon mémoire

 </button>

</div>

):(

<div className="macevo-depot-my-grid">

 {myDeposits.map((deposit, index) => {

  const editorPath = getEditorPath(deposit);

  const publicId = getDocumentId(deposit);

  return (

      <article

      className="macevo-depot-my-card"

      key={

           publicId ||

           deposit?.id ||

           `my-deposit-${index}`

       }

      >

       <div className="macevo-depot-my-card-header">

           <h3>

            {getDocumentTitle(deposit)}

           </h3>

           <span className="macevo-depot-status">

     {getStatusLabel(

      deposit?.publication_status

     )}

 </span>

</div>

{publicId && (

 <div className="macevo-depot-my-id">

     ID MACEVO :{" "}

     <strong>{publicId}</strong>

 </div>

)}

<div className="macevo-depot-my-meta">

 <span>

     <FileText size={14} />

     {getTypeLabel(deposit?.document_type)}

 </span>

 <span>

     <BookOpen size={14} />

     {getField(deposit)}

 </span>

 <span>

     <Library size={14} />

     {getInstitution(deposit)}

 </span>

{deposit?.published_at && (

 <span>

     <Calendar size={14} />

     {formatDate(deposit.published_at)}

 </span>

)}

</div>

<div className="macevo-depot-my-actions">

{editorPath && (

 <button

     type="button"

     onClick={() =>

         handleOpenEditor(deposit)

     }

 >

     <FileText size={14} />

     Ouvrir

 </button>

)}

{publicId && (

 <button

     type="button"

     onClick={() =>

         setSelectedDocument(deposit)

     }

                 >

                     <Info size={14} />

                     Détails

                 </button>

                )}

                </div>

            </article>

           );

          })}

      </div>

     )}

 </section>

)}

{activeTab === "deposer" && (

 <section className="macevo-depot-workspace">

     <header className="macevo-depot-workspace-header">

      <div>

          <h2>Déposer un travail scientifique</h2>

          <p>

           Publiez votre mémoire ou votre autre travail

           scientifique dans le repository MACEVO.

          </p>

      </div>

      <button

          type="button"

          className="macevo-depot-back-button"

 onClick={() => {

    resetDeposit();

    setActiveTab("repository");

 }}

>

 <ArrowLeft size={15} />

 Repository

</button>

</header>

{depositStep <= 4 && (

<div className="macevo-depot-steps">

 {[1, 2, 3, 4].map((step) => (

    <div

      key={step}

      className={`macevo-depot-step ${

        depositStep === step ? "is-active" : ""

      } ${

        depositStep > step ? "is-complete" : ""

      }`}

    >

      <span className="macevo-depot-step-number">

        {depositStep > step ? (

         <Check size={14} />

        ):(

         step

        )}

      </span>

       <span>

           {step === 1

           ? "Document"

           : step === 2

           ? "Informations"

           : step === 3

           ? "Vérification"

           : "Autorisation"}

       </span>

      </div>

     ))}

 </div>

)}

{depositStep <= 4 && (

 <div className="macevo-depot-workspace-body">

     <div className="macevo-depot-workspace-title">

      <h3>{currentStepTitle}</h3>

      <p>

       Étape {depositStep} sur 4

      </p>

     </div>

     {depositStep === 1 && (

      <>

       {loadingReports ? (

 <div className="macevo-depot-state">

  <Loader2

   size={32}

   className="macevo-depot-spin"

   color="#2563eb"

  />

  <h3>

   Chargement de vos rapports

  </h3>

  <p>

   MACEVO recherche les documents que vous

   pouvez déposer.

  </p>

 </div>

) : reports.length === 0 ? (

 <div className="macevo-depot-state">

  <FileText

   size={42}

   className="macevo-depot-empty-icon"

  />

  <h3>

   Aucun rapport disponible

  </h3>

  <p>

  Créez d'abord votre mémoire ou votre rapport

  dans MACEVO, puis revenez ici pour le déposer

  dans le repository scientifique.

 </p>

 <button

  type="button"

  className="macevo-depot-publish-button"

  style={{ marginTop: 16 }}

  onClick={() =>

      navigate("/rapports/nouveau")

  }

 >

  <Plus size={17} />

  Créer un rapport

 </button>

</div>

):(

<div className="macevo-depot-report-list">

 {reports.map((report, index) => (

  <ReportSelectorCard

      key={

          getReportId(report) ||

          `report-${index}`

      }

      report={report}

      selected={

          getReportId(report) ===

                getReportId(selectedReport)

            }

            onSelect={handleSelectReport}

           />

          ))}

      </div>

     )}

 </>

)}

{depositStep === 2 && selectedReport && (

 <>

     <div className="macevo-depot-selected-document">

      <div className="macevo-depot-selected-document-icon">

          <FileText size={19} />

      </div>

      <div className="macevo-depot-selected-document-info">

          <strong>

           {selectedReport.title}

          </strong>

          <span>

           Document sélectionné pour le dépôt

          </span>

      </div>

     </div>

<div className="macevo-depot-form-grid">

<div className="macevo-depot-field full">

 <label htmlFor="deposit-title">

  Titre du document *

 </label>

 <input

  id="deposit-title"

  name="title"

  value={depositMetadata.title}

  onChange={handleMetadataChange}

 />

</div>

<div className="macevo-depot-field">

 <label htmlFor="deposit-type">

  Type de document *

 </label>

 <select

  id="deposit-type"

  value={documentType}

  onChange={(event) =>

      setDocumentType(event.target.value)

  }

 >

  {DOCUMENT_TYPES.map((type) => (

      <option

     key={type.value}

     value={type.value}

     >

     {type.label}

     </option>

 ))}

</select>

</div>

<div className="macevo-depot-field">

<label htmlFor="deposit-level">

 Niveau académique

</label>

<input

 id="deposit-level"

 name="academic_level"

 value={

     depositMetadata.academic_level

 }

 onChange={handleMetadataChange}

 placeholder="Licence, Master, Doctorat..."

/>

</div>

<div className="macevo-depot-field">

<label htmlFor="deposit-field">

 Domaine scientifique *

</label>

<input

 id="deposit-field"

 name="scientific_field"

 value={

     depositMetadata.scientific_field

 }

 onChange={handleMetadataChange}

 placeholder="Informatique, biologie..."

/>

</div>

<div className="macevo-depot-field">

<label htmlFor="deposit-language">

 Langue

</label>

<input

 id="deposit-language"

 name="language"

 value={depositMetadata.language}

 onChange={handleMetadataChange}

/>

</div>

<div className="macevo-depot-field">

<label htmlFor="deposit-institution">

 Université / Institution

</label>

<input

 id="deposit-institution"

 name="institution"

 value={

     depositMetadata.institution

 }

 onChange={handleMetadataChange}

/>

</div>

<div className="macevo-depot-field">

<label htmlFor="deposit-department">

 Faculté / Département

</label>

<input

 id="deposit-department"

 name="department"

 value={

     depositMetadata.department

 }

 onChange={handleMetadataChange}

/>

</div>

<div className="macevo-depot-field">

<label htmlFor="deposit-supervisor">

 Directeur / Encadreur

</label>

<input

 id="deposit-supervisor"

 name="supervisor"

 value={

     depositMetadata.supervisor

 }

 onChange={handleMetadataChange}

/>

</div>

<div className="macevo-depot-field">

<label htmlFor="deposit-year">

 Année académique

</label>

<input

 id="deposit-year"

 name="academic_year"

 value={

     depositMetadata.academic_year

 }

 onChange={handleMetadataChange}

 placeholder="2025-2026"

      />

     </div>

     <div className="macevo-depot-field full">

      <label htmlFor="deposit-summary">

       Résumé scientifique

      </label>

      <textarea

       id="deposit-summary"

       name="summary"

       value={depositMetadata.summary}

       onChange={handleMetadataChange}

       placeholder="Résumé du travail scientifique..."

      />

     </div>

     </div>

 </>

)}

{depositStep === 3 && selectedReport && (

 <>

     <div className="macevo-depot-review">

     <div className="macevo-depot-review-card full">

      <span>Titre</span>

      <strong>

       {depositMetadata.title}

      </strong>

</div>

<div className="macevo-depot-review-card">

<span>Type</span>

<strong>

 {getTypeLabel(documentType)}

</strong>

</div>

<div className="macevo-depot-review-card">

<span>Niveau</span>

<strong>

 {depositMetadata.academic_level ||

  "Non renseigné"}

</strong>

</div>

<div className="macevo-depot-review-card">

<span>Domaine</span>

<strong>

 {depositMetadata.scientific_field}

</strong>

</div>

<div className="macevo-depot-review-card">

<span>Institution</span>

<strong>

 {depositMetadata.institution ||

  "Non renseignée"}

</strong>

</div>

<div className="macevo-depot-review-card">

<span>Département</span>

<strong>

 {depositMetadata.department ||

  "Non renseigné"}

</strong>

</div>

<div className="macevo-depot-review-card">

<span>Encadreur</span>

<strong>

 {depositMetadata.supervisor ||

  "Non renseigné"}

</strong>

</div>

<div className="macevo-depot-review-card">

<span>Année</span>

<strong>

 {depositMetadata.academic_year ||

  "Non renseignée"}

</strong>

</div>

<div className="macevo-depot-review-card full">

    <span>Résumé</span>

    <p>

     {depositMetadata.summary ||

         "Aucun résumé renseigné."}

    </p>

</div>

</div>

<div

style={{

    marginTop: 16,

    padding: 13,

    borderRadius: 10,

    background: "#f8fafc",

    border: "1px solid #e2e8f0",

    display: "flex",

    gap: 9,

    alignItems: "flex-start",

}}

>

<Info

    size={17}

    style={{

     color: "#2563eb",

     flex: "0 0 auto",

    }}

/>

     <span

      style={{

         color: "#64748b",

         fontSize: 11,

         lineHeight: 1.6,

      }}

     >

      Vérifiez attentivement ces informations.

      Elles seront associées à votre dépôt

      scientifique public.

     </span>

     </div>

 </>

)}

{depositStep === 4 && selectedReport && (

 <div className="macevo-depot-consent">

     <div className="macevo-depot-consent-header">

     <div className="macevo-depot-consent-icon">

      <LockKeyhole size={19} />

     </div>

     <div>

      <h3>

         Autorisation de publication

      </h3>

 <p>

     Cette étape vous permet de décider

     explicitement si votre travail peut être

     rendu public dans le repository scientifique

     MACEVO.

 </p>

</div>

</div>

<label className="macevo-depot-consent-check">

<input

 type="checkbox"

 checked={consentAccepted}

 onChange={(event) =>

     setConsentAccepted(

         event.target.checked

     )

 }

/>

<span>

 J'autorise MACEVO à publier publiquement ce

 document scientifique dans son repository.

 Je confirme que je suis autorisé à déposer ce

 travail et que les informations fournies sont

 correctes.

</span>

</label>

      </div>

     )}

 </div>

)}

{depositStep <= 4 && (

 <footer className="macevo-depot-workspace-footer">

     <div className="macevo-depot-footer-left">

      {depositStep > 1 && (

          <button

           type="button"

           className="macevo-depot-action-secondary"

           onClick={handlePreviousStep}

           disabled={loadingAction}

          >

           <ArrowLeft size={15} />

           Précédent

          </button>

      )}

     </div>

     <div className="macevo-depot-footer-right">

      {depositStep < 4 ? (

          <button

           type="button"

           className="macevo-depot-action-primary"

           onClick={handleNextStep}

          >

     Continuer

     <ChevronRight size={16} />

 </button>

):(

 <button

     type="button"

     className="macevo-depot-action-primary"

     disabled={

         loadingAction || !consentAccepted

     }

     onClick={handlePublish}

 >

     {loadingAction ? (

         <>

          <Loader2

          size={16}

          className="macevo-depot-spin"

          />

          Publication...

         </>

     ):(

         <>

          <Send size={16} />

          Publier mon document

         </>

     )}

 </button>

)}

     </div>

 </footer>

)}

{depositStep === 5 && (

 <div className="macevo-depot-workspace-body">

     <div className="macevo-depot-final">

     <div className="macevo-depot-final-icon">

      <Check size={34} />

     </div>

     <h3>

      Publication enregistrée

     </h3>

     <p>

      Votre travail scientifique a été transmis au

      repository MACEVO. Son identifiant public permet

      désormais de le retrouver ultérieurement.

     </p>

     <div className="macevo-depot-final-id">

      <span>

       Identifiant scientifique MACEVO

      </span>

      <strong>

       {actionMessage.match(

     /MACEVO-[A-Z]+-\d{4}-\d+/i

    )?.[0] ||

     "Identifiant attribué par MACEVO"}

</strong>

</div>

<div

style={{

    display: "flex",

    gap: 9,

    flexWrap: "wrap",

    justifyContent: "center",

}}

>

<button

    type="button"

    className="macevo-depot-action-secondary"

    onClick={() => {

     resetDeposit();

     setActiveTab("mes-depots");

    }}

>

    <FileCheck2 size={15} />

    Voir mes dépôts

</button>

<button

    type="button"

                className="macevo-depot-action-primary"

                onClick={() => {

                   resetDeposit();

                   setActiveTab("repository");

                }}

               >

                <Library size={15} />

                Repository public

               </button>

              </div>

              </div>

          </div>

         )}

        </section>

    )}

 </div>

</main>

</div>

{selectedDocument && (

<div

 className="macevo-depot-modal-overlay"

 onMouseDown={(event) => {

    if (event.target === event.currentTarget) {

        setSelectedDocument(null);

    }

 }}

>

<div

className="macevo-depot-modal"

role="dialog"

aria-modal="true"

aria-labelledby="macevo-depot-document-title"

>

<header className="macevo-depot-modal-header">

    <div>

    <span>Dépôt scientifique MACEVO</span>

    <h2 id="macevo-depot-document-title">

        {getDocumentTitle(selectedDocument)}

    </h2>

    </div>

    <button

    type="button"

    className="macevo-depot-modal-close"

    onClick={() => setSelectedDocument(null)}

    aria-label="Fermer"

    >

    <X size={18} />

    </button>

</header>

<div className="macevo-depot-modal-content">

    {getDocumentId(selectedDocument) && (

    <div className="macevo-depot-modal-id">

     <span>ID public MACEVO</span>

     <strong>

     {getDocumentId(selectedDocument)}

     </strong>

 </div>

)}

<div className="macevo-depot-modal-grid">

 <div>

     <span>Auteur</span>

     <strong>

     {getAuthorName(selectedDocument)}

     </strong>

 </div>

 <div>

     <span>Type</span>

     <strong>

     {getTypeLabel(

      selectedDocument.document_type

     )}

     </strong>

 </div>

 <div>

     <span>Domaine scientifique</span>

     <strong>

     {getField(selectedDocument)}

</strong>

</div>

<div>

<span>Niveau académique</span>

<strong>

 {selectedDocument.academic_level ||

  "Non renseigné"}

</strong>

</div>

<div>

<span>Institution</span>

<strong>

 {getInstitution(selectedDocument)}

</strong>

</div>

<div>

<span>Langue</span>

<strong>

 {selectedDocument.language ||

  "Non renseignée"}

</strong>

</div>

<div>

<span>Publication</span>

  <strong>

   {selectedDocument.published_at

    ? formatDate(selectedDocument.published_at)

    : "Non renseignée"}

  </strong>

 </div>

 <div>

  <span>Consultations</span>

  <strong>

   {Number(

    selectedDocument.view_count || 0

   ).toLocaleString("fr-FR")}

  </strong>

 </div>

</div>

<section className="macevo-depot-modal-summary">

 <h3>Résumé</h3>

 <p>

  {getSummary(selectedDocument)}

 </p>

</section>

</div>

<footer className="macevo-depot-modal-footer">

<button

            type="button"

            className="macevo-depot-modal-secondary"

            onClick={() => setSelectedDocument(null)}

           >

            Fermer

           </button>

           {getEditorPath(selectedDocument) && (

            <button

                type="button"

                className="macevo-depot-modal-primary"

                onClick={() => {

                 const document = selectedDocument;

                 setSelectedDocument(null);

                 handleOpenEditor(document);

                }}

            >

                <FileText size={15} />

                Ouvrir dans l'éditeur

                <ChevronRight size={15} />

            </button>

           )}

          </footer>

          </div>

      </div>

     )}

 </div>

);

}

export default DepotScientifique;

