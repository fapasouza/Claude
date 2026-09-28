import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ACAO_ROTA, ACAO_ROTULO, api, formatarData, mensagemDeErro, type Acao, type BoaPraticaDetalhe as Detalhe } from '../api'
import StatusBadge from '../components/StatusBadge'

const BOTAO_ACAO: Record<Acao, string> = {
  ENVIO_REVISAO: 'Enviar para revisão',
  APROVACAO: 'Aprovar e publicar',
  DEVOLUCAO: 'Devolver para ajustes',
  ARQUIVAMENTO: 'Arquivar',
}

export default function BoaPraticaDetalhe() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [bp, setBp] = useState<Detalhe | null>(null)
  const [erro, setErro] = useState('')
  const [comentario, setComentario] = useState('')
  const [processando, setProcessando] = useState(false)

  const carregar = useCallback(() => {
    api<Detalhe>(`/boas-praticas/${id}`).then(setBp).catch((e) => setErro(mensagemDeErro(e)))
  }, [id])

  useEffect(carregar, [carregar])

  async function executar(acao: Acao) {
    setProcessando(true)
    setErro('')
    try {
      await api(`/boas-praticas/${id}/${ACAO_ROTA[acao]}`, { metodo: 'POST', corpo: { comentario: comentario || undefined } })
      setComentario('')
      carregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setProcessando(false)
    }
  }

  async function excluir() {
    if (!confirm('Excluir este rascunho definitivamente?')) return
    try {
      await api(`/boas-praticas/${id}`, { metodo: 'DELETE' })
      navegar('/minhas')
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  if (!bp) return erro ? <p className="erro">{erro}</p> : <p className="carregando">Carregando…</p>

  const { permissoes } = bp
  const moderando = permissoes.acoes.some((a) => a === 'APROVACAO' || a === 'DEVOLUCAO')

  return (
    <>
      <header className="cabecalho">
        <div>
          <h1>{bp.titulo}</h1>
          <p className="suave">
            {bp.categoria.nome} · por {bp.autor.nome}
            {bp.publicadaEm && ` · publicada em ${formatarData(bp.publicadaEm)}`}
            {bp.aprovador && ` · aprovada por ${bp.aprovador.nome}`}
          </p>
        </div>
        <StatusBadge status={bp.status} />
      </header>

      {erro && <p className="erro">{erro}</p>}

      <section className="cartao">
        <p className="resumo">{bp.resumo}</p>
        <div className="texto">{bp.conteudo}</div>
      </section>

      {(permissoes.editar || permissoes.excluir || permissoes.acoes.length > 0) && (
        <section className="cartao acoes">
          {moderando && (
            <label>
              Comentário da revisão (obrigatório para devolver)
              <textarea rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={1000} />
            </label>
          )}
          <div className="botoes">
            {permissoes.acoes.map((acao) => (
              <button
                key={acao}
                className={acao === 'APROVACAO' || acao === 'ENVIO_REVISAO' ? 'primario' : ''}
                disabled={processando}
                onClick={() => executar(acao)}
              >
                {BOTAO_ACAO[acao]}
              </button>
            ))}
            {permissoes.editar && <Link className="botao" to={`/boas-praticas/${bp.id}/editar`}>Editar</Link>}
            {permissoes.excluir && <button className="perigo" onClick={excluir}>Excluir</button>}
          </div>
        </section>
      )}

      <section className="cartao">
        <h2>Histórico</h2>
        <ol className="historico">
          {bp.historico.map((h) => (
            <li key={h.id}>
              <strong>{h.usuario.nome}</strong> {ACAO_ROTULO[h.acao]?.toLowerCase() ?? h.acao}
              <small className="suave"> · {formatarData(h.criadoEm)}</small>
              {h.comentario && <blockquote>{h.comentario}</blockquote>}
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
