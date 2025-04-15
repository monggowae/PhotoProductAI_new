import React, { useState, useEffect } from 'react';
import { Gift, Clock, Coins, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Settings {
  token_expiration: { days: number };
  minimum_token_request: { amount: number };
  minimum_balance: { amount: number };
  welcome_token: { amount: number };
  service_fees: {
    photo_product: number;
    fashion_photography: number;
    animal_photography: number;
    food_photography: number;
    photo_modification: number;
  };
}

interface SettingsFormProps {
  settings: any;
  onUpdate: (key: string, value: any) => Promise<void>;
  updatingSettings: { [key: string]: boolean };
}

const SERVICE_FEES_ORDER = [
  'photo_product',
  'fashion_photography', 
  'animal_photography',
  'food_photography',
  'photo_modification'
];

const SERVICE_FEES_LABELS = {
  photo_product: 'Photo Product',
  fashion_photography: 'Fashion Photography',
  animal_photography: 'Animal Photography',
  food_photography: 'Food Photography',
  photo_modification: 'Photo Modification'
};

export function SettingsForm({ settings, onUpdate, updatingSettings }: SettingsFormProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(() => {
    const serviceFees: Record<string, number> = {};
    
    SERVICE_FEES_ORDER.forEach(key => {
      const settingKey = `service_fees_${key}`;
      serviceFees[key] = settings[settingKey]?.int_value ?? 0;
    });

    return {
      token_expiration: settings.token_expiration,
      minimum_token_request: settings.minimum_token_request,
      minimum_balance: settings.minimum_balance,
      welcome_token: settings.welcome_token,
      service_fees: serviceFees,
    };
  });

  useEffect(() => {
    const fetchServiceFees = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, int_value')
        .like('key', 'service_fees_%');

      if (!error && data) {
        const newServiceFees = { ...localSettings.service_fees };
        data.forEach(setting => {
          const key = setting.key.replace('service_fees_', '');
          newServiceFees[key] = setting.int_value;
        });
        
        setLocalSettings(prev => ({
          ...prev,
          service_fees: newServiceFees
        }));
      }
    };

    fetchServiceFees();
  }, [settings]);

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      const keyParts = key.split('.');

      if (keyParts.length === 2) {
        const [outer, inner] = keyParts;
        newSettings[outer] = {
          ...newSettings[outer],
          [inner]: value
        };
      } else if (key === 'token_expiration') {
        newSettings[key] = { days: value };
      } else {
        newSettings[key] = { amount: value };
      }

      return newSettings;
    });
  };

  const handleUpdate = async (key: string) => {
    let value: any;
    if (key.startsWith('service_fees_')) {
      const feeKey = key.replace('service_fees_', '');
      value = { amount: localSettings.service_fees[feeKey] };
    } else {
      value = localSettings[key];
    }
    
    await onUpdate(key, value);

    // Refresh the service fees data after update
    const { data, error } = await supabase
      .from('settings')
      .select('key, int_value')
      .eq('key', key)
      .single();

    if (!error && data) {
      const feeKey = key.replace('service_fees_', '');
      setLocalSettings(prev => ({
        ...prev,
        service_fees: {
          ...prev.service_fees,
          [feeKey]: data.int_value
        }
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Token Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Token Settings</h2>
        <p className="text-gray-600 text-sm mb-6">Set token expiration and request limits</p>

        <div className="space-y-6">
          {[
            {
              label: 'Welcome Token for New Users',
              icon: <Gift className="w-5 h-5" />,
              key: 'welcome_token',
              value: localSettings.welcome_token.amount
            },
            {
              label: 'Token expiration (days)',
              icon: <Clock className="w-5 h-5" />,
              key: 'token_expiration',
              value: localSettings.token_expiration.days
            },
            {
              label: 'Minimum token request',
              icon: <Coins className="w-5 h-5" />,
              key: 'minimum_token_request',
              value: localSettings.minimum_token_request.amount
            },
            {
              label: 'Minimum balance for transfers',
              icon: <Coins className="w-5 h-5" />,
              key: 'minimum_balance',
              value: localSettings.minimum_balance.amount
            },
          ].map(({ label, icon, key, value }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                {icon}
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleSettingChange(key, parseInt(e.target.value))}
                  min="0"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                />
                <button
                  onClick={() => handleUpdate(key)}
                  disabled={updatingSettings[key]}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {updatingSettings[key] ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Fees */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Service Fees</h2>
        <p className="text-gray-600 text-sm mb-6">Set token fees for different services</p>

        <div className="space-y-4">
          {SERVICE_FEES_ORDER.map((key) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-5 h-5" />
                {SERVICE_FEES_LABELS[key]}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localSettings.service_fees[key]}
                  onChange={(e) => handleSettingChange(`service_fees.${key}`, parseInt(e.target.value))}
                  min="0"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                />
                <button
                  onClick={() => handleUpdate(`service_fees_${key}`)}
                  disabled={updatingSettings[`service_fees_${key}`]}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {updatingSettings[`service_fees_${key}`] ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}