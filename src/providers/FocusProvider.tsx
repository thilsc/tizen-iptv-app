import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface FocusContextType {
  focusKey: string | null;
  setFocus: (key: string) => void;
  registerFocusable: (key: string, element: HTMLElement, options?: FocusableOptions) => void;
  unregisterFocusable: (key: string) => void;
  navigateByDirection: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

interface FocusableElement {
  key: string;
  element: HTMLElement;
  options: FocusableOptions;
}

interface FocusableOptions {
  onFocus?: () => void;
  onBlur?: () => void;
  defaultFocus?: boolean;
  disabled?: boolean;
  group?: string;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
}

const FocusContext = createContext<FocusContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useFocusContext = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocusContext must be used within a FocusProvider');
  }
  return context;
};

interface FocusProviderProps {
  children: React.ReactNode;
}

const FocusProvider: React.FC<FocusProviderProps> = ({ children }) => {
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [focusableElements, setFocusableElements] = useState<Map<string, FocusableElement>>(new Map());
  const [groupMap, setGroupMap] = useState<Map<string, Set<string>>>(new Map());
  
  // Register a focusable element
  const registerFocusable = useCallback((key: string, element: HTMLElement, options: FocusableOptions = {}) => {
    setFocusableElements(prev => {
      const newMap = new Map(prev);
      newMap.set(key, { key, element, options });
      return newMap;
    });
    
    // Add to group map if group is specified
    if (options.group) {
      setGroupMap(prev => {
        const newMap = new Map(prev);
        const groupSet = newMap.get(options.group!) || new Set<string>();
        groupSet.add(key);
        newMap.set(options.group!, groupSet);
        return newMap;
      });
    }
    
    // Set as default focus if specified
    if (options.defaultFocus && !focusKey) {
      setFocusKey(key);
    }
  }, [focusKey]);
  
  // Unregister a focusable element
  const unregisterFocusable = useCallback((key: string) => {
    setFocusableElements(prev => {
      const newMap = new Map(prev);
      const element = newMap.get(key);
      
      // Remove from group map if in a group
      if (element?.options.group) {
        setGroupMap(prevGroups => {
          const newGroups = new Map(prevGroups);
          const groupSet = newGroups.get(element.options.group!);
          
          if (groupSet) {
            groupSet.delete(key);
            
            if (groupSet.size === 0) {
              newGroups.delete(element.options.group!);
            } else {
              newGroups.set(element.options.group!, groupSet);
            }
          }
          
          return newGroups;
        });
      }
      
      newMap.delete(key);
      return newMap;
    });
    
    // If the unregistered element was focused, clear focus
    if (focusKey === key) {
      setFocusKey(null);
    }
  }, [focusKey]);
  
  // Set focus to a specific element
  const setFocus = useCallback((key: string) => {
    const element = focusableElements.get(key);
    
    if (element && !element.options.disabled) {
      // Call onBlur on previously focused element
      if (focusKey) {
        const prevElement = focusableElements.get(focusKey);
        prevElement?.options.onBlur?.();
      }
      
      // Set new focus
      setFocusKey(key);
      element.element.focus();
      element.options.onFocus?.();
    }
  }, [focusKey, focusableElements]);
  
  // Navigate by direction
  const navigateByDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!focusKey) return;
    
    const currentElement = focusableElements.get(focusKey);
    if (!currentElement) return;
    
    // Check if there's an explicit direction mapping
    const explicitTarget = currentElement.options[direction];
    if (explicitTarget) {
      const targetElement = focusableElements.get(explicitTarget);
      if (targetElement && !targetElement.options.disabled) {
        setFocus(explicitTarget);
        return;
      }
    }
    
    // If in a group, try to navigate within the group first
    if (currentElement.options.group) {
      const groupElements = groupMap.get(currentElement.options.group);
      
      if (groupElements && groupElements.size > 1) {
        // Convert to array for easier manipulation
        const elementsArray = Array.from(groupElements)
          .map(key => focusableElements.get(key))
          .filter(Boolean) as FocusableElement[];
        
        // Sort elements by position
        const currentRect = currentElement.element.getBoundingClientRect();
        
        let nextElement: FocusableElement | undefined;
        
        if (direction === 'up' || direction === 'down') {
          // Sort by y position
          elementsArray.sort((a, b) => {
            const rectA = a.element.getBoundingClientRect();
            const rectB = b.element.getBoundingClientRect();
            return rectA.top - rectB.top;
          });
          
          if (direction === 'up') {
            // Find the closest element above
            nextElement = elementsArray
              .filter(el => el.element.getBoundingClientRect().bottom <= currentRect.top)
              .sort((a, b) => b.element.getBoundingClientRect().bottom - a.element.getBoundingClientRect().bottom)[0];
          } else {
            // Find the closest element below
            nextElement = elementsArray
              .filter(el => el.element.getBoundingClientRect().top >= currentRect.bottom)
              .sort((a, b) => a.element.getBoundingClientRect().top - b.element.getBoundingClientRect().top)[0];
          }
        } else {
          // Sort by x position
          elementsArray.sort((a, b) => {
            const rectA = a.element.getBoundingClientRect();
            const rectB = b.element.getBoundingClientRect();
            return rectA.left - rectB.left;
          });
          
          if (direction === 'left') {
            // Find the closest element to the left
            nextElement = elementsArray
              .filter(el => el.element.getBoundingClientRect().right <= currentRect.left)
              .sort((a, b) => b.element.getBoundingClientRect().right - a.element.getBoundingClientRect().right)[0];
          } else {
            // Find the closest element to the right
            nextElement = elementsArray
              .filter(el => el.element.getBoundingClientRect().left >= currentRect.right)
              .sort((a, b) => a.element.getBoundingClientRect().left - b.element.getBoundingClientRect().left)[0];
          }
        }
        
        if (nextElement && !nextElement.options.disabled) {
          setFocus(nextElement.key);
          return;
        }
      }
    }
    
    // If no group navigation or no suitable element in group, try spatial navigation
    const currentRect = currentElement.element.getBoundingClientRect();
    const allElements = Array.from(focusableElements.values())
      .filter(el => !el.options.disabled && el.key !== focusKey);
    
    let bestElement: FocusableElement | undefined;
    let bestScore = Infinity;
    
    for (const element of allElements) {
      const rect = element.element.getBoundingClientRect();
      let score = Infinity;
      
      if (direction === 'up' && rect.bottom <= currentRect.top) {
        // Calculate distance and alignment for up direction
        const horizontalOverlap = Math.min(rect.right, currentRect.right) - Math.max(rect.left, currentRect.left);
        const horizontalAlignment = horizontalOverlap > 0 ? 0 : Math.min(
          Math.abs(rect.left - currentRect.left),
          Math.abs(rect.right - currentRect.right)
        );
        
        score = (currentRect.top - rect.bottom) * 10 + horizontalAlignment;
      } else if (direction === 'down' && rect.top >= currentRect.bottom) {
        // Calculate distance and alignment for down direction
        const horizontalOverlap = Math.min(rect.right, currentRect.right) - Math.max(rect.left, currentRect.left);
        const horizontalAlignment = horizontalOverlap > 0 ? 0 : Math.min(
          Math.abs(rect.left - currentRect.left),
          Math.abs(rect.right - currentRect.right)
        );
        
        score = (rect.top - currentRect.bottom) * 10 + horizontalAlignment;
      } else if (direction === 'left' && rect.right <= currentRect.left) {
        // Calculate distance and alignment for left direction
        const verticalOverlap = Math.min(rect.bottom, currentRect.bottom) - Math.max(rect.top, currentRect.top);
        const verticalAlignment = verticalOverlap > 0 ? 0 : Math.min(
          Math.abs(rect.top - currentRect.top),
          Math.abs(rect.bottom - currentRect.bottom)
        );
        
        score = (currentRect.left - rect.right) * 10 + verticalAlignment;
      } else if (direction === 'right' && rect.left >= currentRect.right) {
        // Calculate distance and alignment for right direction
        const verticalOverlap = Math.min(rect.bottom, currentRect.bottom) - Math.max(rect.top, currentRect.top);
        const verticalAlignment = verticalOverlap > 0 ? 0 : Math.min(
          Math.abs(rect.top - currentRect.top),
          Math.abs(rect.bottom - currentRect.bottom)
        );
        
        score = (rect.left - currentRect.right) * 10 + verticalAlignment;
      }
      
      if (score < bestScore) {
        bestScore = score;
        bestElement = element;
      }
    }
    
    if (bestElement) {
      setFocus(bestElement.key);
    }
  }, [focusKey, focusableElements, groupMap, setFocus]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          navigateByDirection('up');
          e.preventDefault();
          break;
        case 'ArrowDown':
          navigateByDirection('down');
          e.preventDefault();
          break;
        case 'ArrowLeft':
          navigateByDirection('left');
          e.preventDefault();
          break;
        case 'ArrowRight':
          navigateByDirection('right');
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigateByDirection]);
  
  // Set initial focus if none is set
  useEffect(() => {
    if (!focusKey && focusableElements.size > 0) {
      // First try to find an element with defaultFocus
      for (const [key, element] of focusableElements.entries()) {
        if (element.options.defaultFocus && !element.options.disabled) {
          setFocusKey(key);
          element.element.focus();
          element.options.onFocus?.();
          return;
        }
      }
      
      // If no defaultFocus, just focus the first non-disabled element
      for (const [key, element] of focusableElements.entries()) {
        if (!element.options.disabled) {
          setFocusKey(key);
          element.element.focus();
          element.options.onFocus?.();
          return;
        }
      }
    }
  }, [focusKey, focusableElements]);
  
  const value = {
    focusKey,
    setFocus,
    registerFocusable,
    unregisterFocusable,
    navigateByDirection,
  };
  
  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
};

export default FocusProvider;