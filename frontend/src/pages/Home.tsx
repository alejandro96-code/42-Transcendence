import Header from '../components/header'
import Footer from '../components/footer'
import PersonalData from '../components/personal_data'
import PostFeed from '../components/post'
import Friends from '../components/friends'


function Home() {
  return (
    <div>
      <Header />
      <div className="grid">
        <div className="col-12 lg:col-3">
          <PersonalData />
        </div>
        <div className="col-12 lg:col-6">
          <PostFeed />
        </div>
        <div className="col-12 lg:col-3">
          <Friends />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home