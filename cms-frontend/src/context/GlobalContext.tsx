import React from "react";
import { Dispatch, SetStateAction } from "react";

type AuthType = {
  email: string;
  password: string;
  accessToken: string;
  firstName: string;
  lastName: string;
  address: string;
  role: "admin" | "user";
  userId: string;
};

interface GlobalContextType {
  showCattleAddForm: boolean;
  setShowCattleAddForm: Dispatch<SetStateAction<boolean>>;
  showCattleCard: boolean;
  setShowCattleCard: Dispatch<SetStateAction<boolean>>;
  auth: AuthType;
  setAuth: Dispatch<SetStateAction<AuthType>>;
  cattleList_selectedOption: string;
  setCattlelist_selectedOption: Dispatch<SetStateAction<string>>;
  selectedMenu: string;
  setSelectedMenu: Dispatch<SetStateAction<string>>;
}

const GlobalContext = React.createContext<GlobalContextType>({
  showCattleAddForm: false,
  setShowCattleAddForm: () => {},
  showCattleCard: false,
  setShowCattleCard: () => {},
  auth: {
    email: "",
    password: "",
    accessToken: "",
    firstName: "",
    lastName: "",
    address: "",
    role: "user",
    userId: "",
  },
  setAuth: () => {},
  cattleList_selectedOption: "",
  setCattlelist_selectedOption: () => {},
  selectedMenu: "",
  setSelectedMenu: () => {},
});

export default GlobalContext;
