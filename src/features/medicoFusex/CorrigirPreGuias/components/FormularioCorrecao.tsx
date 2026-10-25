import { useRef, useState } from 'react'
import type { CorrecaoApi, DetalheCorrecao, OcsResumo, ProcedimentoResumo } from '../correcaoTipos'
import { mensagemDeErro, statusDoErro } from '../../../../shared/api/erros'
import { formatarData } from '../../../../shared/utils/formatadores'
import BeneficiarioCard from './BeneficiarioCard'
import ExamesCard from './ExamesCard'
import OcsCard from './OcsCard'

/**
 * Formulario da correcao do medico (T14-FE2): reune os cartoes de OCS e exames e envia a correcao.
 * Bloqueia duplo clique durante o envio, pede confirmacao ao cancelar com alteracoes e trata o 409
 * (pre-guia ja alterada por outra pessoa).
 */

interface Props {
  detalhe: DetalheCorrecao
  api: CorrecaoApi
  onCancelar: () => void
  onSalvo: (mensagem: string) => void
}

const MSG_409 = 'Esta pré-guia já foi alterada. Atualize a lista e confira a situação atual.'

function mesmosCodigos(a: ProcedimentoResumo[], b: ProcedimentoResumo[]): boolean {
  if (a.length !== b.length) return false
  const codigos = new Set(b.map((p) => p.codigoTuss))
  return a.every((p) => codigos.has(p.codigoTuss))
}

export default function FormularioCorrecao({ detalhe, api, onCancelar, onSalvo }: Props) {
  const [ocs, setOcs] = useState<OcsResumo>(detalhe.ocsAtual)
  const [exames, setExames] = useState<ProcedimentoResumo[]>(detalhe.procedimentos)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const enviandoRef = useRef(false)

  const ocsMudou = ocs.id !== detalhe.ocsAtual.id
  const examesMudaram = !mesmosCodigos(exames, detalhe.procedimentos)
  const alterado = ocsMudou || examesMudaram

  function adicionarExame(procedimento: ProcedimentoResumo) {
    setExames((atual) =>
      atual.some((e) => e.codigoTuss === procedimento.codigoTuss) ? atual : [...atual, procedimento],
    )
  }

  function removerExame(codigoTuss: string) {
    setExames((atual) => (atual.length <= 1 ? atual : atual.filter((e) => e.codigoTuss !== codigoTuss)))
  }

  function cancelar() {
    if (alterado && !window.confirm('Descartar as alterações feitas nesta correção?')) return
    onCancelar()
  }

  async function salvar() {
    if (enviandoRef.current || exames.length === 0) return
    enviandoRef.current = true
    setEnviando(true)
    setErro(null)
    try {
      await api.salvarCorrecao(detalhe.id, {
        ocsId: ocsMudou ? ocs.id : undefined,
        procedimentos: exames.map((e) => e.codigoTuss),
      })
      onSalvo(`Pré-guia ${detalhe.numero} corrigida e reenviada ao setor de Guias.`)
    } catch (e) {
      setErro(statusDoErro(e) === 409 ? MSG_409 : mensagemDeErro(e, 'Não foi possível salvar a correção. Tente novamente.'))
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  return (
    <section className="pgd" aria-labelledby="pgd-titulo">
      <header className="pgd__cabecalho">
        <h1 id="pgd-titulo">Corrigir pré-guia {detalhe.numero}</h1>
        <span className="badge badge-atencao">Atenção</span>
      </header>

      {erro && (
        <p role="alert" className="pgd__alerta">
          {erro}
        </p>
      )}

      <section className="pgd__cartao" aria-labelledby="pgd-observacao">
        <h2 id="pgd-observacao">Observação do setor de Guias</h2>
        <div className="pgd__observacao">
          <p>{detalhe.observacao.texto}</p>
        </div>
        <p className="pgd__ajuda">Registrada em {formatarData(detalhe.observacao.dataRegistro)}</p>
      </section>

      <BeneficiarioCard beneficiario={detalhe.beneficiario} />

      <OcsCard selecionada={ocs} api={api} onSelecionar={setOcs} />

      <ExamesCard
        exames={exames}
        api={api}
        onAdicionar={adicionarExame}
        onRemover={removerExame}
      />

      <div className="pgd__acoes">
        <button
          type="button"
          className="botao botao-primario"
          disabled={enviando || exames.length === 0}
          onClick={() => void salvar()}
        >
          {enviando ? 'Enviando...' : 'Salvar correção e reenviar'}
        </button>
        <button type="button" className="botao" disabled={enviando} onClick={cancelar}>
          Cancelar
        </button>
      </div>
      <p className="pgd__nota">
        Depois de salva, a pré-guia volta ao setor de Guias como Pendente e sai desta aba.
      </p>
    </section>
  )
}
