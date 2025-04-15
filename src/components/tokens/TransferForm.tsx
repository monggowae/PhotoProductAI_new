import React, { useState, useMemo } from 'react';
import { Send } from 'lucide-react';
import { Card } from '../shared/Card';
import { FormField } from '../shared/FormField';
import { Button } from '../shared/Button';

interface TransferFormProps {
  minTransferAmount: number;
  minBalance: number;
  availableTokens: number;
  onSubmit: (email: string, amount: number) => Promise<void>;
}

export function TransferForm({
  minTransferAmount,
  minBalance,
  availableTokens,
  onSubmit
}: TransferFormProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxTransferAmount = Math.max(0, availableTokens - minBalance);
  const transferAmount = parseInt(amount);
  
  const isValidAmount = useMemo(() => {
    if (!amount || isNaN(transferAmount)) return false;
    if (transferAmount < minTransferAmount) return false;
    if (transferAmount > maxTransferAmount) return false;
    return true;
  }, [amount, transferAmount, minTransferAmount, maxTransferAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !recipientEmail) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidAmount) {
      if (transferAmount < minTransferAmount) {
        setError(`Minimum transfer amount is ${minTransferAmount} tokens`);
      } else if (transferAmount > maxTransferAmount) {
        setError(`You must maintain a minimum balance of ${minBalance} tokens`);
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(recipientEmail, transferAmount);
      setRecipientEmail('');
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Send Tokens">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          type="email"
          label="Recipient Email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Enter recipient's email"
          error={error && !recipientEmail ? error : ''}
        />

        <FormField
          type="number"
          label="Token Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={minTransferAmount}
          max={maxTransferAmount}
          placeholder={`Enter amount to transfer (min. ${minTransferAmount})`}
          error={error && amount ? error : ''}
        />

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <p>You must maintain a minimum balance of {minBalance} tokens.</p>
          <p className="mt-1">Minimum transfer amount: {minTransferAmount} tokens</p>
          <p className="mt-1">Maximum transfer amount: {maxTransferAmount} tokens</p>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={!isValidAmount || !recipientEmail || loading}
          icon={<Send className="w-5 h-5" />}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Transfer Tokens'}
        </Button>
      </form>
    </Card>
  );
}