/**
 * Funcoes auxiliares para disparar a impressao de um PDF sem sair da tela atual.
 */

const ATRASO_LIMPEZA_MS = 60_000

export function imprimirIframe(iframe: HTMLIFrameElement | null): void {
  const janela = iframe?.contentWindow
  if (!janela) return
  janela.focus()
  janela.print()
}

export function imprimirUrlEmSegundoPlano(url: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }
  iframe.src = url
  document.body.appendChild(iframe)

  window.setTimeout(() => {
    iframe.remove()
    URL.revokeObjectURL(url)
  }, ATRASO_LIMPEZA_MS)
}
