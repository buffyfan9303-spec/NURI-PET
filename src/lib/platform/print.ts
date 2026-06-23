/**
 * Platform boundary (CLAUDE.md §7.1) — receipt / care-card printing.
 * Web implementation uses a dedicated print window. A future Tauri target
 * swaps this adapter for a native command; UI code only touches the interface.
 */
export interface PrintAdapter {
  printDocument(title: string, bodyHtml: string): void
}

export const printAdapter: PrintAdapter = {
  printDocument(title, bodyHtml) {
    const w = window.open('', '_blank', 'width=420,height=640')
    if (!w) return
    w.document.write(
      `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>` +
        `<style>body{font-family:'Pretendard',sans-serif;padding:24px;color:#111}</style></head>` +
        `<body>${bodyHtml}</body></html>`,
    )
    w.document.close()
    w.focus()
    w.print()
  },
}
