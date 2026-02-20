import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import '../Login/Login.css';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      authUtils.saveToken(token);
      navigate('/profile');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Авторизация...</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Пожалуйста, подождите
        </p>
      </div>
    </div>
  );
};

