const escapeLatex = (value) => {
  const replacements = {
    "\\": "\\textbackslash{}",
    "{": "\\{",
    "}": "\\}",
    "$": "\\$",
    "&": "\\&",
    "#": "\\#",
    "_": "\\_",
    "%": "\\%",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
  };

  return String(value ?? "").replace(/[\\{}$&#_%~^]/g, (character) => replacements[character]);
};

const conversationMessages = (conversation) =>
  (Array.isArray(conversation?.messages) ? conversation.messages : [])
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? "").trim(),
      attachment: message.attachment_name || "",
    }))
    .filter((message) => message.content || message.attachment);

const formatPlainText = (title, messages) =>
  [title, "=".repeat(Math.max(12, title.length)), "", ...messages.flatMap((message) => [
    message.role === "user" ? "Étudiant" : "MACEVO IA",
    message.content || "",
    message.attachment ? `Pièce jointe : ${message.attachment}` : "",
    "",
  ])].join("\n").trim() + "\n";

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export async function exportAssistantConversation(conversation, format) {
  const title = String(conversation?.title || "Conversation MACEVO").trim();
  const safeTitle = title.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 90) || "conversation-macevo";
  const messages = conversationMessages(conversation);

  if (!messages.length) {
    throw new Error("Cette conversation ne contient aucun message à exporter.");
  }

  if (format === "txt") {
    saveBlob(new Blob([formatPlainText(title, messages)], { type: "text/plain;charset=utf-8" }), `${safeTitle}.txt`);
    return;
  }

  if (format === "md") {
    const markdown = `# ${title}\n\n${messages.map((message) =>
      `## ${message.role === "user" ? "Étudiant" : "MACEVO IA"}\n\n${message.content}${message.attachment ? `\n\n_Pièce jointe : ${message.attachment}_` : ""}`
    ).join("\n\n---\n\n")}\n`;
    saveBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `${safeTitle}.md`);
    return;
  }

  if (format === "tex") {
    const body = messages.map((message) =>
      `\\subsection*{${message.role === "user" ? "Étudiant" : "MACEVO IA"}}\n${escapeLatex(message.content).replace(/\r?\n/g, "\\\\\n")}${message.attachment ? `\n\\par\\textit{Pièce jointe : ${escapeLatex(message.attachment)}}` : ""}`
    ).join("\n\n");
    const latex = [
      "\\documentclass[12pt,a4paper]{article}",
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage[T1]{fontenc}",
      "\\usepackage[french]{babel}",
      "\\usepackage{geometry}",
      "\\geometry{margin=2.5cm}",
      "\\usepackage{parskip}",
      "\\begin{document}",
      `\\section*{${escapeLatex(title)}}`,
      body,
      "\\end{document}",
      "",
    ].join("\n");
    saveBlob(new Blob([latex], { type: "application/x-tex;charset=utf-8" }), `${safeTitle}.tex`);
    return;
  }

  if (format === "docx") {
    const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
    const sections = [new Paragraph({ text: title, heading: HeadingLevel.TITLE })];
    for (const message of messages) {
      sections.push(new Paragraph({ text: message.role === "user" ? "Étudiant" : "MACEVO IA", heading: HeadingLevel.HEADING_2 }));
      if (message.content) sections.push(new Paragraph({ children: [new TextRun(message.content)] }));
      if (message.attachment) sections.push(new Paragraph({ children: [new TextRun({ text: `Pièce jointe : ${message.attachment}`, italics: true })] }));
    }
    const document = new Document({ sections: [{ children: sections }] });
    saveBlob(await Packer.toBlob(document), `${safeTitle}.docx`);
    return;
  }

  if (format === "pdf") {
    const html2pdf = (await import("html2pdf.js")).default;
    const article = document.createElement("article");
    article.style.cssText = "position:fixed;left:-10000px;top:0;width:720px;padding:48px;background:#fff;color:#172033;font:14px/1.65 Arial,sans-serif;white-space:normal";
    const heading = document.createElement("h1");
    heading.textContent = title;
    heading.style.cssText = "font-size:24px;margin:0 0 28px;color:#172554";
    article.appendChild(heading);
    for (const message of messages) {
      const label = document.createElement("h2");
      label.textContent = message.role === "user" ? "Étudiant" : "MACEVO IA";
      label.style.cssText = "font-size:15px;margin:22px 0 8px;color:#1d4ed8";
      const content = document.createElement("p");
      content.textContent = message.content || "";
      content.style.cssText = "white-space:pre-wrap;margin:0 0 10px";
      article.append(label, content);
      if (message.attachment) {
        const attachment = document.createElement("p");
        attachment.textContent = `Pièce jointe : ${message.attachment}`;
        attachment.style.cssText = "color:#64748b;font-style:italic";
        article.appendChild(attachment);
      }
    }
    document.body.appendChild(article);
    try {
      await html2pdf().set({
        margin: 12,
        filename: `${safeTitle}.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      }).from(article).save();
    } finally {
      article.remove();
    }
    return;
  }

  throw new Error("Format d’export non pris en charge.");
}
