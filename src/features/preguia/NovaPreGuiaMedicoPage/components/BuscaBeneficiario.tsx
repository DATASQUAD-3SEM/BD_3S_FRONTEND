import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../../shared/api/http'
import { buscarBeneficiarioPorPrecCp } from '../../../medicos/api'
import type { BeneficiarioEncontrado } from '../../../medicos/types'
import DadosBeneficiario from '../../NovaPreGuiaPage/components/DadosBeneficiario'

interface Props {
  value: BeneficiarioEncontrado | null
  onChange: (beneficiario: BeneficiarioEncontrado | null) => void
}

/** Medico informa a Prec-CP; os demais dados vem do cadastro do beneficiario. */
export default function BuscaBeneficiario({ value, onChange }: Props) {
  const [precCp, setPrecCp] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function buscar(e: FormEvent) {
    e.preventDefault()
    setBuscando(true)
    setErro(null)
    try {
      const achado = await buscarBeneficiarioPorPrecCp(precCp)
      if (achado) onChange(achado)
      else setErro('Nenhum beneficiário ativo encontrado com essa Prec-CP. Confira o número.')
    } catch (e2) {
      setErro(e2 instanceof ApiError ? e2.message : 'Erro ao buscar o beneficiário')
    } finally {
      setBuscando(false)
    }
  }

  function trocar() {
    onChange(null)
    setPrecCp('')
    setErro(null)
  }

  if (value) {
    return (
      <>
        <DadosBeneficiario value={value.dados} />
        <button type="button" onClick={trocar}>
          Trocar beneficiário
        </button>
      </>
    )
  }

  return (
    <section className="painel">
      <h2>Beneficiário</h2>
      <p>Informe a Prec-CP para carregar os dados do beneficiário.</p>
      <form onSubmit={(e) => void buscar(e)}>
        <label htmlFor="prec-cp-busca">Prec-CP do beneficiário</label>
        <input
          id="prec-cp-busca"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={precCp}
          onChange={(e) => setPrecCp(e.target.value)}
          style={{ width: '100%', marginBottom: '0.75rem' }}
        />
        <button type="submit" disabled={buscando || precCp.trim() === ''}>
          {buscando ? 'Buscando...' : 'Buscar beneficiário'}
        </button>
      </form>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  )
}
