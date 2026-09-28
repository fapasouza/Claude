import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requisicaoInvalida } from "../../lib/erros.js";
import { PERFIS } from "../../lib/perfis.js";
import { autenticar, exigirPerfil, usuarioDa } from "../../middlewares/autenticacao.js";

const camposPublicos = { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true } as const;

const criarSchema = z.object({
  nome: z.string().trim().min(3).max(150),
  email: z.email().max(191).transform((e) => e.toLowerCase()),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(100),
  perfil: z.enum(PERFIS).default("COLABORADOR"),
});

const atualizarSchema = criarSchema.partial().extend({ ativo: z.boolean().optional() });

const idSchema = z.coerce.number().int().positive();

export const usuariosRoutes = Router();

usuariosRoutes.use(autenticar, exigirPerfil("ADMIN"));

usuariosRoutes.get("/", async (_req, res) => {
  res.json(await prisma.usuario.findMany({ select: camposPublicos, orderBy: { nome: "asc" } }));
});

usuariosRoutes.post("/", async (req, res) => {
  const { senha, ...dados } = criarSchema.parse(req.body);
  const usuario = await prisma.usuario.create({
    data: { ...dados, senhaHash: await bcrypt.hash(senha, 10) },
    select: camposPublicos,
  });
  res.status(201).json(usuario);
});

usuariosRoutes.put("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { senha, ...dados } = atualizarSchema.parse(req.body);

  if (id === usuarioDa(req).id && (dados.ativo === false || (dados.perfil && dados.perfil !== "ADMIN"))) {
    throw requisicaoInvalida("Você não pode desativar ou rebaixar o próprio usuário.");
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: { ...dados, ...(senha ? { senhaHash: await bcrypt.hash(senha, 10) } : {}) },
    select: camposPublicos,
  });
  res.json(usuario);
});
