import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { correcaoApi } from './correcaoApi'
import type { CorrecaoApi, DetalheCorrecao } from './correcaoTipos'
import { statusDoErro } from './erros'
import FormularioCorrecao from './components/FormularioCorrecao'
import './corrigirPreGuiaDetalhe.css'

const ROTA_LISTA = '/medico/corrigir-pre-guias'

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'nao-encontrada' }
  | { tipo: 'erro' }
  | { tipo: 'redirecionar' }
  | { tipo: 'pronto'; detalhe: DetalheCorrecao }

interface Props {
  api?: CorrecaoApi
}

export default function CorrigirPreGuiaPage({ api = correcaoApi }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const preGuiaId = Number(id)
  const idValido = Number.isInteger(preGuiaId) && preGuiaId > 0
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!idValido) return
    let ativo = true
    api
      .detalhar(preGuiaId)
      .then((detalhe) => {
        if (!ativo) return
        setEstado(detalhe.status === 'ATENCAO' ? { tipo: 'pronto', detalhe } : { tipo: 'redirecionar' })
      })
      .catch((erro) => {
        if (!ativo) return
        const status = statusDoErro(erro)
        if (status === 404) setEstado({ tipo: 'nao-encontrada' })
        else if (status === 409) setEstado({ tipo: 'redirecionar' })
        else setEstado({ tipo: 'erro' })
      })
    return () => {
      ativo = false
    }
  }, [api, preGuiaId, idValido, tentativa])

  function tentarNovamente() {
    setEstado({ tipo: 'carregando' })
    setTentativa((t) => t + 1)
  }

  if (!idValido || estado.tipo === 'nao-encontrada') {
    return (
      <section className="pgd pgd--centro">
        <h1>Pré-guia não encontrada</h1>
        <p>Ela pode ter sido removida ou o endereço está incorreto.</p>
        <Link to={ROTA_LISTA} className="botao botao-primario">
          Voltar para a lista
        </Link>
      </section>
    )
  }

  if (estado.tipo === 'redirecionar') return <Navigate to={ROTA_LISTA} replace />

  if (estado.tipo === 'erro') {
    return (
      <section className="pgd pgd--centro">
        <p role="alert">Não foi possível carregar a pré-guia.</p>
        <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
          Tentar novamente
        </button>
      </section>
    )
  }

  if (estado.tipo === 'carregando') {
    return (
      <section className="pgd" aria-busy="true" aria-label="Carregando pré-guia">
        <div className="pgd__skeleton" />
        <div className="pgd__skeleton" />
        <div className="pgd__skeleton" />
      </section>
    )
  }

  return (
    <FormularioCorrecao
      detalhe={estado.detalhe}
      api={api}
      onCancelar={() => navigate(ROTA_LISTA)}
      onSalvo={(mensagem) => navigate(ROTA_LISTA, { replace: true, state: { mensagem } })}
    />
  )
}
