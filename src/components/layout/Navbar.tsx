import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFocusable } from '../../hooks';

import { useAuthStore } from '../../store';

interface NavbarProps {
  className?: string;
}

const FocusableNavItem: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  const { ref, isFocused } = useFocusable({ onEnter: onClick });

  return (
    <NavItem
      ref={ref as React.RefObject<HTMLDivElement>}
      active={active}
      focused={isFocused}
      onClick={onClick}
    >
      {label}
    </NavItem>
  );
};

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const navItems = [
    { label: t('navigation.home'), path: '/' },
    { label: t('navigation.liveTV'), path: '/live' },
    { label: t('navigation.epg'), path: '/epg' },
    { label: t('navigation.movies'), path: '/movies' },
    { label: t('navigation.series'), path: '/series' },
    { label: t('navigation.favorites'), path: '/favorites' },
    { label: t('navigation.settings'), path: '/settings' },
  ];
  
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileMenuOpen(false);
  };
  
  return (
    <NavbarContainer className={className}>
      <LogoContainer onClick={() => navigate('/')}>
        <Logo>IPTV OTT</Logo>
      </LogoContainer>
      
      <NavItems>
        {navItems.map((item, index) => (
          <FocusableNavItem
            key={index}
            label={item.label}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </NavItems>
      
      <RightSection>
        <SearchButton onClick={() => navigate('/search')}>
          {t('navigation.search')}
        </SearchButton>
        
        {isAuthenticated && (
          <ProfileSection>
            <ProfileButton onClick={toggleProfileMenu}>
              <ProfileIcon>👤</ProfileIcon>
            </ProfileButton>
            
            {isProfileMenuOpen && (
              <ProfileMenu>
                <ProfileMenuItem onClick={() => navigate('/profile')}>
                  {t('navigation.profile')}
                </ProfileMenuItem>
                <ProfileMenuItem onClick={handleLogout}>
                  {t('auth.logout')}
                </ProfileMenuItem>
              </ProfileMenu>
            )}
          </ProfileSection>
        )}
      </RightSection>
    </NavbarContainer>
  );
};

const NavbarContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background-color: var(--color-background-navbar);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
`;

const LogoContainer = styled.div`
  cursor: pointer;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

interface NavItemProps {
  active: boolean;
  focused: boolean;
}

const NavItem = styled.div<NavItemProps>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.active ? 'var(--color-primary)' : 'var(--color-text-primary)'};
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  ${props => props.active && css`
    background-color: rgba(var(--color-primary-rgb), 0.1);
  `}
  
  &:hover, &:focus {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    outline: none;
  }

  ${props => props.focused && css`
    background-color: rgba(var(--color-primary-rgb), 0.15);
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  `}
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  
  &:hover, &:focus {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    outline: none;
  }
`;

const ProfileSection = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  
  &:hover, &:focus {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    outline: none;
  }
`;

const ProfileIcon = styled.div`
  font-size: 24px;
`;

const ProfileMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: var(--color-background-card);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  min-width: 150px;
  z-index: 101;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ProfileMenuItem = styled.div`
  padding: 12px 16px;
  font-size: 16px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    outline: none;
  }
`;

export default Navbar;