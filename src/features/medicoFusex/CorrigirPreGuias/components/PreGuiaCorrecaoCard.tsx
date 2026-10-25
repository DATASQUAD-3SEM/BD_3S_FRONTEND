import type { PreGuiaParaCorrigir } from '../types'
import { formatarData, formatarPrecCp } from '../formatadores'

interface Props {
  preGuia: PreGuiaParaCorrigir
  onCorrigir: (id: number) => void
}

export default function PreGuiaCorrecaoCard({ preGuia, onCorrigir }: Props) {
  return (
    <article className="cp-card" aria-label={`Pré-guia ${preGuia.numero}`}>
      <header className="cp-card__topo">
        <div>
          <h2>
            Pré-guia {preGuia.numero} · {preGuia.beneficiarioNome}
          </h2>
          <p className="cp-card__meta">
            Prec CP {formatarPrecCp(preGuia.precCp)} · {preGuia.ocsNome} · criada por você em{' '}
            {formatarData(preGuia.dataCriacao)}
          </p>
        </div>
        <span className="badge badge-atencao">Atenção</span>
      </header>

      <div className="cp-observacao">
        <strong>Observação do setor de Guias</strong>
        <p>{preGuia.observacao}</p>
      </div>

      <div className="cp-card__acoes">
        <button
          type="button"
          className="botao botao-atencao"
          onClick={() => onCorrigir(preGuia.id)}
        >
          Corrigir
        </button>
      </div>
    </article>
  )
}
