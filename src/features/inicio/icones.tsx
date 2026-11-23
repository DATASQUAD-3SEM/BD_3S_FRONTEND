/** Ícones de traço (24x24) das páginas Início. Decorativos: quem usa marca o contêiner com aria-hidden. */

export type NomeIcone =
  | 'mais'
  | 'alerta'
  | 'relogio'
  | 'enviar'
  | 'assinatura'
  | 'documento'
  | 'guia'
  | 'pessoa'
  | 'caneta'

const CAMINHOS: Record<NomeIcone, string[]> = {
  mais: ['M12 5v14', 'M5 12h14'],
  alerta: ['M12 3 2.5 20h19L12 3z', 'M12 10v4', 'M12 17h.01'],
  relogio: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  enviar: ['M4 12 20 4l-6 16-3-7-7-1z', 'M11 13l9-9'],
  assinatura: ['M3 17c3 0 4-6 6-6s1 6 3 6 2-3 4-3 2 3 5 3', 'M3 21h18'],
  documento: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6', 'M10 17h6'],
  guia: ['M4 5h16v14H4z', 'M8 9h8', 'M8 13h5', 'M15 15l1.5 1.5L19 14'],
  pessoa: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 4-6 8-6s8 2 8 6'],
  caneta: ['M4 20l4-1 11-11-3-3L5 16l-1 4z', 'M14 6l3 3'],
}

export function Icone({ nome }: { nome: NomeIcone }) {
  return (
    <svg
      className="icone"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {CAMINHOS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
