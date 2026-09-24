import { useState } from 'react'

interface Procedimento {
  id: number
  nome: string
  codigo?: string
}

interface Props {
  /** Procedimentos disponiveis dependem da OCS escolhida. */
  ocsId: number | null
  value: number[]
  onChange: (procedimentoIds: number[]) => void
}

export default function SelecaoProcedimentos({ ocsId, value, onChange }: Props) {
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')

  // TODO: Substituir por consulta real via listarProcedimentosDaOcs(ocsId) quando a API estiver conectada
  const procedimentosDisponiveis: Procedimento[] = [
    { id: 1, nome: 'Consulta Médica Especializada', codigo: '10101012' },
    { id: 2, nome: 'Hemograma Completo', codigo: '40304361' },
    { id: 3, nome: 'Raio-X de Tórax', codigo: '40808041' },
    { id: 4, nome: 'Ultrassonografia Abdominal', codigo: '40901203' },
    { id: 5, nome: 'Ressonância Magnética', codigo: '40902013' },
  ]

  const procedimentosFiltrados = procedimentosDisponiveis.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.codigo && p.codigo.includes(busca))
  )

  const toggleProcedimento = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((itemId) => itemId !== id))
    } else {
      onChange([...value, id])
    }
    if (erro) setErro('')
  }

  const removerProcedimento = (id: number) => {
    onChange(value.filter((itemId) => itemId !== id))
  }

  if (!ocsId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
        Por favor, selecione uma OCS na etapa anterior antes de escolher os procedimentos.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Seleção de Procedimentos e Exames</h3>
        <p className="text-sm text-gray-500">
          Selecione os exames e procedimentos indicados no seu encaminhamento médico.
        </p>
      </div>

      {/* Campo de Busca */}
      <div>
        <label htmlFor="busca-procedimento" className="block text-sm font-medium text-gray-700 mb-1">
          Buscar Exame ou Procedimento
        </label>
        <input
          id="busca-procedimento"
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Digite o nome ou código do procedimento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Lista de Opções Disponíveis */}
      <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto divide-y divide-gray-100">
        {procedimentosFiltrados.length === 0 ? (
          <p className="p-3 text-sm text-gray-500 text-center">Nenhum procedimento encontrado.</p>
        ) : (
          procedimentosFiltrados.map((proc) => {
            const selecionado = value.includes(proc.id)
            return (
              <label
                key={proc.id}
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 text-sm ${
                  selecionado ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={() => toggleProcedimento(proc.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-800">{proc.nome}</span>
                    {proc.codigo && (
                      <span className="block text-xs text-gray-500">Código: {proc.codigo}</span>
                    )}
                  </div>
                </div>
              </label>
            )
          })
        )}
      </div>

      {/* Resumo de Selecionados */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Itens selecionados ({value.length}):
        </h4>
        {value.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum exame selecionado até o momento.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((id) => {
              const item = procedimentosDisponiveis.find((p) => p.id === id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium"
                >
                  {item?.nome || `Procedimento #${id}`}
                  <button
                    type="button"
                    onClick={() => removerProcedimento(id)}
                    className="hover:text-blue-900 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {erro && <p className="text-red-500 text-xs">{erro}</p>}
    </div>
  )
}
