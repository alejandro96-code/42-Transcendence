import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { authAPI } from '../services/authAPI'

function Login() {
  const handleOAuthLogin = () => {
    authAPI.initiateLogin();
  };

  return (
    <div className='container-login'>
      <div className="login-shell">
        <Card className="shadow-8">
          <div className="text-center mb-5">
            <h1 className="font-semibold mb-2">Transcendence</h1>
            <p className="login-subtitle">Conecta, comparte y compite con tu comunidad.</p>
          </div>

          <div className="flex flex-column gap-4">
            <Button
              label="SIGN IN WITH 42"
              className="w-full"
              size="large"
              onClick={handleOAuthLogin}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Login
