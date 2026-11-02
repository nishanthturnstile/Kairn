export function escapeHTML(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character,
  );
}
export function serializeData(value: unknown) {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
export function readerDocument(input: {
  title: string;
  html: string;
  data: { marker: string };
  script: string;
  styles: string[];
  preloads: string[];
}) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><title>${escapeHTML(input.title)}</title>${input.styles.map((file) => `<link rel="stylesheet" href="${escapeHTML(file)}">`).join("")}${input.preloads.map((file) => `<link rel="modulepreload" href="${escapeHTML(file)}">`).join("")}</head><body><div id="reader-root">${input.html}</div><script id="reader-data" type="application/json">${serializeData(input.data)}</script><script type="module" src="${escapeHTML(input.script)}"></script></body></html>`;
}
