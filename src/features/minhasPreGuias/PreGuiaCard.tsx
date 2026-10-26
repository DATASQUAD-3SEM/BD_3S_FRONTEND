import { useState } from 'react';
import StatusBadge from '../../shared/components/StatusBadge';
import { formatarData } from '../../shared/utils/formatadores';
import type { MinhasPreGuiasApi, PreGuiaDoBeneficiario } from './types';

/**
 * Cartao de uma pre-guia em Minhas pre-guias. Em Atencao criada pelo beneficiario, mostra "Visualizar e corrigir";
 * em Atencao criada pelo medico, mostra a caixa "O que aconteceu?" e o botao desabilitado (regra 11).
 * Em Concluida, oferece baixar, visualizar e imprimir a Guia.
 */

function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function imprimirBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60000);
  };
  document.body.appendChild(iframe);
}

interface Props {
  preGuia: PreGuiaDoBeneficiario;
  api: MinhasPreGuiasApi;
  onVisualizarECorrigir?: (id: number) => void;
}

type Acao = 'baixar' | 'visualizar' | 'imprimir';

export default function PreGuiaCard({ preGuia, api, onVisualizarECorrigir }: Props) {
  const [erroPdf, setErroPdf] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { id, numero, ocsNome, origem, criadoPorMedico, dataCriacao, status, observacao, guia } = preGuia;

  const criadaPor =
    origem === 'MEDICO' && criadoPorMedico
      ? `Criada pelo ${criadoPorMedico.patente} ${criadoPorMedico.nome} (médico FUSEX) em ${formatarData(dataCriacao)}`
      : `Criada por você em ${formatarData(dataCriacao)}`;

  async function executar(acao: Acao) {
    setErroPdf(null);
    setOcupado(true);
    // A janela precisa abrir no clique, antes do await, para o navegador não bloquear.
    const janela = acao === 'visualizar' ? window.open('', '_blank') : null;
    try {
      if (acao === 'baixar') {
        const blob = await api.obterPdf(id, 'baixar');
        baixarArquivo(blob, `guia-${guia?.numero ?? numero}.pdf`);
      } else if (acao === 'visualizar') {
        const blob = await api.obterPdf(id, 'visualizar');
        if (!janela) throw new Error('O navegador bloqueou a nova aba. Libere pop-ups e tente de novo.');
        janela.location.href = URL.createObjectURL(blob);
      } else {
        const blob = await api.obterPdf(id, 'visualizar');
        imprimirBlob(blob);
      }
    } catch (e) {
      if (janela) janela.close();
      setErroPdf(e instanceof Error && e.message ? e.message : 'Não foi possível obter o PDF da Guia.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className="pre-guia-card" aria-label={`Pré-guia ${numero}`}>
      <header className="pre-guia-card__topo">
        <h2>
          Pré-guia {numero} · {ocsNome}
        </h2>
        <StatusBadge status={status} />
      </header>

      {status === 'PENDENTE' && (
        <>
          <p className="pre-guia-card__meta">{criadaPor}</p>
          <p>Enviada ao setor de Guias. Ainda não foi aberta.</p>
        </>
      )}

      {status === 'EM_ANALISE' && (
        <>
          <p className="pre-guia-card__meta">{criadaPor}</p>
          <p>O setor de Guias está analisando.</p>
        </>
      )}

      {status === 'ATENCAO' && (
        <>
          <p className="pre-guia-card__meta">{criadaPor}</p>
          <div className="pre-guia-card__observacao">
            <strong>Observação do setor de Guias</strong>
            <p>{observacao}</p>
          </div>
          {origem === 'MEDICO' ? (
            <>
              <div className="pre-guia-card__explicacao">
                <strong>O que aconteceu?</strong>
                <p>
                  Esta pré-guia foi criada pelo seu médico do FUSEX e o setor de Guias encontrou algo a corrigir. Ela
                  foi devolvida ao médico, que fará o ajuste. Você não precisa fazer nada: depois da correção, ela volta
                  para análise e o status é atualizado aqui.
                </p>
              </div>
              <button type="button" className="botao" disabled>
                Aguardando correção do médico
              </button>
            </>
          ) : (
            <button type="button" className="botao botao-atencao" onClick={() => onVisualizarECorrigir?.(id)}>
              Visualizar e corrigir
            </button>
          )}
        </>
      )}

      {status === 'CONCLUIDA' && (
        <>
          <p className="pre-guia-card__meta">
            {criadaPor}
            {guia && ` · Guia nº ${guia.numero} · válida até ${formatarData(guia.validadeAte)}`}
          </p>
          <p>Assinada pelo médico e pelo chefe do FUSEX.</p>
          <div className="pre-guia-card__acoes">
            <button type="button" className="botao botao-primario" disabled={ocupado} onClick={() => executar('baixar')}>
              Baixar Guia (PDF)
            </button>
            <button type="button" className="botao" disabled={ocupado} onClick={() => executar('visualizar')}>
              Visualizar
            </button>
            <button type="button" className="botao" disabled={ocupado} onClick={() => executar('imprimir')}>
              Imprimir
            </button>
          </div>
          {erroPdf && (
            <p role="alert" className="pre-guia-card__erro">
              {erroPdf}
            </p>
          )}
        </>
      )}
    </article>
  );
}
