'use client';
import React, { useState } from 'react';
import { ethers } from 'ethers';
import abiJson from '@/abi/MonkeyFarApeVoucher.json';

export default function RedeemPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleRedeem() {
    try {
      setLoading(true); setStatus('Requesting voucher...');
      const resp = await fetch('/api/voucher', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({}) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Voucher failed');

      const { voucher, signature, mintPrice } = data;
      setStatus('Connecting wallet...');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS) as string;
      const contract = new ethers.Contract(contractAddress, (abiJson as any).abi, signer);
      setStatus('Sending transaction...');
      const tx = await contract.redeem(voucher, signature, { value: mintPrice });
      setStatus('Waiting for confirmation...');
      const receipt = await tx.wait();
      setStatus(`Minted! Tx: ${receipt.transactionHash}`);
    } catch (e:any) {
      setStatus(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Monkey Far App — Redeem</h1>
      <p>Mint NFT di Base mainnet. Pastikan wallet ada ETH di jaringan Base.</p>
      <button disabled={loading} onClick={handleRedeem} style={{ padding: '8px 16px' }}>
        {loading ? 'Processing...' : 'Mint Now'}
      </button>
      <p style={{ marginTop: 12, wordBreak: 'break-all' }}>{status}</p>
    </div>
  );
}
