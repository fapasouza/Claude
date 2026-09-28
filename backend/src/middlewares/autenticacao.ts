import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ErroApp, proibido } from "../lib/erros.js";
import type { Perfil } from "../lib/perfis.js";

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

export function gerarToken(usuario: UsuarioAutenticado): string {
  return jwt.sign(
    { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    env.JWT_SECRET,
    { subject: String(usuario.id), expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");
  if (tipo !== "Bearer" || !token) {
    throw new ErroApp(401, "Token de acesso não informado.");
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    req.usuario = {
      id: Number(payload.sub),
      nome: payload.nome,
      email: payload.email,
      perfil: payload.perfil,
    };
    next();
  } catch {
    throw new ErroApp(401, "Token inválido ou expirado.");
  }
}

export function exigirPerfil(...perfis: Perfil[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      throw proibido();
    }
    next();
  };
}

/** Retorna o usuário autenticado (use apenas em rotas protegidas por `autenticar`). */
export function usuarioDa(req: Request): UsuarioAutenticado {
  if (!req.usuario) throw new ErroApp(401, "Não autenticado.");
  return req.usuario;
}
