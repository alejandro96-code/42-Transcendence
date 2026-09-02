import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './components/appRoutes'
import { NotificationsListener } from './components/NotificationsListener'
import '../public/locals/langConfig'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './styles/main.scss'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationsListener />
      <AppRoutes />
    </BrowserRouter>
  </Provider>
)