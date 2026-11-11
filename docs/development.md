# Desenvolvimento e verificação

Use Node 24 LTS/npm 11, `npm ci` e os scripts de `package.json`. O build executa TypeScript antes do Vite. Scripts de CI e release são descritos em [releases](releases.md).

## Alterações financeiras

Antes de mudar fórmula, identifique todos os consumidores. Atualize o contrato, os cenários de teste e [premissas](legal/assumptions.md) juntos. Mantenha operações em Money/Decimal e versões explícitas. Testes devem verificar limites, regras e transições observáveis; não fixar texto de apresentação ou detalhes privados.

## Interface e offline

Confira a produção com `npm run build` e `npm run preview` no subdiretório `/fgts-simulator/`, não apenas o servidor dev. Verifique:

- 320/390/768/1024/1440px, temas, teclado e zoom; controles e erros com nomes acessíveis.
- Resultado vazio, inválido, calculado e entradas alteradas; salvar/PDF não usam resultado desatualizado.
- Salvar, fechar/reabrir, comparar duas, excluir e limpar com confirmação; falha de armazenamento não impede cálculo.
- Consentimentos de cálculo e persistência de saúde separados e desmarcados inicialmente.
- PDF curto/longo com acentos, paginação e mesmos valores da tela; texto selecionável não certifica PDF-UA.
- Instalar sem abrir gráfico/PDF, desconectar e usar esses recursos pela primeira vez.
- Atualização com duas abas e formulário pendente; nenhum reload forçado.
- Rollback do pacote A após B, preservando histórico, versão de banco e scope do service worker.

IndexedDB indisponível, quota, abort e upgrade bloqueado são estados recuperáveis, não motivo para apagar dados. Instalação e armazenamento variam por plataforma; emulação não substitui verificação em iOS real. Registre somente verificações efetivamente exercitadas.
