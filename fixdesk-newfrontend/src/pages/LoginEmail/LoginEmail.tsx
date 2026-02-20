import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { authUtils } from '../../utils/auth';
import { Logo } from '../../components/Logo/Logo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import '../Login/Login.css';

export const LoginEmail: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      authUtils.saveToken(response.token);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
                
        <Logo />
        
        <h1 className="auth-title">Авторизация в Fixdesk</h1>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

{error && <div className="auth-error">{error}</div>}
          
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Вход...' : 'Авторизация'}
          </Button>
        </form>

       

        <div className="auth-footer-links">
          <div className="auth-footer-link">
            <span>Нет аккаунта? </span>
            <Link to="/register">Нажмите чтобы создать</Link>
          </div>
          <div className="auth-footer-link">
            <Link to="/forgot-password">Забыли пароль?</Link>
          </div>
          <div className="auth-footer-link">
            <Link to="/login">Назад</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

