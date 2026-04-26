import Header from '../components/header'
import Footer from '../components/footer'
import PersonalData from '../components/personal_data'
import PostFeed from '../components/posts'
import Friends from '../components/friends'
import Discover from '../components/discover'

function Perfil() {
  return (
    <div className="app-shell perfil-layout">
      <Header />
      <main className="app-content">
        <div className="grid content-grid">
          <div className="col-12 lg:col-3 left-pane">
            <PersonalData />
          </div>
          <div className="col-12 lg:col-6 middle-pane">
            <PostFeed />
          </div>
          <div className="col-12 lg:col-3 right-pane">
            <div className="right-pane-item">
              <Friends />
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

export default Perfil
