import { useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/http'
import { formatarCpf, formatarData, somenteDigitos } from '../../shared/utils/formatadores'
import { chefeDependentesApi } from './api'
import { ehMenor, errosPorCampo, idadeEm, vigenciaSugerida } from './regrasDependente'
import type { ChefeDependentesApi, ContaPorCpf, DependenteItem } from './tipos'
import './dependentes.css'

interface Props {
  titularId: number
  /** Ausente = adicionar; presente = editar este dependente. */
  dependenteId?: number
  api?: ChefeDependentesApi
  onConcluido?: () => void
  onVoltar?: () => void
}

type Vigencia = 'VITALICIA' | 'DETERMINADA'
type TipoResponsavel = 'TITULAR' | 'OUTRA_PESSOA' | null

const MSG_CONTA_NOVA_RESPONSAVEL = 'Será criada uma conta de responsável legal, com login por este CPF.'
const MSG_CPF_OUTRA_PESSOA = 'Este CPF pertence a outra pessoa do sistema e não pode ser responsável legal.'

/**
 * Adicionar e editar dependente (T31-FE3). Menor: vigência determinada travada (sugestão de 22 anos menos um dia)
 * e um responsável legal obrigatório (o titular ou outra pessoa). Maior: conta própria, vigência vitalícia ou
 * determinada. Editar: CPF, data de nascimento e responsável só para leitura (um só responsável, regra 13).
 */
export default function DependenteFormPage({ titularId, dependenteId, api = chefeDependentesApi, onConcluido, onVoltar }: Props) {
  const editando = dependenteId !== undefined
  const [titularNome, setTitularNome] = useState('')
  const [existente, setExistente] = useState<DependenteItem | null>(null)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [precCp, setPrecCp] = useState('')
  const [vinculo, setVinculo] = useState('')
  const [vigencia, setVigencia] = useState<Vigencia>('VITALICIA')
  const [vigenciaFim, setVigenciaFim] = useState('')
  const [senha, setSenha] = useState('')

  const [tipoResponsavel, setTipoResponsavel] = useState<TipoResponsavel>(null)
  const [cpfResponsavel, setCpfResponsavel] = useState('')
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('')
  const [contaResponsavel, setContaResponsavel] = useState<ContaPorCpf | null>(null)
  const [contaMaior, setContaMaior] = useState<ContaPorCpf | null>(null)

  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true
    api
      .listar(titularId)
      .then((dados) => {
        if (!ativo) return
        setTitularNome(dados.titularNome)
        if (editando) {
          const d = dados.dependentes.find((x) => x.dependenteId === dependenteId)
          if (!d) {
            setErroCarga('Dependente não encontrado.')
            return
          }
          setExistente(d)
          setNome(d.nome)
          setNascimento(d.dataNascimento)
          setCpf(d.cpf ?? '')
          setTelefone(d.telefone ?? '')
          setPrecCp(d.precCp)
          setVinculo(d.vinculo ?? '')
          setVigencia(d.vigenciaFim ? 'DETERMINADA' : 'VITALICIA')
          setVigenciaFim(d.vigenciaFim ?? '')
        }
      })
      .catch(() => {
        if (ativo) setErroCarga('Não foi possível carregar o titular.')
      })
    if (!editando) {
      api
        .proximoPrecCp(titularId)
        .then((r) => {
          if (ativo) setPrecCp(r.precCp)
        })
        .catch(() => undefined)
    }
    return () => {
      ativo = false
    }
  }, [api, titularId, dependenteId, editando])

  const menor = editando ? existente?.tipo !== 'MAIOR' : ehMenor(nascimento)
  const idade = nascimento ? idadeEm(nascimento) : null
  const vigenciaEfetiva: Vigencia = menor ? 'DETERMINADA' : vigencia

  function mudarNascimento(valor: string) {
    setNascimento(valor)
    if (ehMenor(valor)) {
      setVigencia('DETERMINADA')
      setVigenciaFim(vigenciaSugerida(valor))
    } else {
      setVigencia('VITALICIA')
      setVigenciaFim('')
      setTipoResponsavel(null)
    }
  }

  async function consultar(cpfDigitado: string, alvo: 'responsavel' | 'maior') {
    const digitos = somenteDigitos(cpfDigitado)
    if (digitos.length !== 11) {
      if (alvo === 'responsavel') setContaResponsavel(null)
      else setContaMaior(null)
      return
    }
    try {
      const conta = await api.consultarConta(titularId, digitos)
      if (alvo === 'responsavel') {
        setContaResponsavel(conta)
        if (conta.nome) setNomeResponsavel(conta.nome)
      } else {
        setContaMaior(conta)
      }
    } catch {
      if (alvo === 'responsavel') setContaResponsavel(null)
      else setContaMaior(null)
    }
  }

  const responsavelReaproveitado =
    contaResponsavel?.situacao === 'RESPONSAVEL_EXTERNO' || contaResponsavel?.situacao === 'DEPENDENTE_MAIOR_VITALICIO'
  const responsavelNovo = contaResponsavel?.situacao === 'NOVA'
  const maiorReaproveitado = contaMaior?.situacao === 'RESPONSAVEL_EXTERNO'

  const faltaCampo = editando
    ? !nome.trim() || !precCp.trim() || (vigenciaEfetiva === 'DETERMINADA' && !vigenciaFim)
    : !nome.trim() ||
      !nascimento ||
      somenteDigitos(cpf).length !== 11 ||
      !precCp.trim() ||
      (vigenciaEfetiva === 'DETERMINADA' && !vigenciaFim) ||
      (menor &&
        (tipoResponsavel === null ||
          (tipoResponsavel === 'OUTRA_PESSOA' &&
            (!responsavelReaproveitado && !(responsavelNovo && nomeResponsavel.trim() && senha))))) ||
      (!menor && !maiorReaproveitado && !senha)

  async function salvar() {
    setSalvando(true)
    setErros({})
    setErroGeral(null)
    try {
      if (editando && dependenteId !== undefined) {
        await api.editar(dependenteId, {
          nome: nome.trim(),
          telefone: somenteDigitos(telefone),
          precCp: somenteDigitos(precCp),
          vinculo: vinculo.trim(),
          tipoVigencia: vigenciaEfetiva,
          vigenciaFim: vigenciaEfetiva === 'DETERMINADA' ? vigenciaFim : null,
        })
      } else {
        await api.criar(titularId, {
          nome: nome.trim(),
          dataNascimento: nascimento,
          cpf: somenteDigitos(cpf),
          telefone: somenteDigitos(telefone),
          precCp: somenteDigitos(precCp),
          vinculo: vinculo.trim(),
          tipoVigencia: vigenciaEfetiva,
          vigenciaFim: vigenciaEfetiva === 'DETERMINADA' ? vigenciaFim : null,
          responsavel: !menor
            ? null
            : tipoResponsavel === 'TITULAR'
              ? { tipo: 'TITULAR' }
              : {
                  tipo: 'OUTRA_PESSOA',
                  cpf: somenteDigitos(cpfResponsavel),
                  nome: nomeResponsavel.trim(),
                  telefone: somenteDigitos(telefoneResponsavel),
                },
          senha: senha || null,
        })
      }
      onConcluido?.()
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        const porCampo = errosPorCampo(e.detalhes)
        setErros(porCampo)
        if (Object.keys(porCampo).length === 0) setErroGeral(e.message)
      } else {
        setErroGeral('Não foi possível salvar o dependente.')
      }
    } finally {
      setSalvando(false)
    }
  }

  if (erroCarga) return <p role="alert">{erroCarga}</p>

  const titulo = editando ? 'Editar dependente' : 'Adicionar dependente'
  const erroCampo = (campo: string) =>
    erros[campo] ? (
      <span className="dep-erro" role="alert">
        {erros[campo]}
      </span>
    ) : null

  return (
    <div className="dep-pagina">
      <nav className="dep-trilha" aria-label="Trilha">
        <button type="button" className="dep-link" onClick={() => onVoltar?.()}>
          Beneficiários
        </button>{' '}
        › {titularNome} › {titulo}
      </nav>
      <h1>{titulo}</h1>
      <p>Titular: {titularNome}</p>

      <fieldset className="dep-secao">
        <legend>Dados do dependente</legend>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={200} />
        </label>
        {erroCampo('nome')}
        {editando ? (
          <>
            <p>Data de nascimento: {formatarData(nascimento)}</p>
            <p>CPF: {formatarCpf(cpf)}</p>
          </>
        ) : (
          <>
            <label>
              Data de nascimento
              <input type="date" value={nascimento} onChange={(e) => mudarNascimento(e.target.value)} />
            </label>
            {erroCampo('dataNascimento')}
            <label>
              CPF
              <input
                value={cpf}
                inputMode="numeric"
                onChange={(e) => {
                  setCpf(e.target.value)
                  if (!ehMenor(nascimento)) void consultar(e.target.value, 'maior')
                }}
              />
            </label>
            {erroCampo('cpf')}
          </>
        )}
        {idade !== null && <p>Idade: {idade} anos</p>}
        <label>
          Telefone (opcional)
          <input value={telefone} inputMode="numeric" onChange={(e) => setTelefone(e.target.value)} />
        </label>
        <label>
          Prec CP
          <input value={precCp} inputMode="numeric" onChange={(e) => setPrecCp(e.target.value)} />
        </label>
        {erroCampo('precCp')}
        <label>
          Vínculo
          <input value={vinculo} onChange={(e) => setVinculo(e.target.value)} maxLength={50} />
        </label>
      </fieldset>

      <fieldset className="dep-secao">
        <legend>Vigência</legend>
        {menor ? (
          <>
            <label>
              <input type="checkbox" checked readOnly disabled /> Determinada
            </label>
            <label>
              Data final
              <input type="date" value={vigenciaFim} onChange={(e) => setVigenciaFim(e.target.value)} />
            </label>
            <p className="dep-aviso">
              Foi detectado que se trata de um menor de idade. Sugerimos a seguinte data (22 anos menos um dia). A data
              pode ser alterada, mas não pode ser desmarcada.
            </p>
          </>
        ) : (
          <>
            <label>
              <input type="radio" name="vigencia" checked={vigencia === 'VITALICIA'} onChange={() => setVigencia('VITALICIA')} />{' '}
              Vitalícia (padrão)
            </label>
            <label>
              <input type="radio" name="vigencia" checked={vigencia === 'DETERMINADA'} onChange={() => setVigencia('DETERMINADA')} />{' '}
              Determinada — informar data final
            </label>
            {vigencia === 'DETERMINADA' && (
              <label>
                Data final
                <input type="date" value={vigenciaFim} onChange={(e) => setVigenciaFim(e.target.value)} />
              </label>
            )}
            {!editando && <p className="dep-aviso">Maior de idade tem conta própria, com login pelo CPF.</p>}
          </>
        )}
        {erroCampo('vigenciaFim')}
      </fieldset>

      {menor && editando && existente && (
        <fieldset className="dep-secao">
          <legend>Responsável legal</legend>
          <p>{existente.responsaveis[0]?.nome ?? '—'}</p>
        </fieldset>
      )}

      {menor && !editando && (
        <fieldset className="dep-secao">
          <legend>Responsável legal (obrigatório para menor)</legend>
          <label>
            <input type="radio" name="responsavel" checked={tipoResponsavel === 'TITULAR'} onChange={() => setTipoResponsavel('TITULAR')} />{' '}
            Titular ({titularNome})
          </label>
          <label>
            <input
              type="radio"
              name="responsavel"
              checked={tipoResponsavel === 'OUTRA_PESSOA'}
              onChange={() => setTipoResponsavel('OUTRA_PESSOA')}
            />{' '}
            Outra pessoa
          </label>
          {tipoResponsavel === 'OUTRA_PESSOA' && (
            <>
              <label>
                CPF do responsável
                <input
                  value={cpfResponsavel}
                  inputMode="numeric"
                  onChange={(e) => {
                    setCpfResponsavel(e.target.value)
                    void consultar(e.target.value, 'responsavel')
                  }}
                />
              </label>
              {responsavelReaproveitado && (
                <p className="dep-aviso" role="status">
                  CPF encontrado: {contaResponsavel?.nome} já tem conta. Nenhuma conta nova será criada.
                </p>
              )}
              {contaResponsavel?.situacao === 'OUTRA' && (
                <p className="dep-erro" role="alert">
                  {MSG_CPF_OUTRA_PESSOA}
                </p>
              )}
              {responsavelNovo && (
                <>
                  <label>
                    Nome do responsável
                    <input value={nomeResponsavel} onChange={(e) => setNomeResponsavel(e.target.value)} maxLength={200} />
                  </label>
                  <label>
                    Telefone do responsável (opcional)
                    <input value={telefoneResponsavel} inputMode="numeric" onChange={(e) => setTelefoneResponsavel(e.target.value)} />
                  </label>
                  <label>
                    Senha
                    <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
                  </label>
                  <p className="dep-aviso">{MSG_CONTA_NOVA_RESPONSAVEL}</p>
                </>
              )}
            </>
          )}
          {erroCampo('responsavel')}
        </fieldset>
      )}

      {!menor && !editando && (
        <fieldset className="dep-secao">
          <legend>Conta própria</legend>
          {maiorReaproveitado ? (
            <p className="dep-aviso" role="status">
              Esta pessoa já é responsável legal; a conta será reaproveitada e passará a ser de dependente.
            </p>
          ) : (
            <label>
              Senha
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </label>
          )}
          {erroCampo('senha')}
        </fieldset>
      )}

      {erroGeral && (
        <p className="dep-erro" role="alert">
          {erroGeral}
        </p>
      )}
      <div className="dep-acoes">
        <button type="button" className="dep-botao" disabled={faltaCampo || salvando} onClick={salvar}>
          Salvar
        </button>
        <button type="button" className="dep-botao dep-botao--secundario" onClick={() => onVoltar?.()}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
