# Arquitetura

O aplicativo estático usa Vite e TypeScript. Não há servidor de cálculos nem conta de usuário.

## Fluxo

1. O formulário mantém um rascunho de entradas.
2. `simulate` valida dados e chama o domínio para produzir resultado e série mensal.
3. Um snapshot serializável reúne entradas, resultado, premissas, avisos e versões.
4. Apresentação, IndexedDB e o PDF consomem esse snapshot. Nenhum exportador lê números do DOM ou implementa juros separados.

`Money` e Decimal fazem operações financeiras em centavos. Conversão para números de desenho ocorre somente no gráfico; rótulos usam os valores originais. Avos de 13º/férias são independentes do calendário de depósitos. Veja [premissas](legal/assumptions.md).

## Persistência e versões

IndexedDB contém snapshots explícitos, não um cache recalculado ao abrir. Dados lidos passam por validação antes de uso. A confirmação de salvamento depende do commit da transação; falha não elimina o resultado em memória.

Versão do formato, do cálculo e do aplicativo possuem finalidades distintas. Alterar estrutura do banco exige migração compatível; alterar fórmula/calendário/arredondamento exige nova versão de cálculo. Não diminuir a versão do IndexedDB em rollback nem excluir banco para corrigir upgrade bloqueado.

## Offline

`generateSW` gera precache do pacote, inclusive fontes e chunks de gráfico/PDF. O service worker não calcula dinheiro nem armazena PDFs do usuário. O registro permanece no subdiretório do aplicativo. A atualização aguarda encerramento das abas antigas; a UI não chama skipWaiting para forçar recarga.

Banco e caches têm nomes específicos para evitar colisões, mas a origem compartilhada do Pages não fornece isolamento de segurança entre pastas. Não apagar todos os bancos/caches da origem. Mudança de domínio não migra dados automaticamente.
