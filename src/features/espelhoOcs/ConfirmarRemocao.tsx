interface Props {
  quantidade: number
  numeroGuia?: string
  erro: string | null
  removendo: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ConfirmarRemocao({ quantidade, numeroGuia, erro, removendo, onConfirmar, onCancelar }: Props) {
  const texto =
    quantidade === 1 && numeroGuia
      ? `Remover a guia nº ${numeroGuia} do espelho? Ela volta para Guias Finalizadas e pode ser adicionada de novo.`
      : `Remover as ${quantidade} guias selecionadas do espelho? Elas voltam para Guias Finalizadas e podem ser adicionadas de novo.`

  return (
    <div className="ee-confirmacao" role="dialog" aria-label="Confirmar remoção">
      <p>{texto}</p>
      {erro && (
        <p role="alert" className="estado-erro">
          {erro}
        </p>
      )}
      <div className="ee-acoes">
        <button type="button" className="botao botao-primario" disabled={removendo} onClick={onConfirmar}>
          {removendo ? 'Removendo…' : 'Sim, remover'}
        </button>
        <button type="button" className="botao" disabled={removendo} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
