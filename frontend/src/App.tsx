import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ehModerador, useAuth } from './auth'
import Layout from './components/Layout'
import BoaPraticaDetalhe from './pages/BoaPraticaDetalhe'
import BoaPraticaForm from './pages/BoaPraticaForm'
import BoasPraticasLista from './pages/BoasPraticasLista'
import Categorias from './pages/Categorias'
import Login from './pages/Login'
import Usuarios from './pages/Usuarios'

function Protegida({ children, permitido = true }: { children: ReactNode; permitido?: boolean }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return <p className="carregando">Carregando…</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (!permitido) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const { usuario } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protegida><BoasPraticasLista key="publicadas" /></Protegida>} />
      <Route path="/minhas" element={<Protegida><BoasPraticasLista key="minhas" minhas /></Protegida>} />
      <Route path="/revisao" element={<Protegida permitido={ehModerador(usuario)}><BoasPraticasLista key="revisao" status="EM_REVISAO" /></Protegida>} />
      <Route path="/boas-praticas/nova" element={<Protegida><BoaPraticaForm key="nova" /></Protegida>} />
      <Route path="/boas-praticas/:id" element={<Protegida><BoaPraticaDetalhe /></Protegida>} />
      <Route path="/boas-praticas/:id/editar" element={<Protegida><BoaPraticaForm /></Protegida>} />
      <Route path="/categorias" element={<Protegida permitido={ehModerador(usuario)}><Categorias /></Protegida>} />
      <Route path="/usuarios" element={<Protegida permitido={usuario?.perfil === 'ADMIN'}><Usuarios /></Protegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
