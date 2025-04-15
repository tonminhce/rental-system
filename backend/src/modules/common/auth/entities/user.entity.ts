export type Role = "user" | "rental";
export interface User {
    id: number;
    email: string;
    password: string;
    role: Role;
}