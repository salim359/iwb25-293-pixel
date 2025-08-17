import { UserResource } from "./resource";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface LoginResponse {
  message: string;
  data: UserResource
}

export interface ProfileUpdateRequest {
  name: string;
}