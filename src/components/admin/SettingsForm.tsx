import React, { useState, useEffect } from 'react';
import { Gift, Clock, Coins, Camera, Building2, CreditCard, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ServiceFeeKey = 'photo_product' | 'fashion_photography' | 'animal_photography' | 'food_photography' | 'photo_modification';
type SettingsKey = 'token_expiration' | 'minimum_token_request' | 'minimum_balance' | 'welcome_token' | 'default_token_price';

interface Settings {
  token_expiration: { days: number };
  minimum_token_request: { amount: number };
  minimum_balance: { amount: number };
  welcome_token: { amount: number };
  default_token_price: { amount: number };
  payment_info: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  service_fees: {
    [K in ServiceFeeKey]: number;
  };
}

interface SettingsFormProps {
  settings: Record<string, any>;
  onUpdate: (key: string, value: any) => Promise<void>;
  updatingSettings: Record<string, boolean>;
}

const SERVICE_FEES_ORDER = [
  'photo_product',
  'fashion_photography', 
  'animal_photography',
  'food_photography',
  'photo_modification'
] as const;

const SERVICE_FEES_LABELS = {
  photo_product: 'Photo Product',
  fashion_photography: 'Fashion Photography',
  animal_photography: 'Animal Photography',
  food_photography: 'Food Photography',
  photo_modification: 'Photo Modification'
} as const;

const DEFAULT_SETTINGS: Settings = {
  token_expiration: { days: 30 },
  minimum_token_request: { amount: 100 },
  minimum_balance: { amount: 0 },
  welcome_token: { amount: 0 },
  default_token_price: { amount: 300 },
  payment_info: {
    bank_name: 'BCA',
    account_number: '1234567890',
    account_name: 'PT PHOTO PRODUCT AI'
  },
  service_fees: {
    photo_product: 0,
    fashion_photography: 0,
    animal_photography: 0,
    food_photography: 0,
    photo_modification: 0
  }
};

export function SettingsForm({ settings, onUpdate, updatingSettings }: SettingsFormProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(() => {
    try {
      const serviceFees = {
        photo_product: 0,
        fashion_photography: 0,
        animal_photography: 0,
        food_photography: 0,
        photo_modification: 0
      };
      
      SERVICE_FEES_ORDER.forEach(key => {
        const settingKey = `service_fees_${key}`;
        serviceFees[key] = settings?.[settingKey]?.int_value ?? 0;
      });

      return {
        token_expiration: settings?.token_expiration ?? DEFAULT_SETTINGS.token_expiration,
        minimum_token_request: settings?.minimum_token_request ?? DEFAULT_SETTINGS.minimum_token_request,
        minimum_balance: settings?.minimum_balance ?? DEFAULT_SETTINGS.minimum_balance,
        welcome_token: settings?.welcome_token ?? DEFAULT_SETTINGS.welcome_token,
        default_token_price: { amount: 0 }, // Inisialisasi sementara
        payment_info: {
          bank_name: '',
          account_number: '',
          account_name: ''
        },
        service_fees: serviceFees,
      };
    } catch (error) {
      console.error('Error initializing settings:', error);
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    const fetchDefaultPrice = async () => {
      try {
        const { data, error } = await supabase
          .from('default_prices')
          .select('amount')
          .eq('name', 'token_price')
          .single();

        if (error) {
          console.error('Error fetching default price:', error);
          return;
        }

        if (data) {
          setLocalSettings(prev => ({
            ...prev,
            default_token_price: { amount: data.amount }
          }));
        }
      } catch (error) {
        console.error('Error in fetchDefaultPrice:', error);
      }
    };

    const fetchPaymentInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_info')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching payment info:', error);
          return;
        }

        if (data) {
          setLocalSettings(prev => ({
            ...prev,
            payment_info: {
              bank_name: data.bank_name,
              account_number: data.account_number,
              account_name: data.account_name
            }
          }));
        }
      } catch (error) {
        console.error('Error in fetchPaymentInfo:', error);
      }
    };

    fetchDefaultPrice();
    fetchPaymentInfo();
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      const keyParts = key.split('.');

      if (keyParts.length === 2) {
        const [outer, inner] = keyParts;
        if (outer === 'payment_info') {
          newSettings.payment_info = {
            ...newSettings.payment_info,
            [inner]: value
          };
        } else if (outer === 'service_fees') {
          const feeKey = inner as ServiceFeeKey;
          newSettings.service_fees = {
            ...newSettings.service_fees,
            [feeKey]: parseInt(value) || 0
          };
        }
      } else if (key === 'token_expiration') {
        newSettings.token_expiration = { days: parseInt(value) || 0 };
      } else if (key === 'minimum_token_request') {
        newSettings.minimum_token_request = { amount: parseInt(value) || 0 };
      } else if (key === 'minimum_balance') {
        newSettings.minimum_balance = { amount: parseInt(value) || 0 };
      } else if (key === 'welcome_token') {
        newSettings.welcome_token = { amount: parseInt(value) || 0 };
      } else if (key === 'default_token_price') {
        newSettings.default_token_price = { amount: parseInt(value) || 0 };
      }

      return newSettings;
    });
  };

  const handleUpdate = async (key: string) => {
    try {
      if (key.startsWith('payment_info.')) {
        const field = key.split('.')[1];
        const updateData = {
          bank_name: localSettings.payment_info.bank_name,
          account_number: localSettings.payment_info.account_number,
          account_name: localSettings.payment_info.account_name
        };

        // Update data di Supabase untuk payment_info
        const { error } = await supabase
          .from('payment_info')
          .update(updateData)
          .eq('id', 1);
        
        if (error) {
          console.error('Error updating payment info:', error);
          return;
        }

        // Refresh data payment_info setelah update
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_info')
          .select('*')
          .single();

        if (!paymentError && paymentData) {
          setLocalSettings(prev => ({
            ...prev,
            payment_info: {
              bank_name: paymentData.bank_name,
              account_number: paymentData.account_number,
              account_name: paymentData.account_name
            }
          }));
        }

        // Panggil onUpdate untuk memperbarui state parent
        await onUpdate(key, updateData);
        return;
      }

      let value: any;
      let table: string;
      let updateData: any;

      if (key.startsWith('service_fees_')) {
        const feeKey = key.replace('service_fees_', '') as ServiceFeeKey;
        value = { amount: localSettings.service_fees[feeKey] };
        table = 'settings';
        updateData = { int_value: localSettings.service_fees[feeKey] };
      } else if (key === 'default_token_price') {
        value = { amount: localSettings.default_token_price.amount };
        table = 'default_prices';
        updateData = { 
          amount: localSettings.default_token_price.amount,
          name: 'token_price',
          description: 'Price per token in Rupiah'
        };
      } else {
        const settingsKey = key as SettingsKey;
        value = localSettings[settingsKey];
        table = 'settings';
        updateData = { int_value: value.amount };
      }

      // Update data di Supabase untuk selain payment_info
      if (table === 'default_prices') {
        const { error } = await supabase
          .from(table)
          .upsert(updateData, { onConflict: 'name' });
        
        if (error) {
          console.error('Error updating default price:', error);
          return;
        }
      } else {
        const { error } = await supabase
          .from(table)
          .update(updateData)
          .eq('key', key);
        
        if (error) {
          console.error('Error updating settings:', error);
          return;
        }
      }

      // Panggil onUpdate untuk memperbarui state parent
      await onUpdate(key, value);

      // Refresh data setelah update
      if (table === 'default_prices') {
        const { data: priceData, error: priceError } = await supabase
          .from('default_prices')
          .select('amount')
          .eq('name', 'token_price')
          .single();

        if (!priceError && priceData) {
          setLocalSettings(prev => ({
            ...prev,
            default_token_price: { amount: priceData.amount }
          }));
        }
      } else {
        const { data, error } = await supabase
          .from('settings')
          .select('key, int_value')
          .eq('key', key)
          .single();

        if (!error && data) {
          const feeKey = key.replace('service_fees_', '') as ServiceFeeKey;
          setLocalSettings(prev => ({
            ...prev,
            service_fees: {
              ...prev.service_fees,
              [feeKey]: data.int_value ?? 0
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error in handleUpdate:', error);
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
              value: localSettings.welcome_token.amount,
              type: 'number'
            },
            {
              label: 'Token expiration (days)',
              icon: <Clock className="w-5 h-5" />,
              key: 'token_expiration',
              value: localSettings.token_expiration.days,
              type: 'number'
            },
            {
              label: 'Minimum token request',
              icon: <Coins className="w-5 h-5" />,
              key: 'minimum_token_request',
              value: localSettings.minimum_token_request.amount,
              type: 'number'
            },
            {
              label: 'Minimum balance for transfers',
              icon: <Coins className="w-5 h-5" />,
              key: 'minimum_balance',
              value: localSettings.minimum_balance.amount,
              type: 'number'
            },
            {
              label: 'Default Token Price',
              icon: <Coins className="w-5 h-5" />,
              key: 'default_token_price',
              value: localSettings.default_token_price.amount,
              type: 'number'
            },
            {
              label: 'Bank Name',
              icon: <Building2 className="w-5 h-5" />,
              key: 'payment_info.bank_name',
              value: localSettings.payment_info.bank_name,
              type: 'text'
            },
            {
              label: 'Account Number',
              icon: <CreditCard className="w-5 h-5" />,
              key: 'payment_info.account_number',
              value: localSettings.payment_info.account_number,
              type: 'text'
            },
            {
              label: 'Account Name',
              icon: <User className="w-5 h-5" />,
              key: 'payment_info.account_name',
              value: localSettings.payment_info.account_name,
              type: 'text'
            },
          ].map(({ label, icon, key, value, type }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                {icon}
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  type={type}
                  value={value ?? ''}
                  onChange={(e) => handleSettingChange(key, e.target.value)}
                  min={type === 'number' ? '0' : undefined}
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
                  value={localSettings.service_fees[key] ?? 0}
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