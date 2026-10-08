# Política de privacidade do Mocado

**Resumo: nenhum dado sai do seu navegador.**

- O Mocado **não faz requisições de rede**. Todos os dados (CPF, CNPJ, nomes, endereços etc.) são gerados localmente por algoritmos dentro da própria extensão. O dataset de endereços já vem embutido.
- **Não há telemetria**, analytics, rastreamento, contas nem servidores.
- O **histórico de perfis**, as **opções** e as **correções de campos** ficam só no armazenamento local da extensão (`browser.storage.local`), no seu computador. Desinstalar a extensão apaga tudo. Exportar o histórico gera um arquivo JSON que só você controla.
- O Mocado **só lê uma página quando você pede** (atalho, menu de contexto ou botão do popup), graças à permissão `activeTab`. Nesse momento ele lê a estrutura dos campos do formulário (atributos, rótulos) para decidir o que preencher e registra no histórico o domínio e a URL onde o preenchimento aconteceu. Ele **não lê nem guarda** o que você digitou nos campos.
- Os dados gerados são **fictícios** e servem **apenas para testes de software**.

## Permissões

| Permissão      | Por quê                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `activeTab`    | Acessar a aba atual só depois de um gesto seu (atalho, menu, popup).   |
| `scripting`    | Injetar o script que detecta e preenche os campos nessa aba.           |
| `storage`      | Guardar histórico, opções e correções localmente.                      |
| `contextMenus` | Itens "Preencher formulário", "Gerar aqui" e "Marcar este campo como". |

Dúvidas: abra uma issue no repositório do projeto.

---

**English:** Mocado makes no network requests and collects no data. Everything is generated and stored locally in your browser (`storage.local`). Pages are only accessed after an explicit user action (`activeTab`).
