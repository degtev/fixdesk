import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Logo } from '../../components/Logo/Logo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import '../Login/Login.css';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      setError('Недействительная ссылка восстановления');
    } else {
      setToken(tokenParam);
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (!token || !email) {
      setError('Токен или email не найден');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, email, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <Logo />

          <h1 className="auth-title">Ошибка</h1>

          <div className="auth-error">
            {error || 'Недействительная ссылка восстановления'}
          </div>

          <Button fullWidth onClick={() => navigate('/forgot-password')} style={{ marginTop: '20px' }}>
            Запросить новую ссылку
          </Button>

          <div className="auth-footer-links">
            <div className="auth-footer-link">
              <Link to="/login">Вернуться к авторизации</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <Logo />

          <h1 className="auth-title">Пароль изменен</h1>

          <div className="auth-success">
            <p>Ваш пароль успешно изменен!</p>
            <p>Теперь вы можете войти с новым паролем.</p>
          </div>

          <Button fullWidth onClick={() => navigate('/login/email')} style={{ marginTop: '20px' }}>
            Войти
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Logo />

        <h1 className="auth-title">Создание нового пароля</h1>

        <p className="auth-description">
          Придумайте новый пароль для {email}
        </p>


        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="Новый пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
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

