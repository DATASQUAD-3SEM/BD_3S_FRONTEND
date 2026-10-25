import { useCallback, useEffect, useRef, useState } from 'react'
import { medicosApi as apiPadrao } from './medicosApi'
import FormularioMedico from './FormularioMedico'
import ListaMedicos, { TAMANHO_PAGINA, type EstadoLista } from './ListaMedicos'
import type { MedicoDetalhe, MedicoItem, MedicosApi, SituacaoFiltro } from './tipos'
import './medicos.css'

const ATRASO_BUSCA_MS = 300

interface Aviso {
  tipo: 'sucesso' | 'erro'
  texto: string
}

interface Props {
  api?: MedicosApi
}

export default function MedicosPage({ api = apiPadrao }: Props) {
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [situacao, setSituacao] = useState<SituacaoFiltro>('ativos')
  const [pagina, setPagina] = useState(0)
  const [estado, setEstado] = useState<EstadoLista>('carregando')
  const [itens, setItens] = useState<MedicoItem[]>([])
  const [total, setTotal] = useState(0)
  const [versaoLista, setVersaoLista] = useState(0)
  const [edicao, setEdicao] = useState<MedicoDetalhe | null>(null)
  const [versaoEdicao, setVersaoEdicao] = useState(0)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const requisicao = useRef(0)

  // Espera 300 ms sem digitar; uma nova busca volta para a primeira página
  useEffect(() => {
    const id = setTimeout(() => {
      if (busca !== buscaAplicada) {
        setBuscaAplicada(busca)
        setPagina(0)
        setEstado('carregando')
      }
    }, ATRASO_BUSCA_MS)
    return () => clearTimeout(id)
  }, [busca, buscaAplicada])

  useEffect(() => {
    const numero = ++requisicao.current
    api
      .listar({ busca: buscaAplicada, situacao, page: pagina, size: TAMANHO_PAGINA })
      .then((dados) => {
        if (numero !== requisicao.current) return
        setItens(dados.itens)
        setTotal(dados.total)
        setEstado('pronto')
      })
      .catch(() => {
        if (numero !== requisicao.current) return
        setEstado('erro')
      })
  }, [api, buscaAplicada, situacao, pagina, versaoLista])

  const recarregarLista = useCallback(() => {
    setEstado('carregando')
    setVersaoLista((n) => n + 1)
  }, [])

  function mudarSituacao(nova: SituacaoFiltro) {
    setSituacao(nova)
    setPagina(0)
    setEstado('carregando')
  }

  function mudarPagina(nova: number) {
    setPagina(nova)
    setEstado('carregando')
  }

  async function abrirEdicao(id: number) {
    setAviso(null)
    try {
      const detalhe = await api.buscar(id)
      setEdicao(detalhe)
      setVersaoEdicao((n) => n + 1)
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não foi possível abrir o médico para edição.' })
    }
  }

  async function alternarSituacao(item: MedicoItem) {
    const confirmado = item.ativo
      ? window.confirm(
        `Desativar ${item.nome}? O acesso e a assinatura serão bloqueados, mas o histórico é mantido.`,
      )
      : window.confirm(`Reativar ${item.nome}?`)
    if (!confirmado) return

    setAviso(null)
    try {
      await api.alterarSituacao(item.id, !item.ativo)
      if (edicao?.id === item.id) setEdicao(null)
      setAviso({
        tipo: 'sucesso',
        texto: item.ativo ? `${item.nome} foi desativado.` : `${item.nome} foi reativado.`,
      })
      recarregarLista()
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não foi possível alterar a situação do médico.' })
    }
  }

  function aoCadastrar() {
    setAviso({ tipo: 'sucesso', texto: 'Médico cadastrado com sucesso.' })
    recarregarLista()
  }

  function aoSalvarEdicao() {
    setEdicao(null)
    setAviso({ tipo: 'sucesso', texto: 'Alterações salvas.' })
    recarregarLista()
  }

  function aoCancelarEdicao() {
    setEdicao(null)
    setAviso(null)
  }

  const chaveFormulario = edicao ? `edicao-${edicao.id}-${versaoEdicao}` : 'novo'

  return (
    <div className="med-pagina">
      <h1 className="med-titulo">Médicos</h1>

      {aviso && (
        <p className={`med-aviso med-aviso--${aviso.tipo}`} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
          {aviso.texto}
        </p>
      )}

      <ListaMedicos
        busca={busca}
        onBusca={setBusca}
        situacao={situacao}
        onSituacao={mudarSituacao}
        estado={estado}
        itens={itens}
        total={total}
        pagina={pagina}
        onPagina={mudarPagina}
        editandoId={edicao?.id ?? null}
        onEditar={abrirEdicao}
        onAlternar={alternarSituacao}
        onTentarNovamente={recarregarLista}
      />

      <FormularioMedico
        key={chaveFormulario}
        api={api}
        edicao={edicao}
        onCadastrado={aoCadastrar}
        onSalvoEdicao={aoSalvarEdicao}
        onCancelarEdicao={aoCancelarEdicao}
      />
    </div>
  )
}
