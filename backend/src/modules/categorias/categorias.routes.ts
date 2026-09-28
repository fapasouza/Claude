import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { autenticar, exigirPerfil } from "../../middlewares/autenticacao.js";

const categoriaSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  descricao: z.string().trim().max(500).nullish(),
  ativo: z.boolean().optional(),
});

const idSchema = z.coerce.number().int().positive();

export const categoriasRoutes = Router();

categoriasRoutes.use(autenticar);

categoriasRoutes.get("/", async (req, res) => {
  const somenteAtivas = req.query.ativas === "true";
  const categorias = await prisma.categoria.findMany({
    where: somenteAtivas ? { ativo: true } : undefined,
    orderBy: { nome: "asc" },
    include: { _count: { select: { boasPraticas: { where: { status: "PUBLICADA" } } } } },
  });
  res.json(
    categorias.map(({ _count, ...c }) => ({ ...c, totalPublicadas: _count.boasPraticas })),
  );
});

categoriasRoutes.post("/", exigirPerfil("ADMIN", "GESTOR"), async (req, res) => {
  const categoria = await prisma.categoria.create({ data: categoriaSchema.parse(req.body) });
  res.status(201).json(categoria);
});

categoriasRoutes.put("/:id", exigirPerfil("ADMIN", "GESTOR"), async (req, res) => {
  const categoria = await prisma.categoria.update({
    where: { id: idSchema.parse(req.params.id) },
    data: categoriaSchema.partial().parse(req.body),
  });
  res.json(categoria);
});
