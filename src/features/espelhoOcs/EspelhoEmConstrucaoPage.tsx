import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EmConstrucao from '../../shared/components/EmConstrucao'
import { mensagemDeErro } from '../../shared/api/erros'
import CartaoGuiaEspelho from './CartaoGuiaEspelho'
import ConfirmarRemocao from './ConfirmarRemocao'
import { espelhoApi } from './api'
import { formatarMoeda } from './formatadores'
import { agruparPorGuia } from './modeloEspelho'
import type { Espelho, ValorProcedimento } from './types'
import './espelhoEmConstrucao.css'

type Estado = 'carregando' | 'pronto' | 'indisponivel' | 'erro'

export default function EspelhoEmConstrucaoPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<Estado>('carregando')
  const [espelho, setEspelho] = useState<Espelho | null>(null)
  const [selecionadas, setSelecionadas] = useState<number[]>([])
  const [editandoGuiaId, setEditandoGuiaId] = useState<number | null>(null)
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [erroRemocao, setErroRemocao] = useState<string | null>(null)
  const [envioSolicitado, setEnvioSolicitado] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    espelhoApi
      .buscarEmConstrucao()
      .then((resposta) => {
        if (cancelado) return
        setEspelho(resposta)
        setEstado(resposta.id !== null && resposta.itens.length > 0 ? 'pronto' : 'indisponivel')
      })
      .catch(() => {
        if (cancelado) return
        setEstado('erro')
      })
    return () => {
      cancelado = true
    }
  }, [tentativa])

  function tentarNovamente() {
    setEstado('carregando')
    setTentativa((n) => n + 1)
  }

  const grupos = espelho ? agruparPorGuia(espelho.itens) : []
  const guiaUnica = selecionadas.length === 1 ? grupos.find((grupo) => grupo.guiaId === selecionadas[0]) : undefined

  function alternarSelecao(guiaId: number) {
    setSelecionadas((atuais) =>
      atuais.includes(guiaId) ? atuais.filter((id) => id !== guiaId) : [...atuais, guiaId],
    )
    setEditandoGuiaId(null)
  }

  function abrirRemocao() {
    setErroRemocao(null)
    setConfirmandoRemocao(true)
  }

  function cancelarRemocao() {
    setConfirmandoRemocao(false)
    setErroRemocao(null)
  }

  async function confirmarRemocao() {
    setErroRemocao(null)
    setRemovendo(true)
    try {
      const atualizado = await espelhoApi.removerGuias(selecionadas)
      setConfirmandoRemocao(false)
      setSelecionadas([])
      setEditandoGuiaId(null)
      if (atualizado.id === null || atualizado.itens.length === 0) {
        navigate('/ocs/espelho', { replace: true })
        return
      }
      setEspelho(atualizado)
    } catch (falha) {
      setErroRemocao(mensagemDeErro(falha, 'Não foi possível remover as guias do espelho.'))
    } finally {
      setRemovendo(false)
    }
  }

  async function salvarValores(guiaId: number, valores: ValorProcedimento[]) {
    const atualizado = await espelhoApi.editarValores(guiaId, valores)
    setEspelho(atualizado)
    setEditandoGuiaId(null)
  }

  return (
    <section className="ee-pagina">
      <h1>Espelho em construção</h1>

      {estado === 'carregando' && <p aria-busy="true" className="ee-estado">Carregando espelho…</p>}

      {estado === 'indisponivel' && (
        <div className="ee-estado">
          <p>Este espelho não está mais disponível.</p>
          <Link className="botao" to="/ocs/espelho">
            Voltar ao espelho
          </Link>
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar o espelho.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && espelho && (
        <>
          <div className="ee-barra-acoes">
            <Link className="botao botao-primario" to="/ocs/guias-finalizadas">
              Adicionar guia
            </Link>
            {selecionadas.length > 0 && (
              <>
                <button type="button" className="botao" onClick={abrirRemocao}>
                  Remover
                </button>
                <button
                  type="button"
                  className="botao"
                  disabled={selecionadas.length !== 1}
                  onClick={() => setEditandoGuiaId(selecionadas[0])}
                >
                  Editar valores
                </button>
              </>
            )}
          </div>

          {confirmandoRemocao && (
            <ConfirmarRemocao
              quantidade={selecionadas.length}
              numeroGuia={guiaUnica?.numeroGuia}
              erro={erroRemocao}
              removendo={removendo}
              onConfirmar={() => void confirmarRemocao()}
              onCancelar={cancelarRemocao}
            />
          )}

          <div className="ee-lista">
            {grupos.map((grupo) => (
              <CartaoGuiaEspelho
                key={grupo.guiaId}
                grupo={grupo}
                selecionada={selecionadas.includes(grupo.guiaId)}
                editando={editandoGuiaId === grupo.guiaId}
                onAlternarSelecao={() => alternarSelecao(grupo.guiaId)}
                onCancelarEdicao={() => setEditandoGuiaId(null)}
                onSalvarValores={(valores) => salvarValores(grupo.guiaId, valores)}
              />
            ))}
          </div>

          <footer className="ee-rodape">
            <span>VALOR TOTAL</span>
            <strong>{formatarMoeda(espelho.valorTotal)}</strong>
            <button type="button" className="botao botao-primario" onClick={() => setEnvioSolicitado(true)}>
              Enviar para o FUSEX
            </button>
          </footer>

          {envioSolicitado && <EmConstrucao nome="Confirmar envio ao FUSEX" task="T20-FE4" dono="rubensvnc" />}
        </>
      )}
    </section>
  )
}
