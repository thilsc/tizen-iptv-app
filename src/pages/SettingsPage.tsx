import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { Button } from '../components/ui';
import { useSettingsStore, useAuthStore } from '../store';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    theme, 
    language, 
    parentalControl, 
    parentalControlPin,
    setTheme, 
    setLanguage, 
    setParentalControl,
    setParentalControlPin
  } = useSettingsStore();
  const { logout } = useAuthStore();
  
  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };
  
  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'tr' | 'en');
    i18n.changeLanguage(newLanguage);
  };
  
  // Handle parental control toggle
  const handleParentalControlToggle = () => {
    setParentalControl(!parentalControl.enabled);
  };
  
  // Handle PIN change
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setParentalControlPin(pin);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
  };
  
  return (
    <Layout>
      <SettingsContainer>
        <SettingsHeader>
          <SettingsTitle>{t('settings.title')}</SettingsTitle>
        </SettingsHeader>
        
        <SettingsContent>
          <SettingsSection>
            <SectionTitle>{t('settings.appearance')}</SectionTitle>
            
            <SettingItem>
              <SettingLabel>{t('settings.theme')}</SettingLabel>
              <SettingControls>
                <ThemeButton 
                  variant={theme === 'light' ? 'primary' : 'outline'} 
                  onClick={() => handleThemeChange('light')}
                >
                  {t('settings.lightTheme')}
                </ThemeButton>
                <ThemeButton 
                  variant={theme === 'dark' ? 'primary' : 'outline'} 
                  onClick={() => handleThemeChange('dark')}
                >
                  {t('settings.darkTheme')}
                </ThemeButton>
              </SettingControls>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>{t('settings.language')}</SettingLabel>
              <SettingControls>
                <LanguageButton 
                  variant={language === 'en' ? 'primary' : 'outline'} 
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </LanguageButton>
                <LanguageButton 
                  variant={language === 'tr' ? 'primary' : 'outline'} 
                  onClick={() => handleLanguageChange('tr')}
                >
                  Türkçe
                </LanguageButton>
              </SettingControls>
            </SettingItem>
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>{t('settings.parentalControl')}</SectionTitle>
            
            <SettingItem>
              <SettingLabel>{t('settings.enableParentalControl')}</SettingLabel>
              <SettingControls>
                <Switch>
                  <SwitchInput 
                    type="checkbox" 
                    checked={parentalControl.enabled} 
                    onChange={handleParentalControlToggle} 
                    id="parental-control"
                  />
                  <SwitchSlider />
                </Switch>
              </SettingControls>
            </SettingItem>
            
            {parentalControl.enabled && (
              <SettingItem>
                <SettingLabel>{t('settings.parentalControlPin')}</SettingLabel>
                <SettingControls>
                  <PinInput 
                    type="text" 
                    value={parentalControlPin} 
                    onChange={handlePinChange} 
                    placeholder="0000" 
                    maxLength={4}
                  />
                </SettingControls>
              </SettingItem>
            )}
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>{t('settings.account')}</SectionTitle>
            
            <SettingItem>
              <SettingLabel>{t('settings.logout')}</SettingLabel>
              <SettingControls>
                <LogoutButton 
                  variant="outline" 
                  onClick={handleLogout}
                >
                  {t('settings.logoutButton')}
                </LogoutButton>
              </SettingControls>
            </SettingItem>
          </SettingsSection>
          
          <SettingsSection>
            <SectionTitle>{t('settings.about')}</SectionTitle>
            
            <SettingItem>
              <SettingLabel>{t('settings.version')}</SettingLabel>
              <SettingValue>1.0.0</SettingValue>
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>{t('settings.developer')}</SettingLabel>
              <SettingValue>IPTV OTT App</SettingValue>
            </SettingItem>
          </SettingsSection>
        </SettingsContent>
      </SettingsContainer>
    </Layout>
  );
};

const SettingsContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const SettingsHeader = styled.div`
  margin-bottom: 32px;
`;

const SettingsTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
`;

const SettingsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const SettingsSection = styled.section`
  background-color: var(--color-background-card);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-small);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const SettingLabel = styled.div`
  font-size: 16px;
  color: var(--color-text-primary);
`;

const SettingValue = styled.div`
  font-size: 16px;
  color: var(--color-text-secondary);
`;

const SettingControls = styled.div`
  display: flex;
  gap: 8px;
`;

const ThemeButton = styled(Button)`
  min-width: 100px;
`;

const LanguageButton = styled(Button)`
  min-width: 100px;
`;

const LogoutButton = styled(Button)`
  min-width: 120px;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: var(--color-primary);
  }
  
  &:checked + span:before {
    transform: translateX(26px);
  }
  
  &:focus + span {
    box-shadow: 0 0 1px var(--color-primary);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: var(--transition-normal);
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: var(--transition-normal);
    border-radius: 50%;
  }
`;

const PinInput = styled.input`
  padding: 8px 16px;
  font-size: 16px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background-input);
  color: var(--color-text-primary);
  width: 100px;
  text-align: center;
  letter-spacing: 4px;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export default SettingsPage;