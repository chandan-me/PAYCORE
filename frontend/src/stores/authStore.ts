import { useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  merchant_id?: string;
}

export interface Merchant {
  id: string;
  business_name: string;
  legal_business_name?: string;
  business_email: string;
  onboarding_status: string;
  onboarding_step: number;
  environment_mode: 'TEST' | 'LIVE';
  branding_color: string;
  branding_logo_url?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('paycore_access_token');
    if (!token) {
      setUser(null);
      setMerchant(null);
      setLoading(false);
      return;
    }
    try {
      const userResp = await api.get('/auth/me');
      setUser(userResp.data);
      if (userResp.data.role.includes('MERCHANT')) {
        const mchResp = await api.get('/merchants/me');
        setMerchant(mchResp.data);
      }
    } catch (err) {
      localStorage.removeItem('paycore_access_token');
      setUser(null);
      setMerchant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('paycore_access_token', token);
    setUser(userData);
    fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('paycore_access_token');
    setUser(null);
    setMerchant(null);
  };

  return { user, merchant, loading, login, logout, refreshMerchant: fetchCurrentUser };
}
