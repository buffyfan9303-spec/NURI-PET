/**
 * Platform boundary (CLAUDE.md §7.1) — export / backup.
 * Web implementation triggers a Blob download. A future Tauri target swaps
 * this for filesystem writes; UI code only touches the interface.
 */
export interface FileAdapter {
  download(filename: string, content: string, mime?: string): void
}

export const fileAdapter: FileAdapter = {
  download(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
