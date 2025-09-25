/**
 * Login Page
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/supabase-server';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  // Check if user is already logged in
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Engineering Forecast
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de gestión de sitios con análisis de PDFs
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
