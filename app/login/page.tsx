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
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md">
        {showSuccess && (
          <div className="bg-green-500 text-white p-4 mb-4 rounded">
            Login successful! Redirecting...
          </div>
        )}
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view="sign_in"
        />
      </div>
    </div>
  );
};

export default LoginPage;