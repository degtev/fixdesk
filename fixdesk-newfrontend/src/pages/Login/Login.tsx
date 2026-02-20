import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Logo } from '../../components/Logo/Logo';
import { api } from '../../services/api';
import { authUtils } from '../../utils/auth';
import './Login.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }
  }, [searchParams]);

  const handleEmailClick = () => {
    navigate('/login/email');
  };

  const handleOAuth = (provider: string) => {
    if (provider === 'telegram') {
      const botId = import.meta.env.VITE_TELEGRAM_BOT_ID || '1234567890';
      const origin = encodeURIComponent(window.location.origin);
      const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&request_access=write`;

      const width = 550;
      const height = 470;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        telegramAuthUrl,
        'telegram-auth',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
      );

      if (!popup) {
        alert('Пожалуйста, разрешите всплывающие окна для этого сайта');
        return;
      }

      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== 'https://oauth.telegram.org') {
          return;
        }

        let telegramData: any = null;

        if (typeof event.data === 'string') {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.event === 'auth_result' && parsed.result) {
              telegramData = parsed.result;
            }
          } catch (e) {
            console.error('Failed to parse JSON:', e);
            return;
          }
        }
        else if (typeof event.data === 'object' && event.data.id && event.data.hash) {
          const { origin, ...dataWithoutOrigin } = event.data;
          telegramData = dataWithoutOrigin;
        }

        console.log('Telegram data extracted (without origin):', telegramData);

        if (telegramData && telegramData.id && telegramData.hash) {
          console.log('Processing Telegram auth...');
          try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/oauth/telegram/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(telegramData),
            });

            const data = await response.json();

            console.log('Backend response:', data);

            if (data.success && data.token) {
              console.log('Auth successful, saving token...');
              authUtils.saveToken(data.token);
              if (popup && !popup.closed) {
                popup.close();
              }
              navigate('/profile');
            } else {
              console.error('Auth failed:', data);
              const errorMsg = data.message || data.error || 'Неизвестная ошибка';
              console.error('Error details:', errorMsg);
              alert('Ошибка авторизации: ' + errorMsg);
              if (popup && !popup.closed) {
                popup.close();
              }
            }
          } catch (error: any) {
            console.error('Telegram auth error:', error);
            console.error('Error details:', error.message, error.stack);
            const errorMsg = error.message || 'Ошибка соединения с сервером';
            alert(errorMsg);
            if (popup && !popup.closed) {
              popup.close();
            }
          }

          window.removeEventListener('message', handleMessage);
          if (checkPopupClosed) {
            clearInterval(checkPopupClosed);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          console.log('Popup closed by user');
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

      setTimeout(() => {
        if (popup && !popup.closed) {
          console.log('Closing popup due to timeout');
          popup.close();
        }
        clearInterval(checkPopupClosed);
        window.removeEventListener('message', handleMessage);
      }, 300000);

      return;
    }

    let url = '';
    switch (provider) {
      case 'google':
        url = api.getGoogleAuthUrl();
        break;
      case 'yandex':
        url = api.getYandexAuthUrl();
        break;
      case 'github':
        url = api.getGithubAuthUrl();
        break;
    }
    window.location.href = url;
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Logo />

        <h1 className="auth-title">Авторизация в Fixdesk</h1>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-buttons">
          <button className="auth-method-btn auth-method-email" onClick={handleEmailClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
              <path d="M2.66663 4.95838L6.79996 8.25209C7.51109 8.81876 8.48883 8.81876 9.19996 8.25209L13.3333 4.95834" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.6667 3.54166H3.33333C2.59695 3.54166 2 4.17592 2 4.95832V12.0417C2 12.8241 2.59695 13.4583 3.33333 13.4583H12.6667C13.403 13.4583 14 12.8241 14 12.0417V4.95832C14 4.17592 13.403 3.54166 12.6667 3.54166Z" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Email</span>
          </button>

          <button className="auth-method-btn auth-method-google" onClick={() => handleOAuth('google')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14.9 8.16101C14.9 7.68501 14.861 7.20701 14.779 6.73901H8.13904V9.43401H11.941C11.8626 9.86529 11.6975 10.2762 11.4556 10.6418C11.2138 11.0074 10.9003 11.3201 10.534 11.561V13.311H12.803C14.135 12.091 14.9 10.291 14.9 8.16101Z" fill="#B2B8CD" />
              <path d="M8.13998 15C10.038 15 11.639 14.38 12.805 13.31L10.537 11.561C9.90598 11.988 9.09098 12.23 8.14198 12.23C6.30598 12.23 4.74898 10.998 4.18998 9.34201H1.84998V11.145C2.43958 12.3062 3.33956 13.2813 4.44994 13.9618C5.56033 14.6423 6.83764 15.0017 8.13998 15Z" fill="#B2B8CD" />
              <path d="M4.18697 9.34201C3.89208 8.47301 3.89208 7.53101 4.18697 6.66201V4.85901H1.84897C1.35661 5.83356 1.1001 6.91015 1.1001 8.00201C1.1001 9.09387 1.35661 10.1705 1.84897 11.145L4.18697 9.34201Z" fill="#B2B8CD" />
              <path d="M8.13998 3.76999C9.1426 3.75373 10.1118 4.13062 10.84 4.81999L12.85 2.82099C11.5725 1.63105 9.88564 0.979209 8.13998 1.00099C6.83728 0.999336 5.55966 1.35907 4.4492 2.04017C3.33875 2.72127 2.43898 3.69705 1.84998 4.85899L4.18598 6.65999C4.74198 5.00199 6.30198 3.76999 8.13798 3.76999H8.13998Z" fill="#B2B8CD" />
            </svg>
            <span>Google</span>
          </button>

          <button className="auth-method-btn auth-method-yandex" onClick={() => handleOAuth('yandex')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M8.79783 10.866L6.02235 16.9993H4L7.04775 10.4433C5.61598 9.72733 4.66035 8.43133 4.66035 6.034C4.65696 2.678 6.81747 1 9.38706 1H12V17H10.2513V10.8667L8.79783 10.866ZM10.2519 2.45267H9.31866C7.90992 2.45267 6.54385 3.37133 6.54385 6.034C6.54385 8.606 7.79479 9.434 9.31866 9.434H10.2519V2.45267Z" fill="#B2B8CD" />
            </svg>
            <span>Yandex</span>
          </button>

          <button className="auth-method-btn auth-method-github" onClick={() => handleOAuth('github')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6.19459 14V12.2938L6.21704 11.0813C6.24401 10.7041 6.39097 10.3485 6.63275 10.0733C6.63629 10.0693 6.63985 10.0653 6.64344 10.0613C6.65277 10.0509 6.64663 10.0341 6.63275 10.0323C5.01707 9.83067 3.33371 9.14847 3.33371 6.17833C3.32318 5.44681 3.56184 4.73765 4.00295 4.18143C4.01839 4.16198 4.03406 4.14271 4.04999 4.12363C4.07071 4.0988 4.07749 4.06515 4.068 4.03423C4.06742 4.03235 4.06685 4.03047 4.06627 4.02859C4.05551 3.99327 4.0454 3.95777 4.03596 3.92214C3.87381 3.30983 3.90867 2.65575 4.13689 2.06545C4.13857 2.06109 4.14027 2.05674 4.14197 2.05239C4.15049 2.03066 4.16838 2.01405 4.19136 2.00995C4.33463 1.98441 4.91361 1.95023 6.02203 2.71564C6.05653 2.73946 6.09153 2.76406 6.12706 2.78945C6.15271 2.80779 6.18533 2.81341 6.21567 2.80477L6.21853 2.80395C6.27803 2.78704 6.3377 2.77099 6.39749 2.7558C7.45111 2.48817 8.54897 2.48817 9.60257 2.7558C9.65931 2.7702 9.71584 2.78538 9.77231 2.80133L9.77597 2.80237C9.81164 2.81248 9.84997 2.80588 9.88017 2.78435C9.91324 2.76076 9.94584 2.73786 9.97804 2.71564C11.0838 1.95184 11.6596 1.98427 11.8036 2.00979C11.827 2.01395 11.8452 2.03085 11.854 2.05297C11.8552 2.05582 11.8562 2.05866 11.8574 2.06151C12.0894 2.65207 12.1263 3.30809 11.964 3.92214C11.9544 3.95874 11.944 3.9952 11.9329 4.03149C11.9229 4.06412 11.9301 4.09961 11.9519 4.12583L11.954 4.1283C11.9686 4.14585 11.983 4.16356 11.9971 4.18143C12.4382 4.73765 12.6769 5.44681 12.6664 6.17833C12.6664 9.16467 10.971 9.829 9.34764 10.01C9.33824 10.011 9.33404 10.0223 9.34037 10.0293C9.34277 10.0319 9.34524 10.0346 9.34764 10.0373C9.51144 10.2197 9.63851 10.4363 9.72077 10.6735C9.80677 10.9216 9.84177 11.1865 9.82344 11.4503V14" stroke="#B2B8CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2.66663 11.3333C2.91273 11.3682 3.14769 11.4589 3.35373 11.5983C3.55976 11.7379 3.73147 11.9225 3.85583 12.1385C3.9615 12.3308 4.10397 12.5003 4.27505 12.6371C4.44614 12.774 4.64249 12.8757 4.85282 12.9362C5.06315 12.9968 5.28332 13.0151 5.50071 12.99C5.71809 12.965 5.92841 12.8971 6.1196 12.7903" stroke="#B2B8CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Github</span>
          </button>

          <button className="auth-method-btn auth-method-telegram" onClick={() => handleOAuth('telegram')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.85836 9.34642C3.88754 9.35629 3.91699 9.36322 3.94642 9.36749C3.97851 9.44295 4.01997 9.54049 4.06835 9.65455C4.18639 9.93295 4.34545 10.3096 4.50964 10.7024C4.84447 11.5035 5.18221 12.3293 5.25681 12.5657C5.34915 12.8579 5.44675 13.0566 5.55331 13.1922C5.6084 13.2624 5.67213 13.3236 5.74669 13.37C5.78422 13.3933 5.82387 13.4124 5.86525 13.4267C5.86708 13.4274 5.8689 13.428 5.87072 13.4286C6.08407 13.5091 6.27857 13.4756 6.40035 13.4346C6.46551 13.4126 6.51823 13.3861 6.5556 13.3646C6.57465 13.3536 6.59075 13.3434 6.60359 13.3348L6.60661 13.3328L8.49073 12.1578L10.6671 13.8263C10.6992 13.8509 10.7343 13.8716 10.7713 13.8878C11.0328 14.0018 11.286 14.0416 11.5241 14.0091C11.7619 13.9766 11.9507 13.8768 12.0912 13.7643C12.2288 13.6542 12.3221 13.5309 12.3802 13.4393C12.4099 13.3925 12.4321 13.3511 12.4479 13.3194C12.4557 13.3035 12.4621 13.2898 12.467 13.2788L12.4733 13.2642L12.4757 13.2585L12.4767 13.2561L12.4771 13.255L12.4775 13.2539C12.4889 13.2253 12.4977 13.1957 12.5037 13.1655L14.4905 3.14851C14.4969 3.11648 14.5001 3.08389 14.5001 3.05123C14.5001 2.75789 14.3895 2.47896 14.1297 2.3097C13.9075 2.16503 13.6601 2.15881 13.5037 2.17067C13.335 2.18348 13.1792 2.22513 13.0747 2.2584C13.0203 2.27572 12.9746 2.29243 12.9417 2.30517C12.9252 2.31158 12.9117 2.31708 12.9015 2.32127L12.894 2.32446L1.7515 6.69549L1.75006 6.69602C1.74296 6.69862 1.73384 6.70202 1.72301 6.70622C1.70143 6.71462 1.67252 6.72642 1.63875 6.74175C1.5729 6.77162 1.48051 6.81822 1.38571 6.88315C1.23425 6.98689 0.885921 7.27095 0.944574 7.73982C0.991368 8.11389 1.24762 8.34362 1.40375 8.45409C1.48947 8.51475 1.57092 8.55809 1.63023 8.58635C1.65775 8.59942 1.71488 8.62262 1.73967 8.63275L1.74593 8.63529L3.85836 9.34642ZM13.2839 3.24526L13.2824 3.24594C13.2768 3.24835 13.2713 3.25066 13.2656 3.25287L2.1096 7.62922C2.10377 7.63149 2.09791 7.63369 2.092 7.63575L2.08579 7.63809C2.07865 7.64089 2.06664 7.64575 2.05156 7.65255C2.04301 7.65642 2.03408 7.66069 2.02498 7.66522C2.03748 7.67229 2.04945 7.67835 2.06008 7.68342C2.07029 7.68829 2.07807 7.69162 2.08233 7.69335L4.17742 8.39869C4.21577 8.41162 4.25151 8.42869 4.28433 8.44935L11.2022 4.39967L11.2087 4.39585C11.2137 4.39287 11.2203 4.38904 11.2283 4.38455C11.244 4.37565 11.2656 4.36381 11.2913 4.35071C11.3393 4.32627 11.4162 4.29 11.5027 4.26325C11.5629 4.24463 11.7406 4.19217 11.9327 4.25378C12.0512 4.2918 12.1739 4.37354 12.2538 4.51201C12.2934 4.5808 12.3145 4.64991 12.3248 4.71317C12.352 4.81282 12.3477 4.91123 12.3264 4.99618C12.2805 5.17919 12.152 5.32193 12.035 5.43112C11.9347 5.52473 10.6378 6.77529 9.3584 8.00982C8.72033 8.62542 8.08887 9.23502 7.6168 9.69062L7.3068 9.98995L11.2214 12.9912C11.3112 13.0233 11.3643 13.0217 11.3888 13.0183C11.4181 13.0143 11.442 13.003 11.4665 12.9835C11.4938 12.9616 11.5177 12.932 11.5356 12.9038L11.5363 12.9027L13.4633 3.18737C13.4347 3.19424 13.4058 3.20243 13.3779 3.21129C13.3464 3.22134 13.3203 3.23091 13.3031 3.2376C13.2945 3.24091 13.2884 3.24343 13.2851 3.24481L13.2839 3.24526ZM7.64307 11.5079L6.86207 10.9091L6.67287 12.1129L7.64307 11.5079ZM6.14564 9.72095L6.92227 8.97115C7.39433 8.51549 8.02594 7.90589 8.66407 7.29015L9.3124 6.66469L4.96569 9.20922L4.98901 9.26422C5.10747 9.54362 5.26725 9.92182 5.4323 10.3168C5.55572 10.612 5.68478 10.923 5.80233 11.2108L5.99102 10.0106C6.00921 9.89482 6.06574 9.79469 6.14564 9.72095Z" fill="#B2B8CD" />
            </svg>
            <span>Telegram</span>
          </button>
        </div>

        <div className="auth-footer">
          <span>Нет аккаунта? </span>
          <Link to="/register">Нажмите чтобы создать</Link>
        </div>
      </div>
    </div>
  );
};

