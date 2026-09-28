export type Perfil = 'ADMIN' | 'GESTOR' | 'COLABORADOR'
export type Status = 'RASCUNHO' | 'EM_REVISAO' | 'DEVOLVIDA' | 'PUBLICADA' | 'ARQUIVADA'
export type Acao = 'ENVIO_REVISAO' | 'APROVACAO' | 'DEVOLUCAO' | 'ARQUIVAMENTO'

export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
  ativo?: boolean
}

export interface Categoria {
  id: number
  nome: string
  descricao: string | null
  ativo: boolean
  totalPublicadas?: number
}

interface Referencia {
  id: number
  nome: string
}

export interface BoaPratica {
  id: number
  titulo: string
  resumo: string
  conteudo?: string
  status: Status
  categoriaId: number
  categoria: Referencia
  autor: Referencia
  aprovador: Referencia | null
  publicadaEm: string | null
  atualizadoEm: string
}

export interface Historico {
  id: number
  acao: string
  statusDe: Status | null
  statusPara: Status
  comentario: string | null
  criadoEm: string
  usuario: Referencia
}

export interface BoaPraticaDetalhe extends BoaPratica {
  conteudo: string
  historico: Historico[]
  permissoes: { editar: boolean; excluir: boolean; acoes: Acao[] }
}

export interface Pagina<T> {
  itens: T[]
  total: number
  pagina: number
  porPagina: number
}

export const STATUS_ROTULO: Record<Status, string> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em revisão',
  DEVOLVIDA: 'Devolvida',
  PUBLICADA: 'Publicada',
  ARQUIVADA: 'Arquivada',
}

export const ACAO_ROTULO: Record<string, string> = {
  CRIACAO: 'Criou',
  EDICAO: 'Editou',
  ENVIO_REVISAO: 'Enviou para revisão',
  APROVACAO: 'Aprovou e publicou',
  DEVOLUCAO: 'Devolveu para ajustes',
  ARQUIVAMENTO: 'Arquivou',
}

export const ACAO_ROTA: Record<Acao, string> = {
  ENVIO_REVISAO: 'enviar-revisao',
  APROVACAO: 'aprovar',
  DEVOLUCAO: 'devolver',
  ARQUIVAMENTO: 'arquivar',
}

const CHAVE_TOKEN = 'boaspraticas.token'

export const tokenStorage = {
  obter: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (token: string) => localStorage.setItem(CHAVE_TOKEN, token),
  limpar: () => localStorage.removeItem(CHAVE_TOKEN),
}

export class ErroApi extends Error {
  status: number
  detalhes?: Record<string, string[]>

  constructor(status: number, mensagem: string, detalhes?: Record<string, string[]>) {
    super(mensagem)
    this.status = status
    this.detalhes = detalhes
  }
}

export async function api<T>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const token = tokenStorage.obter()
  const resposta = await fetch(`/api${caminho}`, {
    method: opcoes.metodo ?? 'GET',
    headers: {
      ...(opcoes.corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
  })

  if (resposta.status === 401 && token) {
    tokenStorage.limpar()
    window.location.assign('/login')
  }
  if (resposta.status === 204) return undefined as T

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new ErroApi(resposta.status, dados.erro ?? 'Erro inesperado.', dados.detalhes)
  }
  return dados as T
}

/** Mensagem legível de um erro da API, incluindo erros de validação por campo. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroApi) {
    const campos = erro.detalhes ? Object.entries(erro.detalhes).map(([c, m]) => `${c}: ${m.join(', ')}`) : []
    return [erro.message, ...campos].join(' ')
  }
  return 'Não foi possível conectar ao servidor.'
}

export const formatarData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
