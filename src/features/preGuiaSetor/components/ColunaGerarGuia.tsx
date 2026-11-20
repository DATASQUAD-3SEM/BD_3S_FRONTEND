import { useRef, useState, type ChangeEvent } from 'react';
import { ApiError } from '../../../shared/api/http';
import { mascaraData, somenteDigitos } from '../../../shared/utils/formatadores';
import { MSG_CONFERENCIA_PENDENTE } from '../conferenciaGuia';
import type { LinhaExame } from '../examesGuia';
import { validarPdfGuia } from '../regras';
import type { ExtracaoNumeroGuia, LeituraDaGuia } from '../types';
import TabelaExamesGuia from './TabelaExamesGuia';

const TAMANHO_MAXIMO_NUMERO = 20;
const TAMANHO_MAXIMO_UG = 100;

/** Resultado de uma leitura que nao trouxe nada: o setor digita tudo. */
const LEITURA_VAZIA: LeituraDaGuia = { numero: '', exames: [], ug: '', ugOrigem: null, validadeAte: null };

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
  /** UG da Guia (T16-FE): editavel depois da leitura. */
  ug: string;
  /** Validade em dd/mm/aaaa (T16-FE): editavel depois da leitura. */
  validade: string;
  /** Erro da conferencia da UG ou da UG Origem (que nao tem campo), mostrado abaixo da UG. */
  erroUg: string | null;
  erroValidade: string | null;
  /** Ha erro de UG, UG Origem ou validade no navegador: o texto abaixo do Concluir explica. */
  conferenciaPendente: boolean;
  /** Exames da Guia, editaveis na tabela (T22-FE1). */
  linhasExames: LinhaExame[];
  onExamesChange: (linhas: LinhaExame[]) => void;
  /** Erro 422 do servidor sobre os exames, mostrado abaixo da tabela. */
  erroExames: string | null;
  /** Motivo que impede o Concluir, quando nao e so a falta de dados. */
  avisoConclusao: string | null;
  podeConcluir: boolean;
  enviandoConclusao: boolean;
  extrairNumeroGuia: (pdf: File) => Promise<ExtracaoNumeroGuia>;
  onNumeroChange: (numero: string) => void;
  onUgChange: (ug: string) => void;
  onValidadeChange: (validade: string) => void;
  onAnexar: (pdf: File, leitura: LeituraDaGuia) => void;
  onRemover: () => void;
  onConcluir: () => void;
}

/** Coluna "Gerar a Guia" (T4-FE, ajustada em T11-FE, T22-FE1 e T16-FE). */
export default function ColunaGerarGuia({
                                          numero,
                                          nomeArquivo,
                                          arquivoNovo,
                                          ug,
                                          validade,
                                          erroUg,
                                          erroValidade,
                                          conferenciaPendente,
                                          linhasExames,
                                          onExamesChange,
                                          erroExames,
                                          avisoConclusao,
                                          podeConcluir,
                                          enviandoConclusao,
                                          extrairNumeroGuia,
                                          onNumeroChange,
                                          onUgChange,
                                          onValidadeChange,
                                          onAnexar,
                                          onRemover,
                                          onConcluir,
                                        }: Props) {
  const seletor = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const ocupado = lendo || enviandoConclusao;

  // Le o numero, a UG, a UG Origem, a validade e os exames do PDF. A leitura nao grava nada; o arquivo so fica
  // anexado nesta tela.
  const lerArquivo = async (pdf: File) => {
    setLendo(true);
    setMensagem(null);
    try {
      const leitura = await extrairNumeroGuia(pdf);
      onAnexar(pdf, {
        numero: leitura.numeroGuia,
        exames: leitura.exames ?? [],
        ug: leitura.ug ?? '',
        ugOrigem: leitura.ugOrigem ?? null,
        validadeAte: leitura.validadeAte ?? null,
      });
      setMensagem({ tipo: 'ok', texto: 'Número extraído automaticamente. Você pode editar se necessário.' });
    } catch (erro) {
      const status = erro instanceof ApiError ? erro.status : 500;
      if (status === 400) {
        // Arquivo rejeitado pelo servidor: nao substitui o anexo anterior.
        setMensagem({ tipo: 'erro', texto: 'Arquivo inválido. Envie um PDF válido e tente novamente.' });
        return;
      }
      onAnexar(pdf, LEITURA_VAZIA);
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

  // Durante a leitura os erros ficam escondidos: os campos estao vazios so porque a leitura ainda nao terminou.
  const mostrarErroUg = !lendo && erroUg !== null;
  const mostrarErroValidade = !lendo && erroValidade !== null;

  return (
    <div className="pgs__coluna">
      <h3>Gerar a Guia</h3>
      <p className="pgs__pequeno">Emita a Guia no SIRE e anexe o PDF.</p>

      {nomeArquivo ? (
        <div className="pgs__anexo">
          <span className="pgs__pill">PDF anexado</span>
          <span className="pgs__nome-arquivo">{nomeArquivo}</span>
          <button type="button" className="botao" disabled={ocupado} onClick={abrirSeletor}>
            Trocar arquivo
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
            Anexar Guia
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

      <label htmlFor="pgs-ug-guia">UG da Guia</label>
      <input
        id="pgs-ug-guia"
        className="pgs__campo"
        type="text"
        autoComplete="off"
        maxLength={TAMANHO_MAXIMO_UG}
        disabled={lendo}
        value={lendo ? '' : ug}
        aria-invalid={mostrarErroUg}
        aria-describedby={mostrarErroUg ? 'pgs-ug-guia-erro' : undefined}
        onChange={(e) => onUgChange(e.target.value)}
      />
      {mostrarErroUg && <p id="pgs-ug-guia-erro" role="alert" className="pgs__erro-campo">{erroUg}</p>}

      <label htmlFor="pgs-validade-guia">Validade (NÃO RECEBER APÓS)</label>
      <input
        id="pgs-validade-guia"
        className="pgs__campo"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        disabled={lendo}
        value={lendo ? '' : validade}
        aria-invalid={mostrarErroValidade}
        aria-describedby={mostrarErroValidade ? 'pgs-validade-guia-erro' : undefined}
        onChange={(e) => onValidadeChange(mascaraData(e.target.value))}
      />
      {mostrarErroValidade && (
        <p id="pgs-validade-guia-erro" role="alert" className="pgs__erro-campo">{erroValidade}</p>
      )}

      {lendo && <p role="status" className="pgs__pequeno">Lendo o PDF da Guia...</p>}

      {nomeArquivo && !lendo && (
        <div>
          <h4>Exames na Guia</h4>
          <TabelaExamesGuia linhas={linhasExames} onChange={onExamesChange} disabled={ocupado} />
          {erroExames && <p role="alert" className="pgs__erro-campo">{erroExames}</p>}
        </div>
      )}

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
          : nomeArquivo && !lendo && conferenciaPendente
            ? MSG_CONFERENCIA_PENDENTE
            : 'Disponível depois de anexar a Guia.'}
      </p>
      {avisoConclusao && <p role="status" className="pgs__aviso">{avisoConclusao}</p>}
    </div>
  );
}
