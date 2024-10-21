import React from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '../../components/ui/button';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-between items-center">
      <p>Logged in as: {user?.email}</p>
      <Button onClick={onLogout} className="bg-red-500 px-4 py-2 rounded">
        Logout
      </Button>
    </div>
  );
};
