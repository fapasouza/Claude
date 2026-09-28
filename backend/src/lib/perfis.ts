export const PERFIS = ["ADMIN", "GESTOR", "COLABORADOR"] as const;
export type Perfil = (typeof PERFIS)[number];

export const podeModerar = (perfil: Perfil) => perfil === "ADMIN" || perfil === "GESTOR";
