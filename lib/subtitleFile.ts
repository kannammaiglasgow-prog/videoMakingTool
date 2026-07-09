export function escapeDrawtext(text: string): string {
  return text.replace(/\\/g, "\\\\\\\\").replace(/:/g, "\\:").replace(/'/g, "’");
}
