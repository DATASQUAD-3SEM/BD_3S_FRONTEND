import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../../../shared/api/http'

import {
  buscarBeneficiarioPorPrecCp,
  criarPreGuiaMedico,
  obterMedicoSolicitante,
} from './api'
import BeneficiarioSecao, { type StatusBusca } from './components/BeneficiarioSecao'
import ExamesSecao from './components/ExamesSecao'
import MedicoSecao from './components/MedicoSecao'
import OcsSecao from './components/OcsSecao'
import { mensagemDeErro } from '../../../shared/api/erros'
import type {
  BeneficiarioBusca,
  MedicoSolicitante,
  OcsBusca,
  ProcedimentoBusca,
} from './types'
import './novaPreGuiaMedico.css'

interface Mensagem {
  tipo: 'ok' | 'erro'
  texto: string
  detalhes: string[]
}

interface EstadoMedico {
  dados: MedicoSolicitante | null
  erro: string | null
}

/** T2-FE (SCRUM-83): tela "Nova pré-guia" do médico, sem encaminhamento em papel. */
export default function NovaPreGuiaMedicoPage() {
  const [precCp, setPrecCp] = useState('')
  const [statusBusca, setStatusBusca] = useState<StatusBusca>('ocioso')
  const [beneficiario, setBeneficiario] = useState<BeneficiarioBusca | null>(null)
  const [ocs, setOcs] = useState<OcsBusca | null>(null)
  const [exames, setExames] = useState<ProcedimentoBusca[]>([])
  const [medico, setMedico] = useState<EstadoMedico | null>(null)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Muda a cada envio com sucesso, para zerar os campos de busca das seções.
  const [rodada, setRodada] = useState(0)

  // Trava síncrona contra duplo clique (o estado só muda no próximo render).
  const enviandoRef = useRef(false)
  // Versão da busca de beneficiário: respostas de buscas antigas são descartadas.
  const versaoBuscaRef = useRef(0)

  useEffect(() => {
    let ativo = true

    obterMedicoSolicitante()
      .then((dados) => {
        if (ativo) setMedico({ dados, erro: null })
      })
      .catch((e: unknown) => {
        if (ativo) {
          setMedico({
            dados: null,
            erro: mensagemDeErro(e, 'Não foi possível carregar seus dados.'),
          })
        }
      })

    return () => {
      ativo = false
    }
  }, [])

  const precCpCompleto = precCp.replace(/\D/g, '').length === 11
  const podeEnviar = beneficiario !== null && ocs !== null && exames.length > 0

  function alterarPrecCp(valor: string) {
    versaoBuscaRef.current += 1
    setPrecCp(valor)
    setStatusBusca('ocioso')
    setBeneficiario(null)
    setOcs(null)
    setExames([])
    setMensagem(null)
  }

  async function buscarBeneficiario() {
    if (!precCpCompleto) return

    versaoBuscaRef.current += 1
    const versao = versaoBuscaRef.current

    setStatusBusca('buscando')
    setBeneficiario(null)

    try {
      const dados = await buscarBeneficiarioPorPrecCp(precCp)
      if (versao !== versaoBuscaRef.current) return
      setBeneficiario(dados)
      setStatusBusca('encontrado')
    } catch (e: unknown) {
      if (versao !== versaoBuscaRef.current) return
      setStatusBusca(e instanceof ApiError && e.status === 404 ? 'naoEncontrado' : 'erro')
    }
  }

  async function enviar() {
    if (!beneficiario || !ocs || exames.length === 0 || enviandoRef.current) return

    enviandoRef.current = true
    setEnviando(true)
    setMensagem(null)

    try {
      const criada = await criarPreGuiaMedico({
        beneficiarioId: beneficiario.id,
        ocsId: ocs.id,
        procedimentos: exames.map((exame) => exame.codigoTuss),
      })

      // Limpa o formulário só depois de confirmado pelo backend.
      versaoBuscaRef.current += 1
      setPrecCp('')
      setStatusBusca('ocioso')
      setBeneficiario(null)
      setOcs(null)
      setExames([])
      setRodada((atual) => atual + 1)
      setMensagem({
        tipo: 'ok',
        texto: `Pré-guia ${criada.numero} enviada ao setor de Guias`,
        detalhes: [],
      })
    } catch (e: unknown) {
      // Em erro, o preenchimento continua na tela.
      setMensagem({
        tipo: 'erro',
        texto: mensagemDeErro(e, 'Não foi possível enviar a pré-guia. Tente novamente.'),
        detalhes: e instanceof ApiError ? e.detalhes : [],
      })
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  function incluirExame(exame: ProcedimentoBusca) {
    setExames((atuais) =>
      atuais.some((item) => item.codigoTuss === exame.codigoTuss)
        ? atuais
        : [...atuais, exame],
    )
  }

  function removerExame(codigoTuss: string) {
    setExames((atuais) => atuais.filter((item) => item.codigoTuss !== codigoTuss))
  }

  return (
    <>
      <h1>Nova pré-guia</h1>

      <BeneficiarioSecao
        precCp={precCp}
        status={statusBusca}
        beneficiario={beneficiario}
        onPrecCpChange={alterarPrecCp}
        onBuscar={() => void buscarBeneficiario()}
      />

      <MedicoSecao
        medico={medico?.dados ?? null}
        carregando={medico === null}
        erro={medico?.erro ?? null}
      />

      <OcsSecao
        key={`ocs-${rodada}`}
        selecionada={ocs}
        onSelecionar={setOcs}
        onTrocar={() => setOcs(null)}
      />

      <ExamesSecao
        key={`exames-${rodada}`}
        exames={exames}
        onAdicionar={incluirExame}
        onRemover={removerExame}
      />

      <div className="npg-envio">
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={!podeEnviar || enviando}
        >
          {enviando ? 'Enviando...' : 'Enviar ao setor de Guias'}
        </button>
      </div>

      {mensagem && (
        <div
          className={mensagem.tipo}
          role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
        >
          <p>{mensagem.texto}</p>
          {mensagem.detalhes.length > 0 && (
            <ul>
              {mensagem.detalhes.map((detalhe) => (
                <li key={detalhe}>{detalhe}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
