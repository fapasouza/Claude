import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ErroApp } from "../../lib/erros.js";
import type { Perfil } from "../../lib/perfis.js";
import { autenticar, gerarToken, usuarioDa } from "../../middlewares/autenticacao.js";

const loginSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  senha: z.string().min(1),
});

export const authRoutes = Router();

authRoutes.post("/login", async (req, res) => {
  const { email, senha } = loginSchema.parse(req.body);
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw new ErroApp(401, "E-mail ou senha inválidos.");
  }

  const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil as Perfil };
  res.json({ token: gerarToken(dados), usuario: dados });
});

authRoutes.get("/me", autenticar, (req, res) => {
  res.json(usuarioDa(req));
});
