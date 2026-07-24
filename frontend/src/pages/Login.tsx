import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { authAPI } from '../services/authAPI'

function Login() {
  const handleOAuthLogin = () => {
    authAPI.initiateLogin();
  };

  return (
    <main className='container-login'>
      <div className="login-shell">
        <Card className="shadow-8">
          <div className="text-center mb-5">
            <h1 className="font-semibold mb-2">Transcendence</h1>
            <p className="login-subtitle">Conecta, comparte y compite con tu comunidad.</p>
          </div>

          <div className="flex flex-column gap-4">
            <Button
              className="w-full"
              size="large"
              onClick={handleOAuthLogin}
            > SIGN IN WITH 42
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default Login
