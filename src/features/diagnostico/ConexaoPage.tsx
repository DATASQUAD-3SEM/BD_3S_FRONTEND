import { useEffect, useState } from 'react'
import { verificarBackend, type ResultadoConexao } from './conexaoApi'

function descreverAcesso() {
  const { protocol, hostname, host } = window.location
  const local = hostname === 'localhost' || hostname === '127.0.0.1'
  return {
    endereco: `${protocol}//${host}`,
    seguro: protocol === 'https:',
    local,
  }
}

/** Tela de diagnostico: prova que  navegador -> front -> proxy -> backend  esta funcionando. */
export default function ConexaoPage() {
  const [resultado, setResultado] = useState<ResultadoConexao | null>(null)
  const [testando, setTestando] = useState(true)
  const acesso = descreverAcesso()

  // Teste automatico ao abrir a tela
  useEffect(() => {
    let ativo = true
    void verificarBackend().then((r) => {
      if (ativo) {
        setResultado(r)
        setTestando(false)
      }
    })
    return () => {
      ativo = false
    }
  }, [])

  // Botao "Testar novamente"
  async function testarNovamente() {
    setTestando(true)
    setResultado(await verificarBackend())
    setTestando(false)
  }

  return (
    <>
      <h1>Teste de conexao</h1>

      <section className="painel" aria-label="Como voce esta acessando">
        <h2>Como voce esta acessando</h2>
        <ul>
          <li>Endereco: <code>{acesso.endereco}</code></li>
          <li>Conexao segura (https): {acesso.seguro ? 'sim' : 'nao'}</li>
          <li>Aparelho: {acesso.local ? 'este computador (localhost)' : 'outro aparelho da rede / tunel'}</li>
        </ul>
      </section>

      <section className="painel" aria-label="Resultado do teste">
        <h2>Backend</h2>
        {testando && !resultado && <p>Testando...</p>}

        {resultado?.estado === 'ok' && (
          <p className="ok" role="status">
            Backend conectado! Respondeu em {resultado.ms} ms.
          </p>
        )}
        {resultado?.estado === 'desligado' && (
          <div className="erro" role="alert">
            <p><strong>Nao consegui falar com o backend.</strong></p>
            <p>{resultado.mensagem}</p>
            <p>
              Confira se o backend esta rodando (<code>http://localhost:8080/actuator/health</code> no
              computador que roda o projeto). Veja <code>docs/REDE_E_CELULAR.md</code>.
            </p>
          </div>
        )}
        {resultado?.estado === 'problema' && (
          <div className="erro" role="alert">
            <p><strong>O backend respondeu, mas com problema (HTTP {resultado.httpStatus}).</strong></p>
            <p>{resultado.mensagem}</p>
            <p>Provavel causa: banco de dados fora do ar (MySQL parado?).</p>
          </div>
        )}

        <button type="button" onClick={() => void testarNovamente()} disabled={testando}>
          {testando ? 'Testando...' : 'Testar novamente'}
        </button>
      </section>
    </>
  )
}
