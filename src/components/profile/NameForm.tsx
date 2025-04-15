import React, { useState } from 'react';
import { User, Phone, Save } from 'lucide-react';
import { FormField } from '../shared/FormField';
import { Button } from '../shared/Button';

interface NameFormProps {
  initialName: string;
  initialPhone: string;
  onSubmit: (name: string, phone: string) => Promise<void>;
}

export function NameForm({ initialName, initialPhone, onSubmit }: NameFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(name, phone);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        id="name"
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        icon={<User className="w-5 h-5" />}
        placeholder="Enter your name"
        error={error}
        required
      />

      <FormField
        id="phone"
        label="Phone Number"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        icon={<Phone className="w-5 h-5" />}
        placeholder="Enter your phone number"
        required
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          icon={<Save className="w-4 h-4" />}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </form>
  );
}