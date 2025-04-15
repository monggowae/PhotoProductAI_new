import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { NameForm } from '../components/profile/NameForm';
import { PasswordForm } from '../components/profile/PasswordForm';
import { ProfileSection } from '../components/profile/ProfileSection';
import { Toast } from '../components/shared/Toast';

export function ProfileEdit() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleUpdateProfile = async (newName: string, newPhone: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: newName,
          phone: newPhone
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update local user state
      if (user) {
        useAuthStore.setState({ 
          user: { 
            ...user, 
            name: newName,
            phone: newPhone
          } 
        });
      }

      showToast('Profile updated successfully');
    } catch (err) {
      throw new Error('Failed to update profile');
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      showToast('Password updated successfully');
    } catch (err) {
      throw err;
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600 mt-2">Update your profile information</p>
      </div>

      <div className="space-y-6">
        <ProfileSection title="Update Profile">
          <NameForm
            initialName={user.name}
            initialPhone={user.phone || ''}
            onSubmit={handleUpdateProfile}
          />
        </ProfileSection>

        <ProfileSection title="Change Password">
          <PasswordForm
            onSubmit={handleChangePassword}
            onCancel={() => navigate('/')}
          />
        </ProfileSection>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}