export type UserRole = "candidate" | "recruiter" | "superAdmin" | "acc_manager" | "admin";


export interface UserResource {
  type: "user";
  id: string;
  attributes: {
    name: string;
    email: string;
    role: UserRole;
  };
}
