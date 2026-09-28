import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

// Dados iniciais para desenvolvimento. Troque as senhas antes de homologar.
const SENHA_PADRAO = "Mudar@123";

async function main() {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

  const usuarios = [
    { nome: "Administrador", email: "admin@boaspraticas.local", perfil: "ADMIN" },
    { nome: "Gestor", email: "gestor@boaspraticas.local", perfil: "GESTOR" },
    { nome: "Colaborador", email: "colaborador@boaspraticas.local", perfil: "COLABORADOR" },
  ];
  for (const u of usuarios) {
    await prisma.usuario.upsert({ where: { email: u.email }, update: {}, create: { ...u, senhaHash } });
  }

  const categorias = [
    { nome: "Processos", descricao: "Padronização e melhoria de processos." },
    { nome: "Segurança", descricao: "Segurança da informação e do trabalho." },
    { nome: "Atendimento", descricao: "Relacionamento com clientes e parceiros." },
    { nome: "Tecnologia", descricao: "Uso de ferramentas e sistemas." },
  ];
  for (const c of categorias) {
    await prisma.categoria.upsert({ where: { nome: c.nome }, update: {}, create: c });
  }

  const colaborador = await prisma.usuario.findUniqueOrThrow({ where: { email: "colaborador@boaspraticas.local" } });
  const gestor = await prisma.usuario.findUniqueOrThrow({ where: { email: "gestor@boaspraticas.local" } });
  const processos = await prisma.categoria.findUniqueOrThrow({ where: { nome: "Processos" } });

  if ((await prisma.boaPratica.count()) === 0) {
    await prisma.boaPratica.create({
      data: {
        titulo: "Checklist antes de publicar uma mudança",
        resumo: "Lista de verificação simples para reduzir erros ao publicar alterações em produção.",
        conteudo:
          "1. Validar em homologação.\n2. Comunicar os usuários impactados.\n3. Ter um plano de retorno.\n4. Registrar a mudança.",
        status: "PUBLICADA",
        categoriaId: processos.id,
        autorId: colaborador.id,
        aprovadorId: gestor.id,
        publicadaEm: new Date(),
        historico: {
          create: [
            { usuarioId: colaborador.id, acao: "CRIACAO", statusPara: "RASCUNHO" },
            { usuarioId: colaborador.id, acao: "ENVIO_REVISAO", statusDe: "RASCUNHO", statusPara: "EM_REVISAO" },
            { usuarioId: gestor.id, acao: "APROVACAO", statusDe: "EM_REVISAO", statusPara: "PUBLICADA" },
          ],
        },
      },
    });
  }

  console.log(`Seed concluído. Usuários: ${usuarios.map((u) => u.email).join(", ")} | senha: ${SENHA_PADRAO}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
