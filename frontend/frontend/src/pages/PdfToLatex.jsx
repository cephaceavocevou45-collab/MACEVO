import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Download, FileArchive, FileCode2, FileUp, LoaderCircle, RotateCcw, ScanText, Share2, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

async function getRequestErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text());
      return body.detail || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.detail || error?.message || fallback;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PdfToLatex() {
  const inputRef = useRef(null);
  const shareLinkInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");

  const selectFile = (candidate) => {
    setError("");
    setMessage("");
    setResult(null);
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Choisissez un fichier PDF.");
    } else if (candidate.size <= 0 || candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Le PDF doit \u00eatre valide et ne pas d\u00e9passer 20 Mo.");
    } else {
      setFile(candidate);
    }
  };

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    const payload = new FormData();
    payload.append("file", file);
    try {
      const response = await api.post("word-to-latex/pdf-to-latex/convert/", payload);
      setResult(response.data);
    } catch (requestError) {
      const data = requestError?.response?.data;
      const detail = data?.detail || data?.file?.[0] || data?.non_field_errors?.[0];
      setError(detail || "La conversion a \u00e9chou\u00e9. V\u00e9rifiez le PDF et r\u00e9essayez.");
    } finally {
      setBusy(false);
    }
  };

  const getArchive = async () => {
    if (!file) throw new Error("Le PDF source n'est plus disponible.");
    const payload = new FormData();
    payload.append("file", file);
    const response = await api.post(
      "word-to-latex/pdf-to-latex/archive/",
      payload,
      { responseType: "blob" }
    );
    if (!(response.data instanceof Blob) || response.data.size === 0) {
      throw new Error("Le serveur n'a pas retourne une archive ZIP valide.");
    }
    return response.data;
  };

  const getBaseName = () => file?.name.replace(/\.pdf$/i, "") || "document";

  const downloadTex = () => {
    if (!result?.latex_code) return;
    saveBlob(
      new Blob([result.latex_code], { type: "application/x-tex;charset=utf-8" }),
      getBaseName() + ".tex"
    );
  };

  const downloadArchive = async () => {
    if (!result || archiveBusy) return;
    setArchiveBusy(true);
    setError("");
    setMessage("");
    try {
      const archive = await getArchive();
      saveBlob(archive, getBaseName() + "-latex.zip");
      setMessage("Archive Overleaf t\u00e9l\u00e9charg\u00e9e.");
    } catch (archiveError) {
      setError(await getRequestErrorMessage(archiveError, "La creation de l'archive a echoue."));
    } finally {
      setArchiveBusy(false);
    }
  };

  const share = async (type) => {
    if (!result || archiveBusy) return;
    setArchiveBusy(true);
    setError("");
    setMessage("");
    setShareUrl("");
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("file_type", type);
      const response = await api.post(
        "word-to-latex/pdf-to-latex/share/",
        payload
      );
      setShareUrl(response.data.share_url);
      setShareExpiry(response.data.expires_at);
      setMessage("Lien de partage cree. Toute personne qui le possede peut telecharger le fichier pendant 7 jours.");
    } catch (shareError) {
      setError(await getRequestErrorMessage(shareError, "Impossible de creer le lien de partage."));
    } finally {
      setArchiveBusy(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Lien copie dans le presse-papiers.");
    } catch {
      shareLinkInputRef.current?.focus();
      shareLinkInputRef.current?.select();
      setMessage("Le lien est selectionne. Copiez-le avec Ctrl+C.");
    }
  };

  const shareLinkWithBrowser = async () => {
    if (!shareUrl) return;
    try {
      if (typeof navigator.share !== "function") {
        await copyShareLink();
        return;
      }
      await navigator.share({
        title: "Fichier LaTeX MACEVO",
        text: "Lien de partage temporaire MACEVO",
        url: shareUrl,
      });
      setMessage("Le lien a ete transmis au menu de partage.");
    } catch (shareError) {
      if (shareError?.name === "AbortError") return;
      await copyShareLink();
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    setMessage("");
    setShareUrl("");
    setShareExpiry("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
      <Navbar />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-600/20"><FileCode2 size={25} /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Outils documentaires</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">PDF vers LaTeX</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Importez un PDF pour extraire le texte, d&eacute;tecter les titres et cr&eacute;er des fichiers utilisables dans Overleaf.</p>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center gap-3"><ScanText className="text-indigo-600" size={20} /><h2 className="font-semibold">Importer le document</h2></div>
              <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
              <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }} className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-indigo-950/20">
                <span className="mb-3 rounded-xl bg-white p-3 text-indigo-600 shadow-sm dark:bg-slate-900"><FileUp size={23} /></span>
                <span className="text-sm font-semibold">{file?.name || "Choisir ou d\u00e9poser un PDF"}</span>
                <span className="mt-1 text-xs text-slate-500">PDF jusqu&apos;&agrave; 20 Mo - maximum 100 pages</span>
              </button>
              {file && <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-950"><span className="truncate">{file.name}</span><button className="ml-3 text-slate-500 hover:text-rose-600" onClick={reset}>Retirer</button></div>}
              {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertTriangle size={18} className="shrink-0" />{error}</div>}
              {message && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
              <button type="button" disabled={!file || busy} onClick={convert} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? <><LoaderCircle size={17} className="animate-spin" /> Analyse du PDF...</> : <><FileCode2 size={17} /> G&eacute;n&eacute;rer le LaTeX</>}
              </button>
              <p className="mt-4 text-xs leading-5 text-slate-500">Les PDF numerises passent par l'OCR si le moteur et la langue sont disponibles.</p>
            </section>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div><h2 className="font-semibold">Transcription LaTeX &eacute;ditable</h2><p className="mt-1 text-xs text-slate-500">Pour reproduire la mise en page du PDF, importez le ZIP Overleaf et compilez main.tex.</p></div>
                {result && <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={downloadTex} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-600"><Download size={15} /> .tex &eacute;ditable</button>
                  <button type="button" disabled={archiveBusy} onClick={downloadArchive} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200"><FileArchive size={15} /> {archiveBusy ? "Preparation..." : "ZIP Overleaf"}</button>
                  <button type="button" disabled={archiveBusy} onClick={() => share("latex")} title="Creer un lien temporaire pour la transcription LaTeX editable" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200"><Share2 size={15} /> {archiveBusy ? "Creation..." : "Partager .tex editable"}</button>
                  <button type="button" disabled={archiveBusy} onClick={() => share("zip")} title="Creer un lien temporaire pour le projet complet" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200"><Share2 size={15} /> {archiveBusy ? "Creation..." : "Partager ZIP"}</button>
                </div>}
              </div>
              {result ? <>
                <div className="flex flex-wrap gap-2 px-5 py-3 text-xs">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="mr-1 inline" size={14} /> Conversion termin&eacute;e</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{result.pages_count} pages</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{result.words_count} mots</span>
                  {result.ocr_used && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">OCR appliqu&eacute;</span>}
                </div>
                <pre className="max-h-[520px] overflow-auto border-y border-slate-200 bg-slate-950 p-5 text-xs leading-6 text-slate-200 dark:border-slate-800"><code>{result.latex_code}</code></pre>
                <div className="space-y-2 p-5">{(result.notes || []).map((note) => <p key={note} className="flex gap-2 text-xs leading-5 text-slate-500"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />{note}</p>)}</div>
                <button type="button" onClick={reset} className="mb-5 ml-5 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"><RotateCcw size={14} /> Nouvelle conversion</button>
              </> : <div className="grid min-h-[440px] place-items-center p-8 text-center"><div className="max-w-sm"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><FileCode2 size={25} /></div><p className="font-medium text-slate-700 dark:text-slate-200">Votre source apparaitra ici</p><p className="mt-2 text-sm leading-6 text-slate-500">Importez un PDF puis lancez la generation pour visualiser et telecharger le code.</p></div></div>}
            </section>
          </div>
        </div>
      </main>
      </div>
      {shareUrl && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShareUrl(""); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="share-link-title" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id="share-link-title" className="text-lg font-semibold">Lien de partage cree</h2><p className="mt-1 text-sm leading-6 text-slate-500">Toute personne ayant ce lien peut telecharger le fichier, sans se connecter. Le lien expire apres 7 jours.</p></div>
            <button type="button" aria-label="Fermer" onClick={() => setShareUrl("")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
          </div>
          <label className="mt-5 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor="pdf-latex-share-link">Lien temporaire</label>
          <input ref={shareLinkInputRef} id="pdf-latex-share-link" readOnly value={shareUrl} onFocus={(event) => event.target.select()} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
          {shareExpiry && <p className="mt-2 text-xs text-slate-500">Expiration : {new Date(shareExpiry).toLocaleString()}</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setShareUrl("")} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Fermer</button>
            <button type="button" onClick={copyShareLink} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"><Copy size={16} /> Copier le lien</button>
            <button type="button" onClick={shareLinkWithBrowser} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Share2 size={16} /> Partager le lien</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
