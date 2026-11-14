/** 内联 SVG 图标，避免依赖 emoji 字体。 */
export const ICONS = {
  sound: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M16 9l5 6M21 9l-5 6"/></svg>`,
  hint: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5V15h8v-1.5A6 6 0 0 0 12 3z"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></svg>`,
  card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 9.5h6M7 13h10M7 16h4"/></svg>`,
  flip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 8a8 8 0 0 1 13.5-3"/><path d="M20 16a8 8 0 0 1-13.5 3"/><path d="M17 3v4h-4"/><path d="M7 21v-4h4"/></svg>`,
} as const;

export function icon(name: keyof typeof ICONS, cls = ''): string {
  return `<span class="icon ${cls}">${ICONS[name]}</span>`;
}
