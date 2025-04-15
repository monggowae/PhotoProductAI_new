import React, { useState } from 'react';
import { Lock, Save, X } from 'lucide-react';
import { FormField } from '../shared/FormField';
import { Button } from '../shared/Button';

interface PasswordFormProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  onCancel: () => void;
}

export function PasswordForm({ onSubmit, onCancel }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        id="currentPassword"
        type="password"
        label="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        icon={<Lock className="w-5 h-5" />}
        placeholder="Enter current password"
        error={error}
        required
      />

      <FormField
        id="newPassword"
        type="password"
        label="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        icon={<Lock className="w-5 h-5" />}
        placeholder="Enter new password"
        required
      />

      <FormField
        id="confirmPassword"
        type="password"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon={<Lock className="w-5 h-5" />}
        placeholder="Confirm new password"
        required
      />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          icon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          icon={<Save className="w-4 h-4" />}
        >
          {loading ? 'Updating...' : 'Change Password'}
        </Button>
      </div>
    </form>
  );
}