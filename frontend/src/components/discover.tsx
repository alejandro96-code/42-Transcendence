import { useState } from 'react'
import { Button } from 'primereact/button'

interface CommunityTopic {
  id: number
  name: string
  members: number
  color: string
}

interface Trend {
  id: number
  label: string
  posts: number
}

interface SocialEvent {
  id: number
  title: string
  date: string
  location: string
  tag: string
}

const communityTopics: CommunityTopic[] = [
  { id: 1, name: 'Frontend', members: 382, color: '#63c0ff' },
  { id: 2, name: 'IA aplicada', members: 214, color: '#2d7eea' },
  { id: 3, name: 'Eventos 42', members: 178, color: '#8de0ff' },
  { id: 4, name: 'UX Writing', members: 96, color: '#16c784' },
  { id: 5, name: 'Startups', members: 143, color: '#ef4444' },
]

const trends: Trend[] = [
  { id: 1, label: '#showcase', posts: 64 },
  { id: 2, label: '#recursos', posts: 51 },
  { id: 3, label: '#designreview', posts: 37 },
  { id: 4, label: '#portfolio', posts: 29 },
]

const socialEvents: SocialEvent[] = [
  { id: 1, title: 'Cafecito de producto', date: '06 May', location: 'Sala 2A', tag: 'Networking' },
  { id: 2, title: 'Meetup de creadores', date: '10 May', location: 'Auditorio', tag: 'Comunidad' },
  { id: 3, title: 'Charla express: feedback rapido', date: '14 May', location: 'Online', tag: 'Formacion' },
]

function Discover() {
  const [activeSection, setActiveSection] = useState<'communities' | 'trends' | 'events'>('communities')

  return (
    <div className='discover-container'>
      <div className="surface-card border-round-sm p-3">
        <div className="discover-tabs">
          <Button
            label="Comunidades"
            className={`discover-tab ${activeSection === 'communities' ? 'is-active' : ''}`}
            onClick={() => setActiveSection('communities')}
          />
          <Button
            label="Tendencias"
            className={`discover-tab ${activeSection === 'trends' ? 'is-active' : ''}`}
            onClick={() => setActiveSection('trends')}
          />
          <Button
            label="Eventos"
            className={`discover-tab ${activeSection === 'events' ? 'is-active' : ''}`}
            onClick={() => setActiveSection('events')}
          />
        </div>

        <div className="discover-panel">
          {activeSection === 'communities' && (
            <section className="discover-section communities">
              <div className="section-header">
                <h4>Comunidades y temas</h4>
                <span className="section-meta">Sugeridos</span>
              </div>
              <div className="topic-grid">
                {communityTopics.map((topic) => (
                  <div key={topic.id} className="topic-card" style={{ borderColor: topic.color }}>
                    <div className="topic-tag" style={{ background: topic.color }} />
                    <div>
                      <h5>{topic.name}</h5>
                      <span>{topic.members} miembros</span>
                    </div>
                    <Button label="Seguir" className="topic-action" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === 'trends' && (
            <section className="discover-section trends">
              <div className="section-header">
                <h4>Tendencias</h4>
                <span className="section-meta">Esta semana</span>
              </div>
              <div className="trend-list">
                {trends.map((trend) => (
                  <div key={trend.id} className="trend-item">
                    <span className="trend-label">{trend.label}</span>
                    <span className="trend-count">{trend.posts} posts</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === 'events' && (
            <section className="discover-section events">
              <div className="section-header">
                <h4>Eventos sociales</h4>
                <span className="section-meta">Proximos</span>
              </div>
              <div className="event-list">
                {socialEvents.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-date">
                      <span>{event.date}</span>
                      <span className="event-tag">{event.tag}</span>
                    </div>
                    <div>
                      <h5>{event.title}</h5>
                      <p>{event.location}</p>
                    </div>
                    <Button label="Ver" className="event-action" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default Discover
