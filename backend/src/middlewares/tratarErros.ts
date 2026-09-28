import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";
import { ErroApp } from "../lib/erros.js";
import { Prisma } from "../generated/prisma/client.js";

export function tratarErros(erro: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof ErroApp) {
    return res.status(erro.status).json({ erro: erro.message, detalhes: erro.detalhes });
  }
  if (erro instanceof ZodError) {
    return res.status(400).json({ erro: "Dados inválidos.", detalhes: z.flattenError(erro).fieldErrors });
  }
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === "P2002") return res.status(409).json({ erro: "Registro duplicado." });
    if (erro.code === "P2025") return res.status(404).json({ erro: "Registro não encontrado." });
  }
  console.error(erro);
  return res.status(500).json({ erro: "Erro interno do servidor." });
}
