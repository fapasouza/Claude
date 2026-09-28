/**
 * Fluxo de aprovação das boas práticas.
 *
 *   RASCUNHO ──enviar──▶ EM_REVISAO ──aprovar──▶ PUBLICADA ──arquivar──▶ ARQUIVADA
 *       ▲                    │
 *       │                 devolver
 *   DEVOLVIDA ◀──────────────┘   (DEVOLVIDA também pode ser reenviada)
 */
import type { Perfil } from "../../lib/perfis.js";
import { podeModerar } from "../../lib/perfis.js";

export const STATUS = ["RASCUNHO", "EM_REVISAO", "DEVOLVIDA", "PUBLICADA", "ARQUIVADA"] as const;
export type Status = (typeof STATUS)[number];

export type Acao = "ENVIO_REVISAO" | "APROVACAO" | "DEVOLUCAO" | "ARQUIVAMENTO";

interface Transicao {
  de: Status[];
  para: Status;
  /** Quem pode executar: o autor da boa prática ou um moderador (ADMIN/GESTOR). */
  quem: "autor" | "moderador";
}

export const TRANSICOES: Record<Acao, Transicao> = {
  ENVIO_REVISAO: { de: ["RASCUNHO", "DEVOLVIDA"], para: "EM_REVISAO", quem: "autor" },
  APROVACAO: { de: ["EM_REVISAO"], para: "PUBLICADA", quem: "moderador" },
  DEVOLUCAO: { de: ["EM_REVISAO"], para: "DEVOLVIDA", quem: "moderador" },
  ARQUIVAMENTO: { de: ["PUBLICADA"], para: "ARQUIVADA", quem: "moderador" },
};

export function podeTransicionar(
  acao: Acao,
  statusAtual: string,
  usuario: { id: number; perfil: Perfil },
  autorId: number,
): boolean {
  const t = TRANSICOES[acao];
  if (!t.de.includes(statusAtual as Status)) return false;
  return t.quem === "autor" ? usuario.id === autorId : podeModerar(usuario.perfil);
}

/** Autor edita enquanto não foi enviada; moderador edita qualquer uma que não esteja arquivada. */
export function podeEditar(statusAtual: string, usuario: { id: number; perfil: Perfil }, autorId: number) {
  if (podeModerar(usuario.perfil)) return statusAtual !== "ARQUIVADA";
  return usuario.id === autorId && (statusAtual === "RASCUNHO" || statusAtual === "DEVOLVIDA");
}

/** Publicadas são visíveis a todos; as demais apenas ao autor e aos moderadores. */
export function podeVisualizar(statusAtual: string, usuario: { id: number; perfil: Perfil }, autorId: number) {
  return statusAtual === "PUBLICADA" || usuario.id === autorId || podeModerar(usuario.perfil);
}
