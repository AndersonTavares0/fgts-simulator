# Segurança

Não publique extratos, salários, dados de saúde ou relatórios pessoais em issues ou pull requests.

Para relatar uma vulnerabilidade, use **Security → Report a vulnerability** se o GitHub disponibilizar esse recurso no repositório. Se não estiver disponível, abra uma issue apenas solicitando um canal privado, sem detalhes técnicos exploráveis ou dados pessoais. O responsável é [AndersonTavares0](https://github.com/AndersonTavares0).

Inclua no canal privado a versão do aplicativo, navegador, passos mínimos e impacto, usando dados sintéticos. Não explore dados de terceiros nem execute testes destrutivos na hospedagem.

## Limites

O aplicativo não tem autenticação ou backend. IndexedDB não é um cofre: scripts na mesma origem e pessoas com acesso ao perfil do navegador podem acessar dados locais. PDFs baixados não são excluídos ao limpar o histórico. Consulte [privacidade](docs/legal/privacy.md).

Correções de código não alcançam imediatamente clientes offline. Atualizações preservam dados locais e não forçam recarga de formulários; versões e premissas são identificadas no relatório. Uma release publicada não significa que todos os clientes já a instalaram.
