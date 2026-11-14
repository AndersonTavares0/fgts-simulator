# Privacidade

Atualização: 11 de novembro de 2026.

Responsável pelo projeto: Anderson Tavares. Contato: [repositório do projeto](https://github.com/AndersonTavares0/fgts-simulator). Projeto acadêmico de extensão UNINTER.

## Cálculo e histórico

A aplicação calcula salário, período, modalidade de saída e opções exclusivamente no navegador. Não transmite essas entradas para um backend, analytics ou publicidade. A hospedagem GitHub Pages recebe requisições de arquivos e registra o IP por segurança, conforme [documentação do GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

As simulações permanecem apenas em memória até você escolher **Guardar**. Essa ação grava entradas, resultado, premissas, série e versões em IndexedDB neste navegador/dispositivo. Não há conta, nuvem, sincronização ou backup automático. O histórico permanece até você excluir os registros, limpar os dados do site ou o navegador removê-los por suas políticas de armazenamento. Sessões privadas podem ser temporárias.

Preferência de tema usa localStorage. Arquivos do aplicativo, fontes e bibliotecas usam Cache API para permitir acesso offline; esse cache não é um histórico de resultados.

## Informações de saúde

Selecionar doença grave pode revelar dado pessoal sensível. A interface exige consentimento específico antes desse cálculo. Guardar a simulação exige outra autorização, desmarcada inicialmente, mesmo se você já autorizou o cálculo. Não pedimos diagnóstico, nome, CPF ou comprovante médico.

Desmarcar o consentimento não exclui um registro anteriormente salvo. Para revogar a persistência, exclua esse registro ou limpe o histórico. Você pode continuar usando as demais modalidades sem consentir com dados de saúde.

## Acesso, correção e exclusão

Você pode consultar e reabrir registros pelo Histórico. Para corrigir dados, edite e calcule novamente; um novo salvamento cria nova simulação, sem alterar a anterior. Exclua um registro ou use **Limpar histórico**, com confirmação. A mensagem de sucesso aparece somente após a confirmação da transação.

Se o armazenamento estiver bloqueado ou cheio, o cálculo e a exportação em memória continuam disponíveis. Não apagamos registros automaticamente para liberar espaço. Armazenamento local não é um cofre autenticado: outros usuários do mesmo perfil e scripts autorizados na mesma origem podem acessá-lo.

O Pages atual compartilha origem com outros projetos do mesmo proprietário. Prefixos de banco/cache evitam colisões, mas pastas não isolam dados por segurança. Migrar para outro domínio não transfere o histórico automaticamente.

## Relatórios PDF

A exportação gera um arquivo local com os dados e premissas da simulação. Você decide onde guardá-lo e com quem compartilhá-lo. Excluir o histórico não exclui PDFs baixados, cópias ou arquivos já compartilhados. Um PDF é relatório informativo, não backup restaurável do histórico.

## Atualizações e offline

Uma atualização não deve forçar a recarga de formulários. Quando há versão nova, o rodapé mostra **Atualizar agora** e nada recarrega sem esse acionamento; fechar todas as abas do simulador também aplica a versão já baixada. Sem conexão, o aplicativo pode continuar executando a versão instalada e suas premissas anteriores.

Esta política descreve o funcionamento do projeto; não constitui certificação jurídica de conformidade LGPD. Consulte a [Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) sobre os direitos do titular e tratamento de dados pessoais.
