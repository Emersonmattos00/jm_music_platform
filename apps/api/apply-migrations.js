const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const file = path.join(
    __dirname,
    'prisma',
    'migrations',
    '20261027172259_add_integrity_constraints_v2',
    'migration.sql',
  );

  const content = fs.readFileSync(file, 'utf8');

  // Remove comentários de linha (-- ...) e quebra por ponto e vírgula
  const statements = content
    .split('\n')
    .map((line) => line.replace(/--.*$/, '')) // remove comentários
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Encontrados ${statements.length} comandos SQL.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`✅ [${i + 1}/${statements.length}] OK`);
    } catch (e) {
      console.error(`❌ [${i + 1}/${statements.length}] Erro: ${e.message}`);
      console.error(`   Comando: ${stmt.slice(0, 100)}...`);
    }
  }

  await prisma.$disconnect();
}

main();