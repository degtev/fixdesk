import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Logo } from '../../components/Logo/Logo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import '../Login/Login.css';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Logo />
        
        <h1 className="auth-title">Восстановление пароля</h1>
        
        <p className="auth-description">
        Укажите Email<br></br>
        мы отправим на него ссылку для сброса пароля
        </p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={success}
          />
          
          <Button type="submit" fullWidth disabled={loading || success}>
            {success ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M19.68 4.24705L19.0249 3.59193C18.819 3.38592 18.5445 3.27258 18.2515 3.27258C17.9585 3.27258 17.6839 3.38592 17.478 3.59193L8.27268 12.7971L2.5213 7.04559C2.31545 6.8399 2.04081 6.7264 1.7478 6.7264C1.45496 6.7264 1.18049 6.8399 0.974471 7.04559L0.319187 7.70055C0.113171 7.90689 0 8.18169 0 8.47437C0 8.76722 0.113171 9.04185 0.319187 9.24787L6.81284 15.7412C6.82146 15.7534 6.83057 15.7648 6.84114 15.7752L7.49642 16.4196C7.70228 16.6248 7.97691 16.7274 8.27219 16.7274H8.27561C8.56878 16.7274 8.84341 16.6248 9.04894 16.4196L9.70439 15.7695C9.71496 15.7591 9.7239 15.7505 9.72927 15.7417L19.6798 5.79209C20.1067 5.36624 20.1067 4.6734 19.68 4.24705Z" fill="white"/>
                </svg>
                <span>Отправлено</span>
              </>
            ) : loading ? 'Отправка...' : 'Отправить'}
          </Button>
        </form>

        <div className="auth-footer-links">
          <div className="auth-footer-link">
            <Link to="/login">Вернуться к авторизации</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

