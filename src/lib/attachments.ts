"use client";

/**
 * Files people attach in the IBAX chats (app and website): photos are shrunk in the browser
 * (max 1600 px, JPEG) so they upload fast, PDFs are sent as they are (up to MAX_PDF), and
 * plain-text files are read as text. Word and Excel files need saving as PDF first.
 */

export type Attachment = {
  kind: "image" | "pdf" | "text";
  name: string;
  mime: string;
  /** base64 (image, pdf) or the file's text (text). */
  data: string;
  /** Small preview for the chat (images only). */
  thumb?: string;
};

export const MAX_PDF = 3 * 1024 * 1024;
const MAX_TEXT = 60_000;
export const acceptFiles = "image/*,application/pdf,.pdf,.txt,.csv,.md,.json,text/plain,text/csv";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("bad image"));
    img.src = url;
  });
}

function draw(img: HTMLImageElement, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

const base64Of = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export async function readAttachment(file: File): Promise<Attachment | { error: string }> {
  const name = file.name || "file";
  if (file.type.startsWith("image/")) {
    try {
      const img = await loadImage(file);
      return { kind: "image", name, mime: "image/jpeg", data: draw(img, 1600, 0.85).replace(/^data:[^,]*,/, ""), thumb: draw(img, 320, 0.7) };
    } catch {
      return { error: "Ye photo khul nahi rahi. JPG ya PNG photo bhejiye." };
    }
  }
  if (file.type === "application/pdf" || /\.pdf$/i.test(name)) {
    if (file.size > MAX_PDF) return { error: "PDF 3 MB se chhota hona chahiye (lagbhag 20 page). Chhota PDF bhejiye." };
    return { kind: "pdf", name, mime: "application/pdf", data: await base64Of(file) };
  }
  if (file.type.startsWith("text/") || /\.(txt|csv|md|json)$/i.test(name)) {
    const text = (await file.text()).slice(0, MAX_TEXT);
    return { kind: "text", name, mime: "text/plain", data: text };
  }
  if (/\.(docx?|xlsx?|pptx?)$/i.test(name)) return { error: "Word / Excel file ko pehle PDF me save karke bhejiye (File → Save as → PDF)." };
  return { error: "Photo, PDF ya text file bhejiye." };
}
