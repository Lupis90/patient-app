'use client';
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/lib/supabaseClient';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user);
        setShowSuccess(true);
        setTimeout(() => {
          console.log('Redirecting...');
          router.push('/');
        }, 2000);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h1>
        {showSuccess && (
          <div className="bg-green-500 text-white p-3 mb-4 rounded text-center text-sm">
            Login successful! Redirecting...
          </div>
        )}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                borderRadius: '0.375rem',
                fontSize: '14px',
                padding: '10px 15px',
              },
              input: {
                borderRadius: '0.375rem',
                fontSize: '14px',
                padding: '10px 15px',
              },
              label: {
                fontSize: '14px',
                marginBottom: '4px',
              },
            },
          }}
          providers={[]}
          view="sign_in"
        />
      </div>
    </div>
  );
};

export default LoginPage;