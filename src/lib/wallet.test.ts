import { describe, expect, it } from 'bun:test';
import { createStoryWallet, ensureWalletHasFunds, recordIncomingTransfer } from './wallet';

describe('fictional wallet ledger', () => {
  it('keeps wallets scoped to each chat and persona', () => {
    const first = createStoryWallet('chat-a', 'persona-a');
    const other = createStoryWallet('chat-b', 'persona-a');
    expect(first.id).not.toBe(other.id);
    expect(first.accounts.find((account) => account.type === 'cash')?.balanceCents).toBeGreaterThan(0);
  });
  it('restores a starting balance when an older wallet has been emptied', () => {
    const wallet = createStoryWallet('chat-a', 'persona-a');
    const empty = { ...wallet, accounts: wallet.accounts.map((account) => ({ ...account, balanceCents: 0 })) };
    expect(ensureWalletHasFunds(empty).accounts.find((account) => account.type === 'cash')?.balanceCents).toBeGreaterThan(0);
  });
  it('adds an incoming transfer once and updates cash in integer cents', () => {
    const wallet = createStoryWallet('chat-a', 'persona-a');
    const input = { eventId: 'transfer-1', sender: 'Lou', recipient: 'Emmy', amountCents: 75000, memo: 'For you', timestamp: 100 };
    const posted = recordIncomingTransfer(wallet, input);
    expect(posted.accounts.find((account) => account.type === 'cash')?.balanceCents).toBe(wallet.accounts.find((account) => account.type === 'cash')!.balanceCents + 75000);
    expect(recordIncomingTransfer(posted, input)).toBe(posted);
    expect(posted.transactions).toHaveLength(1);
  });
  it('rejects invalid balances', () => {
    const wallet = createStoryWallet('chat-a', 'persona-a');
    expect(() => recordIncomingTransfer(wallet, { eventId: 'bad', sender: 'Lou', recipient: 'Emmy', amountCents: 0, memo: '' })).toThrow();
  });
});
