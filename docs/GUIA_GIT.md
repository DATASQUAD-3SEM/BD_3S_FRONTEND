# Guia de Git (passo a passo)

`develop` = fonte unica da verdade. Ninguem faz commit direto nela: sempre via Pull Request (PR).

## Todo dia, ao comecar
```bash
git checkout develop
git pull origin develop
git checkout -b feature/scrum-35-selecao-ocs
npm install        # se alguem mexeu no package.json
```

## Enquanto trabalha
```bash
git add .
git commit -m "SCRUM-35: lista OCS no componente SelecaoOcs"
git push -u origin feature/scrum-35-selecao-ocs
```
Ficou mais de 1 dia? `git pull origin develop` para trazer o que os colegas fizeram.

## Abrir o PR
GitHub -> "Compare & pull request" -> base = `develop` -> preencha o checklist -> peca 1 revisor.

## Regras do time
1. `git pull origin develop` antes de comecar.
2. Branch vive no maximo 2 dias.
3. Codigo compartilhado (`shared/`, `types.ts`) vai para a `develop` **antes** de outros usarem.
4. Cada pessoa no seu proprio arquivo/componente.

## Definition of Ready (task pode entrar na Sprint)
- Dependencias ja mergeadas na `develop` (o componente/endpoint que voce usa ja existe)
- Criterios de aceite escritos
- Estimativa em story points

## Definition of Done (task pode sair da Sprint)
- Codigo mergeado na `develop`
- Revisado por 1 pessoa
- Testado localmente (back + front juntos)

## Conflito?
Nao apague o codigo do colega. Procure `<<<<<<<` no arquivo, junte as duas versoes, apague as marcas,
`git add .` e `git commit`. Na duvida, chame quem mexeu no arquivo.
