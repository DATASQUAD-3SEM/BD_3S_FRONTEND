import { useEffect, useMemo, useRef, useState } from 'react'
import {
  alterarSituacao,
  atualizarBeneficiario,
  cadastrarBeneficiario,
  listarBeneficiarios,
} from '../beneficiariosApi.ts'
import type { Beneficiario, BeneficiarioForm, FiltroSituacao } from '../typesBeneficiarios.ts'
import FiltroBeneficiarios from './components/FiltroBeneficiarios.tsx'
import TabelaBeneficiarios from './components/TabelaBeneficiarios.tsx'
import FormBeneficiario from './components/FormBeneficiario.tsx'

type Mensagem = { tipo: 'ok' | 'erro'; texto: string }

const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : 'Erro inesperado')

/**
 * CONTAINER MAGRO (Chefe do FUSEX): so guarda o estado e junta os componentes.
 * Cadastro e edicao acontecem no mesmo formulario, abaixo da tabela.
 * O Chefe ve TODOS os beneficiarios (filtro padrao 'Todos') e edita qualquer dado.
 * Desativar = usuario.ativo=false (nunca DELETE).
 */
export default function BeneficiariosPage() {
  const [lista, setLista] = useState<Beneficiario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState<FiltroSituacao>('todos')
  const [editando, setEditando] = useState<Beneficiario | null>(null)
  const [chaveForm, setChaveForm] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ativo = true
    listarBeneficiarios()
      .then((l) => { if (ativo) setLista(l) })
      .catch((e: unknown) => { if (ativo) setErroLista(mensagemDe(e)) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const digitos = termo.replace(/\D/g, '')
    return lista.filter((b) => {
      if (situacao === 'ativos' && !b.ativo) return false
      if (situacao === 'inativos' && b.ativo) return false
      if (!termo) return true
      return (
        b.nome.toLowerCase().includes(termo) ||
        (digitos !== '' && (b.cpf.includes(digitos) || b.precCp.includes(digitos)))
      )
    })
  }, [lista, busca, situacao])

  function voltarParaNovo() {
    setEditando(null)
    setChaveForm((c) => c + 1)
  }

  function iniciarEdicao(b: Beneficiario) {
    setEditando(b)
    setChaveForm((c) => c + 1)
    setMensagem(null)
    // o formulario fica abaixo da tabela: leva o chefe ate ele
    setTimeout(() => formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function salvar(dados: BeneficiarioForm) {
    setSalvando(true)
    setMensagem(null)
    try {
      if (editando) {
        const atualizado = await atualizarBeneficiario(editando.id, dados)
        setLista((l) => l.map((b) => (b.id === atualizado.id ? atualizado : b)))
        setMensagem({ tipo: 'ok', texto: `Alterações em ${atualizado.nome} salvas.` })
      } else {
        const criado = await cadastrarBeneficiario(dados)
        setLista((l) => [...l, criado])
        setMensagem({ tipo: 'ok', texto: `Beneficiário ${criado.nome} cadastrado.` })
      }
      voltarParaNovo()
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: mensagemDe(e) })
    } finally {
      setSalvando(false)
    }
  }

  async function alternarSituacao(b: Beneficiario) {
    setMensagem(null)
    try {
      const atualizado = await alterarSituacao(b.id, !b.ativo)
      setLista((l) => l.map((x) => (x.id === atualizado.id ? atualizado : x)))
      if (editando?.id === b.id) voltarParaNovo()
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
      <h1>Beneficiários</h1>

      {mensagem && (
        <p className={mensagem.tipo} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
        </p>
      )}

      <section className="painel">
        <FiltroBeneficiarios busca={busca} onBusca={setBusca} situacao={situacao} onSituacao={setSituacao} />

        {carregando && <p>Carregando beneficiários...</p>}
        {erroLista && (
          <p className="erro" role="alert">
            {erroLista}
          </p>
        )}
        {!carregando && !erroLista && (
          <TabelaBeneficiarios
            beneficiarios={filtrados}
            editandoId={editando?.id ?? null}
            onEditar={iniciarEdicao}
            onAlternarSituacao={(b) => void alternarSituacao(b)}
          />
        )}

        <p className="nota">Desativar bloqueia o acesso, mas mantém o histórico de pré-guias e Guias.</p>
      </section>

      <div ref={formRef}>
        <FormBeneficiario
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
