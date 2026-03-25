import { ReactNode, useEffect, useState } from 'react';
import GlobalContext from './GlobalContext';
import axios from 'axios';

interface ContextWrapperProps {
  children: ReactNode;
}

type AuthType = {
  email: string;
  password: string;
  accessToken: string;
  firstName: string;
  lastName: string;
  address: string;
  role: "user" | "admin";
  userId: string;
};

const ContextWrapper = ({ children }: ContextWrapperProps) => {
  const [showCattleAddForm, setShowCattleAddForm] = useState(false);
  const [showCattleCard, setShowCattleCard] = useState(false);
  const [auth, setAuth] = useState<AuthType>(() => {
    // Initialize auth state from localStorage if available
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        return JSON.parse(savedAuth) as AuthType;
      } catch (e) {
        // If parsing fails, fall back to default
            return {
      email: '',
      password: '',
      accessToken: '',
      firstName: '',
      lastName: '',
      address: '',
      role: "user",
      userId: '',
    };
      }
    }
    return {
      email: '',
      password: '',
      accessToken: '',
      firstName: '',
      lastName: '',
      address: '',
      role: "user",
      userId: '',
    };
  });
  const [cattleList_selectedOption, setCattlelist_selectedOption] =
    useState('all cattle');
  const [selectedMenu, setSelectedMenu] = useState(() => {
    return localStorage.getItem('selectedMenu') || 'Dashboard';
  });

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem('selectedMenu', selectedMenu);
  }, [selectedMenu]);

  return (
    <GlobalContext.Provider
      value={{
        showCattleAddForm,
        setShowCattleAddForm,
        showCattleCard,
        setShowCattleCard,
        auth,
        setAuth,
        cattleList_selectedOption,
        setCattlelist_selectedOption,
        selectedMenu,
        setSelectedMenu,
      }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default ContextWrapper;
