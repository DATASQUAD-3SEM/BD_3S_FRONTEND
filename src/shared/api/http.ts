/**
 * CLIENTE HTTP UNICO. Toda chamada ao backend passa por aqui (nao use fetch direto nas telas).
 *
 * Todas as URLs comecam com /api. O Vite (vite.config.ts) repassa /api/* ao backend
 * SEM o prefixo:  get('/ocs')  ->  fetch('/api/ocs')  ->  backend recebe GET /ocs
 */
export const API_BASE = '/api'

/** Formato de erro que o backend devolve (igual ao ErrorResponse do Java). */
export interface ErroApi {
  status: number
  erro: string
  mensagem: string
  detalhes: string[]
  timestamp: string
}

export class ApiError extends Error {
  readonly status: number
  readonly detalhes: string[]
  /** true = nem chegamos a falar com o backend (desligado, rede caiu, proxy sem destino). */
  readonly semResposta: boolean

  constructor(status: number, mensagem: string, detalhes: string[] = [], semResposta = false) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.detalhes = detalhes
    this.semResposta = semResposta
  }
}

async function lerErro(res: Response): Promise<ApiError> {
  const texto = await res.text().catch(() => '')
  try {
    const corpo = JSON.parse(texto) as Partial<ErroApi>
    if (typeof corpo.mensagem === 'string') {
      return new ApiError(res.status, corpo.mensagem, corpo.detalhes ?? [])
    }
    return new ApiError(res.status, `Erro ${res.status}`)
  } catch {
    // Corpo nao e JSON. Com o backend desligado, o proxy do Vite responde 5xx em texto puro.
    const semResposta = res.status >= 500
    return new ApiError(
      res.status,
      semResposta ? 'O backend nao respondeu. Ele esta ligado?' : `Erro ${res.status}`,
      [],
      semResposta,
    )
  }
}

async function request<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${caminho}`, init)
  } catch {
    throw new ApiError(0, 'Sem conexao com o servidor. Verifique a rede.', [], true)
  }
  if (!res.ok) throw await lerErro(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function get<T>(caminho: string): Promise<T> {
  return request<T>(caminho)
}

export function post<T>(caminho: string, corpo: unknown): Promise<T> {
  return request<T>(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
}

/** Envio de arquivo (multipart). NAO defina Content-Type: o navegador coloca sozinho. */
export function postForm<T>(caminho: string, formulario: FormData): Promise<T> {
  return request<T>(caminho, { method: 'POST', body: formulario })
}

export function del(caminho: string): Promise<void> {
  return request<void>(caminho, { method: 'DELETE' })
}
