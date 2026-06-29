/**
 * Auth REST service.
 */
import type { LoginRequest, TokenResponse } from '@/types/api';
import { api } from './api';

export const authService = {
  async login(body: LoginRequest): Promise<TokenResponse> {
    return api.post<TokenResponse>('/auth/login', { json: body });
  },
};