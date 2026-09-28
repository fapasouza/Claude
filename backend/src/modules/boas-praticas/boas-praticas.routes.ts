import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { naoEncontrado, proibido, requisicaoInvalida } from "../../lib/erros.js";
import { podeModerar } from "../../lib/perfis.js";
import { autenticar, usuarioDa } from "../../middlewares/autenticacao.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { STATUS, TRANSICOES, podeEditar, podeTransicionar, podeVisualizar, type Acao } from "./fluxo.js";

const idSchema = z.coerce.number().int().positive();

const boaPraticaSchema = z.object({
  titulo: z.string().trim().min(5).max(200),
  resumo: z.string().trim().min(10).max(500),
  conteudo: z.string().trim().min(20),
  categoriaId: z.coerce.number().int().positive(),
});

const filtroSchema = z.object({
  busca: z.string().trim().max(100).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUS).optional(),
  minhas: z.enum(["true", "false"]).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

const incluirResumo = {
  categoria: { select: { id: true, nome: true } },
  autor: { select: { id: true, nome: true } },
  aprovador: { select: { id: true, nome: true } },
} as const;

export const boasPraticasRoutes = Router();

boasPraticasRoutes.use(autenticar);

boasPraticasRoutes.get("/", async (req, res) => {
  const usuario = usuarioDa(req);
  const f = filtroSchema.parse(req.query);

  const filtros: Prisma.BoaPraticaWhereInput[] = [];
  if (!podeModerar(usuario.perfil)) {
    filtros.push({ OR: [{ status: "PUBLICADA" }, { autorId: usuario.id }] });
  }
  if (f.minhas === "true") filtros.push({ autorId: usuario.id });
  if (f.status) filtros.push({ status: f.status });
  if (f.categoriaId) filtros.push({ categoriaId: f.categoriaId });
  if (f.busca) {
    // MySQL (utf8mb4_0900_ai_ci) e SQL Server (collation padrão CI_AS) já comparam sem diferenciar maiúsculas.
    filtros.push({ OR: [{ titulo: { contains: f.busca } }, { resumo: { contains: f.busca } }] });
  }

  const where: Prisma.BoaPraticaWhereInput = { AND: filtros };
  const [total, itens] = await prisma.$transaction([
    prisma.boaPratica.count({ where }),
    prisma.boaPratica.findMany({
      where,
      include: incluirResumo,
      omit: { conteudo: true },
      orderBy: [{ atualizadoEm: "desc" }, { id: "desc" }],
      skip: (f.pagina - 1) * f.porPagina,
      take: f.porPagina,
    }),
  ]);

  res.json({ itens, total, pagina: f.pagina, porPagina: f.porPagina });
});

boasPraticasRoutes.get("/:id", async (req, res) => {
  const usuario = usuarioDa(req);
  const boaPratica = await prisma.boaPratica.findUnique({
    where: { id: idSchema.parse(req.params.id) },
    include: {
      ...incluirResumo,
      historico: {
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      },
    },
  });

  if (!boaPratica || !podeVisualizar(boaPratica.status, usuario, boaPratica.autorId)) {
    throw naoEncontrado("Boa prática");
  }

  res.json({
    ...boaPratica,
    permissoes: {
      editar: podeEditar(boaPratica.status, usuario, boaPratica.autorId),
      excluir: boaPratica.status === "RASCUNHO" && boaPratica.autorId === usuario.id,
      acoes: (Object.keys(TRANSICOES) as Acao[]).filter((a) =>
        podeTransicionar(a, boaPratica.status, usuario, boaPratica.autorId),
      ),
    },
  });
});

async function garantirCategoriaAtiva(categoriaId: number) {
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  if (!categoria || !categoria.ativo) throw requisicaoInvalida("Categoria inválida ou inativa.");
}

boasPraticasRoutes.post("/", async (req, res) => {
  const usuario = usuarioDa(req);
  const dados = boaPraticaSchema.parse(req.body);
  await garantirCategoriaAtiva(dados.categoriaId);

  const boaPratica = await prisma.boaPratica.create({
    data: {
      ...dados,
      autorId: usuario.id,
      historico: { create: { usuarioId: usuario.id, acao: "CRIACAO", statusPara: "RASCUNHO" } },
    },
    include: incluirResumo,
  });
  res.status(201).json(boaPratica);
});

async function buscarOuFalhar(id: number) {
  const boaPratica = await prisma.boaPratica.findUnique({ where: { id } });
  if (!boaPratica) throw naoEncontrado("Boa prática");
  return boaPratica;
}

boasPraticasRoutes.put("/:id", async (req, res) => {
  const usuario = usuarioDa(req);
  const atual = await buscarOuFalhar(idSchema.parse(req.params.id));
  if (!podeVisualizar(atual.status, usuario, atual.autorId)) throw naoEncontrado("Boa prática");
  if (!podeEditar(atual.status, usuario, atual.autorId)) throw proibido("Esta boa prática não pode ser editada.");

  const dados = boaPraticaSchema.partial().parse(req.body);
  if (dados.categoriaId && dados.categoriaId !== atual.categoriaId) await garantirCategoriaAtiva(dados.categoriaId);

  const boaPratica = await prisma.boaPratica.update({
    where: { id: atual.id },
    data: {
      ...dados,
      historico: {
        create: { usuarioId: usuario.id, acao: "EDICAO", statusDe: atual.status, statusPara: atual.status },
      },
    },
    include: incluirResumo,
  });
  res.json(boaPratica);
});

boasPraticasRoutes.delete("/:id", async (req, res) => {
  const usuario = usuarioDa(req);
  const atual = await buscarOuFalhar(idSchema.parse(req.params.id));
  if (!podeVisualizar(atual.status, usuario, atual.autorId)) throw naoEncontrado("Boa prática");
  if (atual.status !== "RASCUNHO" || atual.autorId !== usuario.id) {
    throw proibido("Somente o autor pode excluir, e apenas rascunhos.");
  }

  await prisma.$transaction([
    prisma.historicoBoaPratica.deleteMany({ where: { boaPraticaId: atual.id } }),
    prisma.boaPratica.delete({ where: { id: atual.id } }),
  ]);
  res.status(204).end();
});

const rotasDeAcao: Record<string, Acao> = {
  "enviar-revisao": "ENVIO_REVISAO",
  aprovar: "APROVACAO",
  devolver: "DEVOLUCAO",
  arquivar: "ARQUIVAMENTO",
};

const acaoSchema = z.object({ comentario: z.string().trim().max(1000).optional() });

for (const [rota, acao] of Object.entries(rotasDeAcao)) {
  boasPraticasRoutes.post(`/:id/${rota}`, async (req, res) => {
    const usuario = usuarioDa(req);
    const atual = await buscarOuFalhar(idSchema.parse(req.params.id));
    if (!podeVisualizar(atual.status, usuario, atual.autorId)) throw naoEncontrado("Boa prática");

    const { comentario } = acaoSchema.parse(req.body ?? {});
    if (acao === "DEVOLUCAO" && !comentario) {
      throw requisicaoInvalida("Informe o motivo da devolução no comentário.");
    }
    if (!podeTransicionar(acao, atual.status, usuario, atual.autorId)) {
      throw proibido(`Ação não permitida para uma boa prática com status ${atual.status}.`);
    }

    const para = TRANSICOES[acao].para;
    await prisma.$transaction(async (tx) => {
      // A condição no status evita que duas pessoas apliquem ações concorrentes sobre o mesmo estado.
      const { count } = await tx.boaPratica.updateMany({
        where: { id: atual.id, status: atual.status },
        data: {
          status: para,
          ...(acao === "APROVACAO" ? { aprovadorId: usuario.id, publicadaEm: new Date() } : {}),
        },
      });
      if (count === 0) {
        throw requisicaoInvalida("A boa prática foi alterada por outra pessoa. Recarregue a página.");
      }
      await tx.historicoBoaPratica.create({
        data: { boaPraticaId: atual.id, usuarioId: usuario.id, acao, statusDe: atual.status, statusPara: para, comentario },
      });
    });

    res.json(await prisma.boaPratica.findUnique({ where: { id: atual.id }, include: incluirResumo }));
  });
}
