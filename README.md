# Fisio Sono — Sistema de Locação de Equipamentos

Sistema local (web) para substituir a planilha de controle de pacientes,
equipamentos (CPAP) e pagamentos mensais. Roda na sua própria máquina —
não depende de nenhum serviço na nuvem — e pode ser acessado por outras
pessoas na mesma rede local (recepção, financeiro, etc.), cada uma com seu
próprio login.

## O que o sistema faz

- **Pacientes**: cadastro completo (cidade, datas de locação, aparelho,
  adesão à terapia, equipamento vinculado ao inventário).
- **Equipamentos**: inventário com status (disponível / em locação / vendido
  / em manutenção) e histórico de manutenção.
- **Pagamentos**: grade mensal por ano (igual à planilha), com status
  Pago / Pendente / Cortesia por paciente e por mês, e valor da mensalidade
  editável por ano.
- **Dashboard**: os mesmos indicadores da planilha original — pacientes
  cadastrados, locações ativas, equipamentos disponíveis, adesão à terapia,
  pendências do ano, situação dos equipamentos, pagamentos por mês, cidades
  com mais pacientes e faturamento estimado.
- **Login multiusuário**: cada pessoa tem sua própria conta; administradores
  podem criar e remover usuários em Configurações.

## Tecnologia

Next.js (React) + Prisma + SQLite. Todos os dados ficam em um único arquivo
de banco (`prisma/dev.db`) na sua máquina.

## Como rodar pela primeira vez

Pré-requisito: [Node.js](https://nodejs.org) 20 ou mais recente instalado.

```bash
npm install
npx prisma migrate deploy   # cria o banco de dados e as tabelas
npm run db:seed             # cria o usuário administrador padrão
npm run build
npm start
```

Acesse **http://localhost:3000** no navegador.

**Login inicial:**
- E-mail: `admin@fisiosono.local`
- Senha: `fisiosono123`

Troque essa senha assim que possível em **Configurações → Trocar minha
senha**, e crie os demais usuários em **Configurações → Novo usuário**.

### Para desenvolvimento (com recarregamento automático)

```bash
npm run dev
```

## Acessar de outros computadores na mesma rede (recepção, financeiro...)

Depois de rodar `npm start`, o terminal mostra um endereço de rede
(`Network: http://<seu-ip>:3000`). Qualquer computador ou celular na mesma
rede Wi-Fi/local pode acessar esse endereço no navegador e fazer login com
seu próprio usuário. Não é necessário instalar nada nos outros
computadores.

## Importando os dados da planilha original

O sistema já foi populado uma vez com os dados da planilha
`Locacao_de_equipamentos_dashboard_aprimorado.xlsx` (178 pacientes, 39
equipamentos e o histórico de pagamentos de 2023 a 2026).

**Os dados dos pacientes NÃO são versionados no Git** (arquivo
`prisma/dev.db` e `data/dados-importacao.json` estão no `.gitignore`) —
isso é proposital, para não colocar informações pessoais/de saúde reais em
um repositório de código. O banco de dados vive apenas na sua máquina.

Se precisar reimportar (por exemplo, em uma instalação nova a partir de uma
planilha atualizada):

1. Extraia os dados da planilha para `data/dados-importacao.json` no
   formato:
   ```json
   {
     "pacientes": [ { "nome": "...", "cidade": "...", "inicioLocacao": "2023-05-10", ... } ],
     "equipamentos": [ { "numeroSerie": "...", "tipo": "...", "status": "...", ... } ],
     "pagamentos": { "2023": [ { "nome": "...", "status": "...", "meses": { "1": "PAGO" } } ], "2024": [...] }
   }
   ```
2. Rode:
   ```bash
   npm run db:import
   ```
   O script cria pacientes, equipamentos e vincula pagamentos por nome.
   Ele **não apaga dados existentes** nem duplica registros já importados
   (se rodar duas vezes com o mesmo JSON, os pacientes seriam duplicados —
   rode apenas uma vez por planilha nova, ou zere o banco antes com
   `npx prisma migrate reset`).

Linhas de pagamento cujo nome não bate exatamente com um paciente
cadastrado são reportadas no terminal e ignoradas (normalmente por
pequenas diferenças de digitação entre as abas da planilha original) —
nesse caso, cadastre o paciente manualmente e adicione o ano de locação
em **Pagamentos**.

## Valor da mensalidade

O valor usado para calcular o faturamento estimado no Dashboard é editável
por ano na página **Pagamentos** (campo "Valor da mensalidade em AAAA").
Os valores iniciais (R$ 350 em 2023, R$ 370 de 2024 em diante) foram
copiados da planilha original — ajuste se necessário.

## Backup

Para fazer backup de todos os dados, basta copiar o arquivo
`prisma/dev.db`. Para restaurar, coloque o arquivo de backup nesse mesmo
caminho (com o servidor parado).

## Estrutura do projeto

```
prisma/schema.prisma       modelo de dados (pacientes, equipamentos, pagamentos, usuários)
prisma/seed.ts             cria o usuário admin padrão e a tabela de preços
scripts/import-xlsx.ts     importa dados/dados-importacao.json para o banco
src/app/(app)/...          páginas protegidas por login (dashboard, pacientes, equipamentos, pagamentos, configurações)
src/app/login              tela de login
src/lib/actions/...        operações de escrita (server actions)
```
