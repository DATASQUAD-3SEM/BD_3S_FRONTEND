import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConexaoPage from './ConexaoPage'

afterEach(() => vi.unstubAllGlobals())

describe('ConexaoPage', () => {
  it('mostra "Backend conectado" quando o health responde UP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'UP' }), { status: 200 })),
    )

    render(<ConexaoPage />)

    expect(await screen.findByText(/Backend conectado/)).toBeInTheDocument()
  })

  it('mostra aviso quando o backend esta desligado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    render(<ConexaoPage />)

    expect(await screen.findByText(/Nao consegui falar com o backend/)).toBeInTheDocument()
  })

  it('mostra "problema" quando o backend responde 503 (ex: banco fora)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'DOWN' }), { status: 503 })),
    )

    render(<ConexaoPage />)

    expect(await screen.findByText(/respondeu, mas com problema/)).toBeInTheDocument()
  })
})
