import { useState } from 'react'
import { formatarData } from '../../shared/utils/formatadores'
import PainelAdicionarGuia from './PainelAdicionarGuia'
import VisualizadorPdf from './VisualizadorPdf'
import { rotuloSituacao } from './formatadores'
import type { GuiaFinalizada } from './types'

interface Props {
  guia: GuiaFinalizada
  onAlterado: () => void
}

export default function CartaoGuiaFinalizada({ guia, onAlterado }: Props) {
  const [painelAberto, setPainelAberto] = useState(false)
  const [pdfAberto, setPdfAberto] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})

  function alterarValor(codDgp: string, texto: string) {
    setValores((atuais) => ({ ...atuais, [codDgp]: texto }))
  }

  function cancelar() {
    setPainelAberto(false)
    setValores({})
  }

  function enviado() {
    setPainelAberto(false)
    setValores({})
    onAlterado()
  }

  return (
    <article className="ge-cartao" aria-labelledby={`guia-${guia.id}`}>
      <header>
        <h2 id={`guia-${guia.id}`}>{`Guia nº ${guia.numero}`}</h2>
        <p className="ge-cabecalho-detalhe">
          {`${guia.beneficiario.nome} · ${rotuloSituacao(guia.situacao)} · Envio em ${formatarData(guia.dataEnvio)}`}
        </p>
      </header>

      <ul className="ge-procedimentos">
        {guia.procedimentos.map((procedimento) => (
          <li key={procedimento.codDgp}>
            {`${procedimento.codDgp} · ${procedimento.descricao} · ${procedimento.quantidade} ${
              procedimento.quantidade === 1 ? 'sessão' : 'sessões'
            }`}
          </li>
        ))}
      </ul>

      <div className="ge-acoes">
        {guia.vinculo === 'DISPONIVEL' && !painelAberto && (
          <button type="button" className="botao botao-primario" onClick={() => setPainelAberto(true)}>
            Adicionar para o espelho
          </button>
        )}
        {guia.vinculo === 'EM_CONSTRUCAO' && (
          <span className="ge-vinculo">{`Já no espelho em construção (nº ${guia.idEspelho})`}</span>
        )}
        {guia.vinculo === 'ENVIADA' && (
          <span className="ge-vinculo">{`Já enviada ao FUSEX (espelho nº ${guia.idEspelho})`}</span>
        )}
        <button
          type="button"
          className="botao"
          aria-expanded={pdfAberto}
          onClick={() => setPdfAberto((aberto) => !aberto)}
        >
          Ver guia (PDF)
        </button>
      </div>

      {guia.vinculo === 'DISPONIVEL' && painelAberto && (
        <PainelAdicionarGuia
          guia={guia}
          valores={valores}
          onAlterarValor={alterarValor}
          onCancelar={cancelar}
          onEnviado={enviado}
        />
      )}

      {pdfAberto && (
        <VisualizadorPdf guiaId={guia.id} numero={guia.numero} onFechar={() => setPdfAberto(false)} />
      )}
    </article>
  )
}
