import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { Card } from '../shared/Card';
import { FormField } from '../shared/FormField';
import { Button } from '../shared/Button';
import { Toast } from '../shared/Toast';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface RequestFormProps {
  minAmount: number;
  onSubmit: (amount: number) => Promise<void>;
}

interface PaymentInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export function RequestForm({ minAmount }: RequestFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchPaymentInfo();
    checkPendingRequests();
  }, []);

  const fetchPaymentInfo = async () => {
    const { data, error } = await supabase
      .from('payment_info')
      .select('*')
      .single();

    if (!error && data) {
      setPaymentInfo(data);
    }
  };

  const checkPendingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('token_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1);

    if (!error && data) {
      setHasPendingRequest(data.length > 0);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    const tokenAmount = parseInt(amount);
    if (isNaN(tokenAmount) || tokenAmount < minAmount) {
      setError(`Minimum request amount is ${minAmount} tokens`);
      return;
    }

    if (!user?.phone) {
      showToast('Please add your phone number in your profile settings before requesting tokens', 'error');
      return;
    }

    if (hasPendingRequest) {
      showToast('You already have a pending token request. Please wait for admin approval.', 'error');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: requestError } = await supabase
        .from('token_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          amount: tokenAmount,
          status: 'pending'
        });

      if (requestError) throw requestError;

      // Send notification to user
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: user.phone,
          message: `Hi, ${user.name}. Thank you for your order.\nYou have made a Token Request ${tokenAmount}.\n\nPlease make a payment of:\nRp 200 x ${tokenAmount} token request = Rp ${200 * tokenAmount}\n\nInvoice ini berlaku 1x24 jam. Segera lakukan pembayaran.\n\nStatus : Waiting Payment\n\nRekening pembayaran : ${paymentInfo ? `${paymentInfo.bank_name} ${paymentInfo.account_number} a.n ${paymentInfo.account_name}` : ''}`,
          apiKey: 'b948bcee-12f1-4774-83fe-0573e3af247a'
        })
      });

      // Send notification to admin
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: '082231176609',
          message: `Hi, Admin PhotoProductAI.\n\nThere is a Token Request from ${user.email}.\nRp 200 x ${tokenAmount} token request = Rp ${200 * tokenAmount}\n\nCek Admin Panel Pastikan sudah ada pembayaran`,
          apiKey: 'b948bcee-12f1-4774-83fe-0573e3af247a'
        })
      });

      setAmount('');
      showToast('Token request submitted successfully', 'success');
      setHasPendingRequest(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to request tokens');
      showToast('Failed to submit token request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Request Tokens"
      description="Submit a new token request to admin"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <FormField
            type="number"
            label="Token Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={minAmount}
            placeholder={`Enter amount (min. ${minAmount})`}
            error={error}
            icon={<Coins className="w-5 h-5" />}
          />
        </div>

        {!user?.phone && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              You need to add your phone number in your profile settings before requesting tokens.
            </p>
          </div>
        )}

        {hasPendingRequest && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              You have a pending token request. Please wait for admin approval before making another request.
            </p>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Minimum request amount: {minAmount} tokens</span>
            <br />
            After submitting your request, you will receive payment instructions via WhatsApp.
          </p>
        </div>

        <Button
          type="submit"
          loading={loading}
          icon={<Coins className="w-5 h-5" />}
          className="w-full"
          disabled={!user?.phone || hasPendingRequest}
        >
          {loading ? 'Processing...' : 'Submit Request'}
        </Button>
      </form>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </Card>
  );
}