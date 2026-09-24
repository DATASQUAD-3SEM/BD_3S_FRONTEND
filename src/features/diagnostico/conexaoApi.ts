import { ApiError, get } from '../../shared/api/http'

export type ResultadoConexao =
  | { estado: 'ok'; ms: number }
  | { estado: 'desligado'; mensagem: string }
  | { estado: 'problema'; mensagem: string; httpStatus: number }

interface HealthResponse {
  status: string
}

/**
 * Chama GET /actuator/health do backend (passando pelo proxy: /api/actuator/health).
 * Nao lanca erro: devolve um resultado que a tela sabe exibir.
 */
export async function verificarBackend(): Promise<ResultadoConexao> {
  const inicio = performance.now()
  try {
    const saude = await get<HealthResponse>('/actuator/health')
    const ms = Math.round(performance.now() - inicio)
    if (saude.status === 'UP') return { estado: 'ok', ms }
    return { estado: 'problema', mensagem: `Backend respondeu status ${saude.status}`, httpStatus: 200 }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.semResposta) return { estado: 'desligado', mensagem: e.message }
      return { estado: 'problema', mensagem: e.message, httpStatus: e.status }
    }
    return { estado: 'desligado', mensagem: 'Erro inesperado ao chamar o backend' }
  }
}
