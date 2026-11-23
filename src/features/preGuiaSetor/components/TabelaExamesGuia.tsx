import {
  MSG_ATENCAO,
  MSG_LISTA_VAZIA,
  MSG_NAO_LIDO,
  errosDaLinha,
  novaLinha,
  type LinhaExame,
} from '../examesGuia';

interface Props {
  linhas: LinhaExame[];
  onChange: (linhas: LinhaExame[]) => void;
  disabled?: boolean;
}

/** Tabela "Exames na Guia" editavel (T22-FE1). Editar nao grava nada: a gravacao acontece em Concluir. */
export default function TabelaExamesGuia({ linhas, onChange, disabled = false }: Props) {
  const atualizar = (chave: number, campo: 'codDgp' | 'descricao' | 'quantidade', valor: string) =>
    onChange(linhas.map((l) => (l.chave === chave ? { ...l, [campo]: valor, tocada: true } : l)));

  const marcarTocada = (chave: number) =>
    onChange(linhas.map((l) => (l.chave === chave && !l.tocada ? { ...l, tocada: true } : l)));

  const remover = (chave: number) => onChange(linhas.filter((l) => l.chave !== chave));

  const adicionar = () => onChange([...linhas, novaLinha()]);

  // Uma so linha, em branco e nunca tocada: a leitura nao achou exames.
  const naoLido =
    linhas.length === 1 && !linhas[0].tocada && linhas[0].codDgp === '' && linhas[0].descricao === '' && linhas[0].quantidade === '';

  return (
    <div className="pgs__exames-tabela">
      {naoLido && <p className="pgs__aviso">{MSG_NAO_LIDO}</p>}

      <table>
        <thead>
          <tr>
            <th scope="col">Cod DGP</th>
            <th scope="col">Descrição</th>
            <th scope="col">Quantidade</th>
            <th scope="col">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, indice) => {
            const erros = errosDaLinha(linha, linhas);
            const erroDe = (campo: keyof typeof erros) => (linha.tocada ? erros[campo] : undefined);
            const codErro = erroDe('codDgp');
            const descErro = erroDe('descricao');
            const qtdErro = erroDe('quantidade');
            const base = `exame-${linha.chave}`;
            return (
              <tr key={linha.chave}>
                <td>
                  <input
                    id={`${base}-cod`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={`Cod DGP do exame ${indice + 1}`}
                    aria-invalid={codErro ? true : undefined}
                    aria-describedby={codErro ? `${base}-cod-erro` : undefined}
                    value={linha.codDgp}
                    disabled={disabled}
                    onChange={(e) => atualizar(linha.chave, 'codDgp', e.target.value)}
                    onBlur={() => marcarTocada(linha.chave)}
                  />
                  {codErro && <p id={`${base}-cod-erro`} className="pgs__erro-campo">{codErro}</p>}
                </td>
                <td>
                  <input
                    id={`${base}-desc`}
                    type="text"
                    autoComplete="off"
                    aria-label={`Descrição do exame ${indice + 1}`}
                    aria-invalid={descErro ? true : undefined}
                    aria-describedby={descErro ? `${base}-desc-erro` : undefined}
                    value={linha.descricao}
                    disabled={disabled}
                    onChange={(e) => atualizar(linha.chave, 'descricao', e.target.value)}
                    onBlur={() => marcarTocada(linha.chave)}
                  />
                  {descErro && <p id={`${base}-desc-erro`} className="pgs__erro-campo">{descErro}</p>}
                </td>
                <td>
                  <input
                    id={`${base}-qtd`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={`Quantidade do exame ${indice + 1}`}
                    aria-invalid={qtdErro ? true : undefined}
                    aria-describedby={qtdErro ? `${base}-qtd-erro` : undefined}
                    value={linha.quantidade}
                    disabled={disabled}
                    onChange={(e) => atualizar(linha.chave, 'quantidade', e.target.value)}
                    onBlur={() => marcarTocada(linha.chave)}
                  />
                  {qtdErro && <p id={`${base}-qtd-erro`} className="pgs__erro-campo">{qtdErro}</p>}
                </td>
                <td>
                  <button
                    type="button"
                    className="botao"
                    disabled={disabled}
                    onClick={() => remover(linha.chave)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {linhas.length === 0 && <p role="alert" className="pgs__erro-campo">{MSG_LISTA_VAZIA}</p>}

      <button type="button" className="botao" disabled={disabled} onClick={adicionar}>
        Adicionar exame
      </button>

      <p className="pgs__pequeno">{MSG_ATENCAO}</p>
    </div>
  );
}
