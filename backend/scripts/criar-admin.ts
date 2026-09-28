/**
 * Cria (ou promove) um usuário ADMIN. Use em homologação/produção no lugar do seed.
 *
 * Uso: npm run criar-admin -w backend -- "Nome Completo" email@empresa.com.br "SenhaForte123"
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const [nome, emailInformado, senha] = process.argv.slice(2);

if (!nome || !emailInformado || !senha || senha.length < 8) {
  console.error('Uso: npm run criar-admin -- "Nome" email@empresa.com.br "senha com 8+ caracteres"');
  process.exit(1);
}

const email = emailInformado.toLowerCase();
const senhaHash = await bcrypt.hash(senha, 10);
const usuario = await prisma.usuario.upsert({
  where: { email },
  update: { nome, senhaHash, perfil: "ADMIN", ativo: true },
  create: { nome, email, senhaHash, perfil: "ADMIN" },
});
console.log(`Administrador pronto: ${usuario.email} (id ${usuario.id})`);
await prisma.$disconnect();
