import { CLASSE_SESSAO, ROTULO_SESSAO, sessoesDoProcedimento } from '../regras';
import type { ProcedimentoRecebido, SessaoRecebida, SituacaoSessaoOcs } from '../types';

interface Props {
  procedimentos: ProcedimentoRecebido[];
  sessoes: SessaoRecebida[];
}

const LEGENDA: SituacaoSessaoOcs[] = ['DISPONIVEL', 'SOLICITADA', 'ASSINADA', 'EXPIRADA'];

/**
 * Grade de sessoes (T19-FE-2): uma linha por procedimento, com uma casela para cada unidade da
 * quantidade autorizada, de 1 ate a quantidade. As cores seguem a regra 7.2 e a legenda fica abaixo.
 */
export default function GradeSessoes({ procedimentos, sessoes }: Props) {
  return (
    <div className="gr-grade">
      {procedimentos.map((procedimento) => {
        const doProcedimento = sessoesDoProcedimento(sessoes, procedimento.codDgp);
        const casas = Array.from({ length: procedimento.quantidade }, (_, indice) => indice + 1);
        return (
          <div key={procedimento.codDgp} className="gr-grade__procedimento">
            <h3>
              {procedimento.descricao} <span className="gr-codigo">({procedimento.codDgp})</span>
            </h3>
            <ol className="gr-grade__sessoes" aria-label={`Sessões de ${procedimento.descricao}`}>
              {casas.map((numero) => {
                const sessao = doProcedimento.find((s) => s.numero === numero);
                const rotulo = sessao ? ROTULO_SESSAO[sessao.status] : 'Sem sessão cadastrada';
                const classe = sessao ? CLASSE_SESSAO[sessao.status] : 'gr-sessao--ausente';
                return (
                  <li
                    key={numero}
                    className={`gr-sessao ${classe}`}
                    aria-label={`Sessão ${numero}: ${rotulo}`}
                    title={rotulo}
                  >
                    {numero}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}

      <ul className="gr-legenda" aria-label="Legenda das sessões">
        {LEGENDA.map((situacao) => (
          <li key={situacao}>
            <span className={`gr-sessao ${CLASSE_SESSAO[situacao]}`} aria-hidden="true" /> {ROTULO_SESSAO[situacao]}
          </li>
        ))}
      </ul>
    </div>
  );
}
