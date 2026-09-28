import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const temBanco = Boolean(process.env.DATABASE_URL_TEST);

describe.runIf(temBanco)("API Boas Práticas (integração)", async () => {
  const { criarApp } = await import("../src/app.js");
  const { prisma } = await import("../src/lib/prisma.js");
  const app = criarApp();
  const tokens: Record<string, string> = {};
  let categoriaId = 0;

  async function limpar() {
    await prisma.historicoBoaPratica.deleteMany();
    await prisma.boaPratica.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.usuario.deleteMany();
  }

  async function login(email: string) {
    return (await request(app).post("/api/auth/login").send({ email, senha: "Senha@123" })).body.token as string;
  }

  beforeAll(async () => {
    await limpar();
    const senhaHash = await bcrypt.hash("Senha@123", 4);
    for (const perfil of ["ADMIN", "GESTOR", "COLABORADOR"]) {
      const email = `${perfil.toLowerCase()}@teste.local`;
      await prisma.usuario.create({ data: { nome: perfil, email, perfil, senhaHash } });
      tokens[perfil] = await login(email);
    }
    await prisma.usuario.create({ data: { nome: "Outro", email: "outro@teste.local", senhaHash } });
    tokens.OUTRO = await login("outro@teste.local");
    categoriaId = (await prisma.categoria.create({ data: { nome: "Testes" } })).id;
  });

  afterAll(async () => {
    await limpar();
    await prisma.$disconnect();
  });

  const como = (perfil: string) => ({ Authorization: `Bearer ${tokens[perfil]}` });
  const novaPratica = (titulo: string) => ({
    titulo,
    resumo: "Resumo com tamanho suficiente.",
    conteudo: "Conteúdo com tamanho suficiente para validar.",
    categoriaId,
  });

  it("recusa login inválido e rotas sem token", async () => {
    expect((await request(app).post("/api/auth/login").send({ email: "admin@teste.local", senha: "x" })).status).toBe(401);
    expect((await request(app).get("/api/boas-praticas")).status).toBe(401);
  });

  it("restringe a gestão de usuários ao ADMIN", async () => {
    expect((await request(app).get("/api/usuarios").set(como("COLABORADOR"))).status).toBe(403);
    const res = await request(app).get("/api/usuarios").set(como("ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body[0]).not.toHaveProperty("senhaHash");
  });

  it("percorre o fluxo completo de aprovação com histórico", async () => {
    const criada = await request(app).post("/api/boas-praticas").set(como("COLABORADOR")).send(novaPratica("Prática de teste"));
    expect(criada.status).toBe(201);
    const url = `/api/boas-praticas/${criada.body.id}`;

    // Rascunho não aparece para outros colaboradores.
    expect((await request(app).get(url).set(como("OUTRO"))).status).toBe(404);

    expect((await request(app).post(`${url}/enviar-revisao`).set(como("COLABORADOR"))).status).toBe(200);
    expect((await request(app).post(`${url}/aprovar`).set(como("COLABORADOR"))).status).toBe(403);
    expect((await request(app).post(`${url}/devolver`).set(como("GESTOR")).send({})).status).toBe(400);

    const devolvida = await request(app).post(`${url}/devolver`).set(como("GESTOR")).send({ comentario: "Detalhar melhor." });
    expect(devolvida.body.status).toBe("DEVOLVIDA");

    await request(app).put(url).set(como("COLABORADOR")).send({ resumo: "Resumo revisado e detalhado." });
    await request(app).post(`${url}/enviar-revisao`).set(como("COLABORADOR"));
    const aprovada = await request(app).post(`${url}/aprovar`).set(como("GESTOR"));
    expect(aprovada.body.status).toBe("PUBLICADA");
    expect(aprovada.body.aprovador.nome).toBe("GESTOR");

    const detalhe = await request(app).get(url).set(como("OUTRO"));
    expect(detalhe.status).toBe(200);
    expect(detalhe.body.historico.map((h: { acao: string }) => h.acao)).toEqual([
      "APROVACAO",
      "ENVIO_REVISAO",
      "EDICAO",
      "DEVOLUCAO",
      "ENVIO_REVISAO",
      "CRIACAO",
    ]);
    expect(detalhe.body.permissoes).toEqual({ editar: false, excluir: false, acoes: [] });
  });

  it("filtra por busca sem diferenciar maiúsculas", async () => {
    const res = await request(app).get("/api/boas-praticas").query({ busca: "PRÁTICA DE" }).set(como("OUTRO"));
    expect(res.body.total).toBe(1);
  });

  it("permite ao autor excluir apenas rascunhos", async () => {
    const criada = await request(app).post("/api/boas-praticas").set(como("COLABORADOR")).send(novaPratica("Rascunho descartável"));
    const url = `/api/boas-praticas/${criada.body.id}`;
    expect((await request(app).delete(url).set(como("GESTOR"))).status).toBe(403);
    expect((await request(app).delete(url).set(como("COLABORADOR"))).status).toBe(204);
  });
});
