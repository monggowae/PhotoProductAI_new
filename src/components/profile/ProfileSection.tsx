import React from 'react';
import { Card } from '../shared/Card';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </Card>
  );
}