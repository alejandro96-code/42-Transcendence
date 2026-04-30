import Footer from "../components/footer"
import Header from "../components/header"

function Game() {
  return (
    <div className="app-shell game-layout">
      <Header />
      <main className="app-content">
        <div className="grid content-grid">
          <div className="col-12 lg:col-12">
            <section className="ui-surface game-main">
              <h1>Pagina de Game</h1>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Game