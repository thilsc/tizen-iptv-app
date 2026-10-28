import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useFocusable } from '../../hooks';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

const TabItemComponent: React.FC<{
  tab: Tab;
  isActive: boolean;
  onSelect: (id: string) => void;
}> = ({ tab, isActive, onSelect }) => {
  const { ref, isFocused } = useFocusable({
    onEnter: () => onSelect(tab.id),
  });

  return (
    <TabItem
      ref={ref as React.RefObject<HTMLDivElement>}
      active={isActive}
      focused={isFocused}
      onClick={() => onSelect(tab.id)}
    >
      {tab.label}
    </TabItem>
  );
};

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  const [selectedTab, setSelectedTab] = useState(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    setSelectedTab(tabId);
    onChange(tabId);
  };

  return (
    <TabsContainer>
      {tabs.map((tab) => (
        <TabItemComponent
          key={tab.id}
          tab={tab}
          isActive={tab.id === selectedTab}
          onSelect={handleTabClick}
        />
      ))}
    </TabsContainer>
  );
};

const TabsContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
`;

const TabItem = styled.div<{ active: boolean; focused: boolean }>`
  padding: 12px 24px;
  margin-right: 8px;
  font-size: 16px;
  font-weight: ${({ active }) => (active ? '600' : '400')};
  color: ${({ active }) => (active ? 'var(--color-primary)' : 'var(--color-text-secondary)')};
  border-bottom: 2px solid ${({ active }) => (active ? 'var(--color-primary)' : 'transparent')};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: var(--color-primary);
  }

  ${({ focused }) =>
    focused &&
    `
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
    border-radius: 4px;
  `}
`;

export default Tabs;