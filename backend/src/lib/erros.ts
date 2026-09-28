export class ErroApp extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detalhes?: unknown,
  ) {
    super(message);
    this.name = "ErroApp";
  }
}

export const naoEncontrado = (recurso: string) => new ErroApp(404, `${recurso} não encontrado(a).`);
export const proibido = (mensagem = "Você não tem permissão para esta ação.") => new ErroApp(403, mensagem);
export const conflito = (mensagem: string) => new ErroApp(409, mensagem);
export const requisicaoInvalida = (mensagem: string) => new ErroApp(400, mensagem);
