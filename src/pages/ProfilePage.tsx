import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { useAuthStore } from '../store';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();

  return (
    <Layout>
      <PageContainer>
        <PageTitle>{t('navigation.profile')}</PageTitle>
        <ProfileCard>
          <ProfileRow>
            <ProfileLabel>{t('profile.username')}</ProfileLabel>
            <ProfileValue>{userProfile?.username || '-'}</ProfileValue>
          </ProfileRow>
          <ProfileRow>
            <ProfileLabel>{t('profile.status')}</ProfileLabel>
            <ProfileValue>{userProfile?.status || '-'}</ProfileValue>
          </ProfileRow>
          <ProfileRow>
            <ProfileLabel>{t('profile.expiration')}</ProfileLabel>
            <ProfileValue>{userProfile?.expDate || '-'}</ProfileValue>
          </ProfileRow>
          <ProfileRow>
            <ProfileLabel>{t('profile.maxConnections')}</ProfileLabel>
            <ProfileValue>{userProfile?.maxConnections ?? '-'}</ProfileValue>
          </ProfileRow>
          <ProfileRow>
            <ProfileLabel>{t('profile.activeConnections')}</ProfileLabel>
            <ProfileValue>{userProfile?.activeConnections ?? '-'}</ProfileValue>
          </ProfileRow>
        </ProfileCard>
      </PageContainer>
    </Layout>
  );
};

const PageContainer = styled.div`padding: 24px; max-width: 600px; margin: 0 auto;`;
const PageTitle = styled.h1`font-size: 32px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 24px;`;
const ProfileCard = styled.div`background-color: var(--color-background-card); border-radius: 8px; padding: 24px; box-shadow: var(--shadow-small);`;
const ProfileRow = styled.div`display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: none; }`;
const ProfileLabel = styled.div`font-size: 16px; color: var(--color-text-secondary);`;
const ProfileValue = styled.div`font-size: 16px; font-weight: 600; color: var(--color-text-primary);`;

export default ProfilePage;