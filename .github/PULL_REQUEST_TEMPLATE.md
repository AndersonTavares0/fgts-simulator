## Mudança

Descreva o problema, a solução e os limites. Informe mudanças de cálculo, dados persistidos ou compatibilidade com versões anteriores.

## Evidências

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `node scripts/check-release.mjs`

Registre os comandos executados e seus resultados. Explique itens não aplicáveis; não marque verificações não executadas.

## Comportamento e privacidade

- [ ] Acrescentei regressões para lógica alterada e atualizei as premissas estimativas quando necessário.
- [ ] Verifiquei saldo disponível/retido, modalidades e avos afetados por esta mudança.
- [ ] Mantive consentimentos separados para processar doença grave e salvar esse dado no histórico local.
- [ ] Não enviei entradas da simulação a terceiros nem acrescentei dados pessoais desnecessários.
- [ ] Testei os estados afetados: vazio, erro, resultado desatualizado, histórico, PDF e offline.
- [ ] Para UI: conferi teclado, foco, labels, temas e largura de 320px.

## Publicação

Merge em `main` executa qualidade, sem promover produção. Para release, preparar versão/lock/notas e seguir [docs/releases.md](https://github.com/AndersonTavares0/fgts-simulator/blob/main/docs/releases.md).

Cenários manuais executados, limitações e riscos:
