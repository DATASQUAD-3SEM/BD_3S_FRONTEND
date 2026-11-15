interface Props {
  enviando: boolean
  erro: string | null
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ConfirmarEnvio({ enviando, erro, onConfirmar, onCancelar }: Props) {
  return (
    <div className="ee-confirmacao" role="dialog" aria-label="Confirmar envio ao FUSEX">
      <p>
        Depois de enviado, este espelho não poderá mais ser editado, nem ter guias removidas ou adicionadas. Tem
        certeza que deseja enviar?
      </p>
      {erro && (
        <p role="alert" className="estado-erro">
          {erro}
        </p>
      )}
      <div className="ee-acoes">
        <button type="button" className="botao botao-primario" disabled={enviando} onClick={onConfirmar}>
          {enviando ? 'Enviando…' : 'Sim, enviar para o FUSEX'}
        </button>
        <button type="button" className="botao" disabled={enviando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
