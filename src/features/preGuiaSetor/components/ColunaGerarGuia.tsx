import { useRef, useState, type ChangeEvent } from 'react';
import { ApiError } from '../../../shared/api/http';
import { somenteDigitos } from '../../../shared/utils/formatadores';
import { validarPdfGuia } from '../regras';
import type { ExtracaoNumeroGuia } from '../types';

const TAMANHO_MAXIMO_NUMERO = 20;

interface Mensagem {
  tipo: 'ok' | 'aviso' | 'erro';
  texto: string;
  tentarNovamente?: boolean;
}

interface Props {
  numero: string;
  /** Nome do PDF salvo como rascunho ou escolhido nesta sessao. */
  nomeArquivo: string | null;
  /** PDF escolhido nesta sessao e ainda nao enviado. */
  arquivoNovo: File | null;
  podeConcluir: boolean;
  enviandoConclusao: boolean;
  extrairNumeroGuia: (pdf: File) => Promise<ExtracaoNumeroGuia>;
  onNumeroChange: (numero: string) => void;
  onAnexar: (pdf: File, numero: string) => void;
  onRemover: () => void;
  onConcluir: () => void;
}

/** Coluna "Gerar a Guia" (T4-FE, ajustada em T11-FE). */
export default function ColunaGerarGuia({
                                          numero,
                                          nomeArquivo,
                                          arquivoNovo,
                                          podeConcluir,
                                          enviandoConclusao,
                                          extrairNumeroGuia,
                                          onNumeroChange,
                                          onAnexar,
                                          onRemover,
                                          onConcluir,
                                        }: Props) {
  const seletor = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const ocupado = lendo || enviandoConclusao;

  // Le o numero do PDF. A leitura nao grava nada; o arquivo so fica anexado nesta tela.
  const lerArquivo = async (pdf: File) => {
    setLendo(true);
    setMensagem(null);
    try {
      const { numeroGuia } = await extrairNumeroGuia(pdf);
      onAnexar(pdf, numeroGuia);
      setMensagem({ tipo: 'ok', texto: 'Número extraído automaticamente. Você pode editar se necessário.' });
    } catch (erro) {
      const status = erro instanceof ApiError ? erro.status : 500;
      if (status === 400) {
        // Arquivo rejeitado pelo servidor: nao substitui o anexo anterior.
        setMensagem({ tipo: 'erro', texto: 'Arquivo inválido. Envie um PDF válido e tente novamente.' });
        return;
      }
      onAnexar(pdf, '');
      if (status === 422) {
        setMensagem({ tipo: 'aviso', texto: 'Não foi possível ler o número automaticamente. Digite o número da Guia.' });
      } else if (status === 429) {
        setMensagem({
          tipo: 'erro',
          texto: 'Muitas tentativas de leitura. Aguarde um instante e tente novamente.',
          tentarNovamente: true,
        });
      } else {
        setMensagem({ tipo: 'erro', texto: 'Não foi possível ler o PDF agora. Tente novamente.', tentarNovamente: true });
      }
    } finally {
      setLendo(false);
    }
  };

  const abrirSeletor = () => seletor.current?.click();

  const aoEscolher = async (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    const problema = await validarPdfGuia(arquivo);
    if (problema) {
      setMensagem({ tipo: 'erro', texto: problema });
      return;
    }
    await lerArquivo(arquivo);
  };

  const aoRemover = () => {
    setMensagem(null);
    onRemover();
  };

  return (
    <div className="pgs__coluna">
      <h3>Gerar a Guia</h3>
      <p className="pgs__pequeno">Emita a Guia no SIRE e anexe o PDF.</p>

      {nomeArquivo ? (
        <div className="pgs__anexo">
          <span className="pgs__pill">PDF anexado</span>
          <span className="pgs__nome-arquivo">{nomeArquivo}</span>
          <button type="button" className="botao" disabled={ocupado} onClick={abrirSeletor}>
            {lendo ? 'Lendo arquivo...' : 'Trocar arquivo'}
          </button>
          <button
            type="button"
            className="pgs__lixeira"
            aria-label="Remover anexo"
            title="Remover anexo"
            disabled={ocupado}
            onClick={aoRemover}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
            </svg>
          </button>
        </div>
      ) : (
        <div>
          <button type="button" className="botao" disabled={ocupado} onClick={abrirSeletor}>
            {lendo ? 'Lendo arquivo...' : 'Anexar Guia'}
          </button>
        </div>
      )}

      <input
        ref={seletor}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Escolher PDF da Guia"
        tabIndex={-1}
        onChange={aoEscolher}
      />

      {mensagem && (
        <div>
          <p role={mensagem.tipo === 'erro' ? 'alert' : 'status'} className={`pgs__leitura pgs__leitura--${mensagem.tipo}`}>
            {mensagem.texto}
          </p>
          {mensagem.tentarNovamente && arquivoNovo && (
            <button type="button" className="botao" disabled={ocupado} onClick={() => lerArquivo(arquivoNovo)}>
              Tentar novamente
            </button>
          )}
        </div>
      )}

      <label htmlFor="pgs-numero-guia">Número da Guia</label>
      <input
        id="pgs-numero-guia"
        className="pgs__campo"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={lendo}
        value={lendo ? '' : numero}
        onChange={(e) => onNumeroChange(somenteDigitos(e.target.value).slice(0, TAMANHO_MAXIMO_NUMERO))}
      />
      {lendo && <p className="pgs__pequeno">Lendo o número da Guia...</p>}

      <button
        type="button"
        className="botao botao-primario pgs__concluir"
        disabled={!podeConcluir || ocupado}
        onClick={onConcluir}
      >
        {enviandoConclusao ? 'Concluindo…' : 'Concluir'}
      </button>
      <p className="pgs__pequeno">
        {podeConcluir
          ? 'Ao concluir, a Guia segue para a assinatura do médico e do chefe.'
          : 'Disponível depois de anexar a Guia.'}
      </p>
    </div>
  );
}
