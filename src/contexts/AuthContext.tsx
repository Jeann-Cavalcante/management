import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useState } from "react";

import { api } from "../services/apiClient";

type AuthContextData = {
  user: UserProps;
  isAuthenticated: boolean;
  signIn: (credentials: SingInProps) => Promise<void>;
  signOut: () => void;
  signUp: (credentials: SignUpProps) => Promise<void>;
};

type UserProps = {
  id: string;
  name: string;
  email: string;
};

type SingInProps = {
  email: string;
  password: string;
};

type SignUpProps = {
  name: string;
  email: string;
  password: string;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

export function signOut() {
  try {
    destroyCookie(undefined, "@nextauth.token");
    Router.push("/");
  } catch {
    console.log("Erro ao deslogar");
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProps>();
  const isAuthenticated = !!user; //!! transforma em boolean
  async function signIn({ email, password }: SingInProps) {
    try {
      const response = await api.post("/session", {
        email,
        password,
      });
      // console.log(response.data);

      const { id, name, token } = response.data;

      setCookie(undefined, "@nextauth.token", token, {
        maxAge: 60 * 60 * 24 * 30, // Expira em 1 Mês
        path: "/", // Quais caminhos terão acesso ao cookie
      });

      setUser({
        id,
        name,
        email,
      });

      //Passar para proxima requisiçoes o nosso token
      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      //Redirecionar o user para /dashboard
      Router.push("/dashboard");
    } catch (err) {
      console.log("Erro ao acessa", err);
    }
  }

  async function signUp({ name, email, password }: SignUpProps) {
    try {
      const response = await api.post("/users", {
        name,
        email,
        password,
      });

      console.log("Cadastro com sucesso");

      Router.push("/");
    } catch (err) {
      console.log("Erro ao acessa", err);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, signIn, signOut, signUp }}
    >
      {children}
    </AuthContext.Provider>
  );
}
