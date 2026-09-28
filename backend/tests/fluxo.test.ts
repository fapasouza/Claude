import { describe, expect, it } from "vitest";
import { podeEditar, podeTransicionar, podeVisualizar } from "../src/modules/boas-praticas/fluxo.js";

const autor = { id: 1, perfil: "COLABORADOR" as const };
const outro = { id: 2, perfil: "COLABORADOR" as const };
const gestor = { id: 3, perfil: "GESTOR" as const };

describe("fluxo de aprovação", () => {
  it("apenas o autor envia para revisão, a partir de rascunho ou devolvida", () => {
    expect(podeTransicionar("ENVIO_REVISAO", "RASCUNHO", autor, 1)).toBe(true);
    expect(podeTransicionar("ENVIO_REVISAO", "DEVOLVIDA", autor, 1)).toBe(true);
    expect(podeTransicionar("ENVIO_REVISAO", "RASCUNHO", outro, 1)).toBe(false);
    expect(podeTransicionar("ENVIO_REVISAO", "PUBLICADA", autor, 1)).toBe(false);
  });

  it("apenas moderadores aprovam, devolvem e arquivam", () => {
    expect(podeTransicionar("APROVACAO", "EM_REVISAO", gestor, 1)).toBe(true);
    expect(podeTransicionar("APROVACAO", "EM_REVISAO", autor, 1)).toBe(false);
    expect(podeTransicionar("DEVOLUCAO", "EM_REVISAO", gestor, 1)).toBe(true);
    expect(podeTransicionar("ARQUIVAMENTO", "PUBLICADA", gestor, 1)).toBe(true);
    expect(podeTransicionar("ARQUIVAMENTO", "EM_REVISAO", gestor, 1)).toBe(false);
  });

  it("controla edição e visualização", () => {
    expect(podeEditar("RASCUNHO", autor, 1)).toBe(true);
    expect(podeEditar("EM_REVISAO", autor, 1)).toBe(false);
    expect(podeEditar("EM_REVISAO", gestor, 1)).toBe(true);
    expect(podeEditar("ARQUIVADA", gestor, 1)).toBe(false);
    expect(podeVisualizar("RASCUNHO", outro, 1)).toBe(false);
    expect(podeVisualizar("PUBLICADA", outro, 1)).toBe(true);
    expect(podeVisualizar("RASCUNHO", gestor, 1)).toBe(true);
  });
});
