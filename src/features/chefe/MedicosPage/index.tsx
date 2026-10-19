import { useEffect, useMemo, useRef, useState } from 'react'
import { alterarSituacaoMedico, atualizarMedico, cadastrarMedico, listarMedicos } from '../medicosApi.ts'
import type { FiltroSituacao, Medico, MedicoForm } from '../typesMedicos.ts'
import FiltroMedicos from './components/FiltroMedicos.tsx'
import TabelaMedicos from './components/TabelaMedicos.tsx'
import FormMedico from './components/FormMedico.tsx'

type Mensagem = { tipo: 'ok' | 'erro'; texto: string }

const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : 'Erro inesperado')

/**
 * CONTAINER MAGRO (Chefe do FUSEX): so guarda o estado e junta os componentes.
 * O Chefe ve TODOS os medicos (filtro padrao 'Todos') e edita qualquer dado.
 * Cadastro e edicao acontecem no mesmo formulario, abaixo da tabela.
 * Desativar = usuario.ativo=false (nunca DELETE).
 */
export default function MedicosPage() {
  const [lista, setLista] = useState<Medico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState<FiltroSituacao>('todos')
  const [editando, setEditando] = useState<Medico | null>(null)
  const [chaveForm, setChaveForm] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ativo = true
    listarMedicos()
      .then((l) => { if (ativo) setLista(l) })
      .catch((e: unknown) => { if (ativo) setErroLista(mensagemDe(e)) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const digitos = termo.replace(/\D/g, '')
    return lista.filter((m) => {
      if (situacao === 'ativos' && !m.ativo) return false
      if (situacao === 'inativos' && m.ativo) return false
      if (!termo) return true
      return (
        m.nome.toLowerCase().includes(termo) ||
        m.crm.toLowerCase().includes(termo) ||
        (digitos !== '' && (m.cpf.includes(digitos) || m.precCp.includes(digitos)))
      )
    })
  }, [lista, busca, situacao])

  function voltarParaNovo() {
    setEditando(null)
    setChaveForm((c) => c + 1)
  }

  function iniciarEdicao(m: Medico) {
    setEditando(m)
    setChaveForm((c) => c + 1)
    setMensagem(null)
    // o formulario fica abaixo da tabela: leva o chefe ate ele
    setTimeout(() => formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function salvar(dados: MedicoForm) {
    setSalvando(true)
    setMensagem(null)
    try {
      if (editando) {
        const atualizado = await atualizarMedico(editando.id, dados)
        setLista((l) => l.map((m) => (m.id === atualizado.id ? atualizado : m)))
        setMensagem({ tipo: 'ok', texto: `Alterações em ${atualizado.nome} salvas.` })
      } else {
        const criado = await cadastrarMedico(dados)
        setLista((l) => [...l, criado])
        setMensagem({ tipo: 'ok', texto: `Médico ${criado.nome} cadastrado.` })
      }
      voltarParaNovo()
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: mensagemDe(e) })
    } finally {
      setSalvando(false)
    }
  }

  async function alternarSituacao(m: Medico) {
    setMensagem(null)
    try {
      const atualizado = await alterarSituacaoMedico(m.id, !m.ativo)
      setLista((l) => l.map((x) => (x.id === atualizado.id ? atualizado : x)))
      if (editando?.id === m.id) voltarParaNovo()
      setMensagem({
        tipo: 'ok',
        texto: atualizado.ativo
          ? `${atualizado.nome} reativado.`
          : `${atualizado.nome} desativado. O histórico foi mantido.`,
      })
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: mensagemDe(e) })
    }
  }

  return (
    <>
      <h1>Médicos</h1>

      {mensagem && (
        <p className={mensagem.tipo} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
        </p>
      )}

      <section className="painel">
        <FiltroMedicos busca={busca} onBusca={setBusca} situacao={situacao} onSituacao={setSituacao} />

        {carregando && <p>Carregando médicos...</p>}
        {erroLista && (
          <p className="erro" role="alert">
            {erroLista}
          </p>
        )}
        {!carregando && !erroLista && (
          <TabelaMedicos
            medicos={filtrados}
            editandoId={editando?.id ?? null}
            onEditar={iniciarEdicao}
            onAlternarSituacao={(m) => void alternarSituacao(m)}
          />
        )}

        <p className="nota">Desativar bloqueia o acesso, mas mantém o histórico de pré-guias e assinaturas.</p>
      </section>

      <div ref={formRef}>
        <FormMedico
          key={`${editando?.id ?? 'novo'}-${chaveForm}`}
          editando={editando}
          salvando={salvando}
          onSubmit={(dados) => void salvar(dados)}
          onCancelar={voltarParaNovo}
        />
      </div>
    </>
  )
}
