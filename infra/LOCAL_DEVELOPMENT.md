# Desenvolvimento local

## Pré-requisitos

- Node.js 20+
- Docker Desktop
- Git

## Passos

1. Subir banco e cache:
   docker compose -f infra/docker-compose.yml up -d

2. Instalar dependências da API:
   cd apps/api
   npm install

3. Rodar migrations do Prisma:
   npx prisma migrate dev

4. Popular o banco:
   npm run seed

5. Subir a API:
   npm run dev

A API ficará em http://localhost:3000

## Observação sobre VS Code Web

VS Code Web (github.dev / vscode.dev) não executa terminal.
Para rodar os comandos acima use GitHub Codespaces, Gitpod ou uma máquina local.