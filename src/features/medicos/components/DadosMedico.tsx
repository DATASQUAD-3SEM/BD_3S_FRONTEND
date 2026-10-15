import type { MedicoLogado } from '../types'

interface Props {
  value: MedicoLogado
}

/** 12345678901 -> 123.456.789-01 (formato so para exibicao). */
function formatarCpf(digitos: string): string {
  const d = digitos.replace(/\D/g, '')
  if (d.length !== 11) return digitos
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Dados do medico logado (vem do perfil), somente leitura. Mesmo visual do DadosBeneficiario. */
export default function DadosMedico({ value }: Props) {
  const linhas: Array<{ rotulo: string; valor: string }> = [
    { rotulo: 'Médico', valor: `${value.patente} ${value.nome}` },
    { rotulo: 'CRM', valor: value.crm },
    { rotulo: 'CPF', valor: formatarCpf(value.cpf) },
    { rotulo: 'Prec-CP', valor: value.precCp },
  ]

  return (
    <section className="painel painel-dados">
      <h2 className="painel-titulo">Dados do médico solicitante</h2>
      <div className="dados-lista">
        {linhas.map((linha, i) => (
          <div className="dados-linha" data-par={i % 2 === 1 ? 'true' : 'false'} key={linha.rotulo}>
            <span className="dados-rotulo">{linha.rotulo}</span>
            <span className="dados-valor">{linha.valor || '—'}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
