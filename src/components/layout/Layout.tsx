import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuthStore } from '../../store';

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNavbar = false }) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const handleBack = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (isEditing) return;

      // Tizen TV back key (10009) and Escape
      if (event.keyCode === 10009 || event.keyCode === 27) {
        if (pathname !== '/') {
          event.preventDefault();
          navigate(-1);
        }
      }
    };

    window.addEventListener('keydown', handleBack);
    return () => window.removeEventListener('keydown', handleBack);
  }, [navigate, pathname]);

  return (
    <LayoutContainer>
      {isAuthenticated && !hideNavbar && <Navbar />}
      <Main hasNavbar={isAuthenticated && !hideNavbar}>
        {children}
      </Main>
    </LayoutContainer>
  );
};

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text-primary);
`;

interface MainProps {
  hasNavbar: boolean;
}

const Main = styled.main<MainProps>`
  flex: 1;
  padding: ${props => props.hasNavbar ? '84px 32px 32px' : '0'};
`;

export default Layout;