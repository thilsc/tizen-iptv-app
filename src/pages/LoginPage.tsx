import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Button, Input, Loading } from '../components/ui';
import { useAuthStore } from '../store';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const handleLogin = async () => {
    const success = await login(serverUrl, username, password, rememberMe);
    
    if (success) {
      navigate('/');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };
  
  return (
    <LoginContainer>
      <LoginBox>
        <Logo>IPTV</Logo>
        
        <LoginForm>
          <Input
            label={t('auth.server')}
            placeholder={t('auth.serverPlaceholder')}
            value={serverUrl}
            onChange={(value) => setServerUrl(value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          
          <Input
            label={t('auth.username')}
            placeholder={t('auth.usernamePlaceholder')}
            value={username}
            onChange={(value) => setUsername(value)}
            onKeyDown={handleKeyDown}
          />
          
          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            type="password"
            value={password}
            onChange={(value) => setPassword(value)}
            onKeyDown={handleKeyDown}
          />
          
          <RememberMeContainer>
            <Checkbox
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              id="remember-me"
            />
            <CheckboxLabel htmlFor="remember-me">
              {t('auth.rememberMe')}
            </CheckboxLabel>
          </RememberMeContainer>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <LoginButton
            variant="primary"
            size="large"
            onClick={handleLogin}
            disabled={isLoading || !serverUrl || !username || !password}
          >
            {isLoading ? <Loading size="small" color="white" /> : t('auth.login')}
          </LoginButton>
        </LoginForm>
      </LoginBox>
    </LoginContainer>
  );
};

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 20px;
`;

const LoginBox = styled.div`
  background-color: var(--color-background-card);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-large);
  width: 100%;
  max-width: 500px;
  padding: 40px;
`;

const Logo = styled.h1`
  color: var(--color-primary);
  text-align: center;
  margin-bottom: 32px;
  font-size: 48px;
  font-weight: 700;
`;

const LoginForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  margin-right: 8px;
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  color: var(--color-text-secondary);
  cursor: pointer;
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 14px;
  padding: 8px 0;
`;

const LoginButton = styled(Button)`
  margin-top: 16px;
`;

export default LoginPage;