import React, { useState, useEffect } from 'react';
import { Save, Bell, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { FormField } from '../shared/FormField';
import { Toast } from '../shared/Toast';

interface NotificationTemplate {
  id: string;
  type: string;
  message: string;
  delay: number;
  is_enabled: boolean;
}

interface NotificationSettings {
  id: string;
  sender_phone: string;
  api_key: string;
  is_enabled: boolean;
}

const TEMPLATE_LABELS: Record<string, string> = {
  signup: 'User Sign Up',
  token_request_user: 'Token Request (User Notification)',
  token_request_admin: 'Token Request (Admin Notification)',
  token_transfer_sender: 'Token Transfer (Sender Notification)',
  token_transfer_recipient: 'Token Transfer (Recipient Notification)',
  token_request_pending: 'Token Request Status - Pending',
  token_request_approved: 'Token Request Status - Approved',
  token_request_rejected: 'Token Request Status - Rejected'
};

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    id: '',
    sender_phone: '082231176609', // Default sender number
    api_key: 'b948bcee-12f1-4774-83fe-0573e3af247a', // Default API key
    is_enabled: true
  });
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testDelay, setTestDelay] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .single();

    if (!error && data) {
      setSettings(data);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('type');

    if (!error && data) {
      setTemplates(data);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleSettingsUpdate = async () => {
    if (!settings) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({
          sender_phone: settings.sender_phone,
          api_key: settings.api_key,
          is_enabled: settings.is_enabled
        })
        .eq('id', settings.id);

      if (error) throw error;
      showToast('Settings updated successfully');
    } catch (err) {
      console.error('Error updating settings:', err);
      showToast('Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateUpdate = async (template: NotificationTemplate) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({
          message: template.message,
          delay: template.delay,
          is_enabled: template.is_enabled
        })
        .eq('id', template.id);

      if (error) throw error;
      showToast('Template updated successfully');
      await fetchTemplates();
    } catch (err) {
      console.error('Error updating template:', err);
      showToast('Failed to update template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateTestMessage = () => {
    if (!testPhone.trim()) {
      throw new Error('Phone number is required');
    }
    
    if (!testPhone.match(/^[0-9]+$/)) {
      throw new Error('Phone number must contain only numbers');
    }

    if (!testMessage.trim()) {
      throw new Error('Message text is required');
    }

    if (!settings?.api_key) {
      throw new Error('API key is not configured');
    }

    if (!settings.is_enabled) {
      throw new Error('Notifications are currently disabled');
    }
  };

  const handleTestMessage = async () => {
    setLoading(true);
    try {
      validateTestMessage();

      const response = await fetch('https://api.starsender.online/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'b948bcee-12f1-4774-83fe-0573e3af247a'
        },
        body: JSON.stringify({
          messageType: 'text',
          to: testPhone,
          body: testMessage,
          delay: testDelay
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to send message');
      }

      showToast('Test message sent successfully');
      setTestMessage('');
      setTestPhone('');
      setTestDelay(0);
    } catch (err) {
      console.error('Error sending test message:', err);
      showToast(err.message || 'Failed to send test message', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Global Settings */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">WhatsApp Notification Settings</h2>
            <p className="text-gray-600 mt-1">Configure your StarSender API settings</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.is_enabled}
                onChange={(e) => setSettings(prev => prev ? { ...prev, is_enabled: e.target.checked } : null)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">Enable Notifications</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            label="Sender Phone Number"
            type="text"
            value={settings.sender_phone}
            onChange={(e) => setSettings(prev => prev ? { ...prev, sender_phone: e.target.value } : null)}
            placeholder="Enter sender phone number"
            helper="Format: 628123456789 (include country code without +)"
          />

          <FormField
            label="API Key"
            type="password"
            value={settings.api_key}
            onChange={(e) => setSettings(prev => prev ? { ...prev, api_key: e.target.value } : null)}
            placeholder="Enter StarSender API key"
          />

          <Button
            onClick={handleSettingsUpdate}
            loading={loading}
            icon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>

        {/* Test Message Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Message</h3>
          <div className="space-y-4">
            <FormField
              label="Test Phone Number"
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Enter test phone number"
              helper="Format: 628123456789 (include country code without +)"
            />

            <FormField
              label="Test Message"
              type="textarea"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message"
            />

            <FormField
              label="Delay (seconds)"
              type="number"
              min={0}
              value={testDelay}
              onChange={(e) => setTestDelay(parseInt(e.target.value) || 0)}
              placeholder="Enter delay in seconds"
            />

            <Button
              onClick={handleTestMessage}
              loading={loading}
              icon={<Send className="w-4 h-4" />}
              disabled={!settings.is_enabled || !settings.api_key}
            >
              Send Test Message
            </Button>
          </div>
        </div>
      </Card>

      {/* Message Templates */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Templates</h2>
        
        <div className="space-y-8">
          {templates.map(template => (
            <div key={template.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{TEMPLATE_LABELS[template.type]}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={template.is_enabled}
                    onChange={(e) => {
                      const updatedTemplate = { ...template, is_enabled: e.target.checked };
                      setTemplates(prev => prev.map(t => t.id === template.id ? updatedTemplate : t));
                      handleTemplateUpdate(updatedTemplate);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="space-y-4">
                <FormField
                  label="Message Template"
                  type="textarea"
                  value={template.message}
                  onChange={(e) => {
                    const updatedTemplate = { ...template, message: e.target.value };
                    setTemplates(prev => prev.map(t => t.id === template.id ? updatedTemplate : t));
                  }}
                  onBlur={() => handleTemplateUpdate(template)}
                />

                <div className="flex items-center gap-4">
                  <FormField
                    label="Delay (seconds)"
                    type="number"
                    min={0}
                    value={template.delay}
                    onChange={(e) => {
                      const updatedTemplate = { ...template, delay: parseInt(e.target.value) || 0 };
                      setTemplates(prev => prev.map(t => t.id === template.id ? updatedTemplate : t));
                    }}
                    onBlur={() => handleTemplateUpdate(template)}
                  />
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Available variables:</p>
                    <ul className="mt-1 list-disc list-inside">
                      <li>{'{{name}}'} - User's name</li>
                      {template.type.includes('token') && (
                        <>
                          <li>{'{{amount}}'} - Token amount</li>
                          <li>{'{{price}}'} - Price per token</li>
                          <li>{'{{total}}'} - Total price</li>
                        </>
                      )}
                      {template.type.includes('transfer') && (
                        <>
                          <li>{'{{sender_email}}'} - Sender's email</li>
                          <li>{'{{recipient_email}}'} - Recipient's email</li>
                        </>
                      )}
                      {template.type.includes('request') && (
                        <>
                          <li>{'{{user_email}}'} - User's email</li>
                          {template.type === 'token_request_user' && (
                            <li>{'{{bank_info}}'} - Bank account information</li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}