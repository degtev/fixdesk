import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Logo } from '../../components/Logo/Logo';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { VerificationCodeInput } from '../../components/VerificationCodeInput/VerificationCodeInput';
import '../Login/Login.css';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 - форма, 2 - подтверждение кода
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1Submit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      await api.registerInternal({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        position
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.verifyEmail({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        position,
        role: 'internal',
        verificationCode,
      });
      navigate('/login/email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подтверждения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Logo />

        {step === 1 ? (
          <>
            <h1 className="auth-title">Регистрация в Fixdesk</h1>


            <form className="auth-form" onSubmit={handleStep1Submit}>
              <Input
                type="text"
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />

              <Input
                type="text"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                type="text"
                placeholder="Должность"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />

              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>

            <div className="auth-footer-links">
              <div className="auth-footer-link">
                <span>Уже есть аккаунт? </span>
                <Link to="/login">Войти</Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-title">Подтверждение регистрации</h1>
            <p className="auth-description">
              Код подтверждения отправлен на {email}
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleStep2Submit}>
              <div style={{ width: '100%', marginBottom: '24px' }}>
                <VerificationCodeInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  length={6}
                  disabled={loading}
                />
              </div>

              <Button type="submit" fullWidth disabled={loading || verificationCode.length !== 6}>
                {loading ? 'Подтверждение...' : 'Подтвердить'}
              </Button>
            </form>

            <div className="auth-footer-links">
              <div className="auth-footer-link">
                <Link to="#" onClick={(e) => { e.preventDefault(); setStep(1); }}>
                  Изменить данные
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

