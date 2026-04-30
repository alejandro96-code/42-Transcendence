import Header from '../components/header'
import Footer from '../components/footer'
import PersonalData from '../components/personal_data'
import PostFeed from '../components/posts'
import Friends from '../components/friends'
import Discover from '../components/discover'

const PUBLIC_USER = {
  full_name: 'Asier Galeán Ullíbarri',
  username: 'Asgalean',
  email: 'asgalean@student.42urduliz.com',
  avatar_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80',
}

const PUBLIC_PROFILE_DETAILS = {
  headline: 'Investigando producto y comunidad',
  interests: ['Producto', 'Comunidad', 'UX', 'Eventos', 'Mentoria'],
  about: 'Me gusta conectar personas con proyectos, documentar aprendizajes y organizar eventos con impacto real.',
}

const PUBLIC_POSTS = [
  {
    id: 201,
    content: 'Resumen del meetup de hoy: 5 ideas que me llevo para mejorar el onboarding de nuevos miembros.',
    date: 'Hace 2 horas',
    isFromFriend: false,
    image: null,
  },
  {
    id: 202,
    content: 'Estoy preparando una guia de recursos para quienes quieren entrar en producto. Si te interesa, avisame.',
    date: 'Ayer',
    isFromFriend: false,
    image: null,
  },
  {
    id: 203,
    content: 'Foto del panel de mentoria que hicimos el viernes. Gracias a todos los que se pasaron.',
    date: 'Hace 3 dias',
    isFromFriend: false,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
  },
]

const PUBLIC_FRIENDS = [
  { id: 1, name: 'mgarcia', online: true },
  { id: 2, name: 'jperez', online: false },
  { id: 3, name: 'alopez', online: true },
  { id: 4, name: 'varysito', online: false },
  { id: 5, name: 'iramos', online: true },
  { id: 6, name: 'cvaldez', online: false },
]

function PerfilPublico() {
  return (
    <div className="app-shell perfil-layout">
      <Header />
      <main className="app-content">
        <div className="grid content-grid">
          <div className="col-12 lg:col-3 left-pane">
            <PersonalData
              profileUser={PUBLIC_USER}
              profileDetails={PUBLIC_PROFILE_DETAILS}
              readOnly
            />
          </div>
          <div className="col-12 lg:col-6 middle-pane">
            <PostFeed readOnly initialPosts={PUBLIC_POSTS} />
          </div>
          <div className="col-12 lg:col-3 right-pane">
            <div className="right-pane-item">
              <Friends readOnly initialFriends={PUBLIC_FRIENDS} />
            </div>
            <div className="right-pane-item">
              <Discover />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default PerfilPublico
