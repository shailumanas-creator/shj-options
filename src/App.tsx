/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  Clock, 
  BarChart3, 
  History,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTradeSuggestion } from './services/geminiService';

interface Trade {
  id?: number;
  Market: string;
  Direction: string;
  Strike: string;
  Entry_Price: number;
  Stop_Loss: number;
  Target_Price: number;
  Risk_Amount: number;
  Lot_Size: number;
  Reason_For_Entry: string;
  Confidence_Score_0_to_10: number;
  timestamp?: string;
  Trade?: string;
  Reason?: string;
}

const MARKETS = [
  "Nifty 50",
  "BankNifty",
  "Reliance (Stock)",
  "HDFC Bank (Stock)",
  "MCX GoldM",
  "MCX SilverM"
];

export default function App() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Trade | null>(null);
  const [history, setHistory] = useState<Trade[]>([]);
  const [marketData, setMarketData] = useState({
    price: 22450.50,
    vwap: 22430.20,
    ema20: 22445.10,
    ema50: 22420.00,
    vix: 15.4,
    volume: "High",
    structure: "Higher High / Higher Low"
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setSuggestion(null);
    
    // Construct a realistic prompt based on current "simulated" state
    const dataString = `
      Market: ${selectedMarket}
      Current Price: ${marketData.price}
      VWAP: ${marketData.vwap}
      20 EMA: ${marketData.ema20}
      50 EMA: ${marketData.ema50}
      India VIX: ${marketData.vix}
      Volume: ${marketData.volume}
      Structure: ${marketData.structure}
      Time: ${new Date().toLocaleTimeString()}
    `;

    try {
      const result = await getTradeSuggestion(dataString);
      setSuggestion(result);
      
      if (result.Trade !== "NO TRADE") {
        await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        });
        fetchHistory();
      }
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setLoading(false);
    }
  };

  const simulateMarketMove = () => {
    setMarketData(prev => ({
      ...prev,
      price: prev.price + (Math.random() - 0.5) * 20,
      ema20: prev.ema20 + (Math.random() - 0.5) * 5,
      ema50: prev.ema50 + (Math.random() - 0.5) * 2,
    }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto relative overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-1">QuantTrade India</h1>
          <p className="text-xs font-mono opacity-60 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-emerald-600" /> System Status: Operational / Intraday Mode
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="terminal-card px-3 py-1 flex items-center gap-2">
            <Clock size={14} /> {new Date().toLocaleTimeString()}
          </div>
          <div className="terminal-card px-3 py-1 flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-600" /> Risk Limit: ₹1000
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Market Feed & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <section className="terminal-card p-6">
            <h2 className="col-header mb-4">Market Selection</h2>
            <div className="space-y-2">
              {MARKETS.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMarket(m)}
                  className={`w-full text-left px-4 py-3 border transition-all flex justify-between items-center ${
                    selectedMarket === m 
                      ? 'bg-ink text-bg border-ink' 
                      : 'border-line/20 hover:border-ink'
                  }`}
                >
                  <span className="font-medium">{m}</span>
                  {selectedMarket === m && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
          </section>

          <section className="terminal-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="col-header">Live Indicators</h2>
              <button onClick={simulateMarketMove} className="p-1 hover:rotate-180 transition-transform duration-500">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-line/10 pb-2">
                <span className="opacity-60">Price</span>
                <span className="font-bold">{marketData.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-line/10 pb-2">
                <span className="opacity-60">VWAP</span>
                <span>{marketData.vwap.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-line/10 pb-2">
                <span className="opacity-60">20 EMA</span>
                <span className={marketData.ema20 > marketData.ema50 ? 'text-emerald-600' : 'text-red-600'}>
                  {marketData.ema20.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-b border-line/10 pb-2">
                <span className="opacity-60">50 EMA</span>
                <span>{marketData.ema50.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-line/10 pb-2">
                <span className="opacity-60">India VIX</span>
                <span className={marketData.vix > 20 ? 'text-red-600' : ''}>{marketData.vix}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Structure</span>
                <span className="text-xs">{marketData.structure}</span>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-8 bg-ink text-bg py-4 font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 size={18} /> Generate Suggestion
                </>
              )}
            </button>
          </section>
        </div>

        {/* Right Column: Suggestion & History */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {suggestion ? (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`terminal-card p-8 border-l-8 ${
                  suggestion.Trade === "NO TRADE" ? 'border-l-orange-500' : 
                  suggestion.Direction === "CALL" ? 'border-l-emerald-500' : 'border-l-red-500'
                }`}
              >
                {suggestion.Trade === "NO TRADE" ? (
                  <div className="flex items-start gap-4">
                    <AlertCircle className="text-orange-500 shrink-0" size={32} />
                    <div>
                      <h3 className="text-2xl font-bold uppercase mb-2">No Valid Setup</h3>
                      <p className="opacity-70 italic">{suggestion.Reason}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        {suggestion.Direction === "CALL" ? (
                          <TrendingUp className="text-emerald-600" size={32} />
                        ) : (
                          <TrendingDown className="text-red-600" size={32} />
                        )}
                        <div>
                          <h3 className="text-3xl font-bold tracking-tighter">
                            {suggestion.Direction} {suggestion.Strike}
                          </h3>
                          <p className="text-xs font-mono opacity-60 uppercase">{suggestion.Market}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-ink/5 border border-ink/10">
                          <p className="text-[10px] uppercase opacity-50 mb-1">Entry Price</p>
                          <p className="text-xl font-mono font-bold">₹{suggestion.Entry_Price}</p>
                        </div>
                        <div className="p-4 bg-ink/5 border border-ink/10">
                          <p className="text-[10px] uppercase opacity-50 mb-1">Stop Loss</p>
                          <p className="text-xl font-mono font-bold text-red-600">₹{suggestion.Stop_Loss}</p>
                        </div>
                        <div className="p-4 bg-ink/5 border border-ink/10">
                          <p className="text-[10px] uppercase opacity-50 mb-1">Target</p>
                          <p className="text-xl font-mono font-bold text-emerald-600">₹{suggestion.Target_Price}</p>
                        </div>
                        <div className="p-4 bg-ink/5 border border-ink/10">
                          <p className="text-[10px] uppercase opacity-50 mb-1">Lot Size</p>
                          <p className="text-xl font-mono font-bold">{suggestion.Lot_Size} Lots</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 border border-ink/10 bg-white">
                        <h4 className="col-header mb-3">Analysis Rationale</h4>
                        <p className="text-sm leading-relaxed italic opacity-80">
                          "{suggestion.Reason_For_Entry}"
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span className="text-xs font-mono uppercase">Confidence: {suggestion.Confidence_Score_0_to_10}/10</span>
                        </div>
                        <div className="text-xs font-mono uppercase bg-ink text-bg px-2 py-1">
                          Risk: ₹{suggestion.Risk_Amount}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.section>
            ) : !loading && (
              <div className="terminal-card p-12 flex flex-col items-center justify-center text-center opacity-40">
                <BarChart3 size={48} className="mb-4" />
                <p className="font-mono text-sm uppercase tracking-widest">Awaiting Market Analysis Request</p>
              </div>
            )}
          </AnimatePresence>

          <section className="terminal-card overflow-hidden">
            <div className="p-4 border-b border-line flex justify-between items-center bg-ink/5">
              <h2 className="font-bold uppercase tracking-tight flex items-center gap-2">
                <History size={16} /> Trade History
              </h2>
              <span className="text-[10px] font-mono opacity-50 uppercase">{history.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-6 col-header bg-ink/5">
                  <span>Market</span>
                  <span>Type</span>
                  <span>Entry</span>
                  <span>SL</span>
                  <span>Target</span>
                  <span>Time</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="grid grid-cols-6 px-4 py-3 border-b border-line/10 text-xs font-mono hover:bg-ink hover:text-bg transition-colors">
                      <span className="font-bold">{h.Market || h.market}</span>
                      <span className={(h.Direction || h.direction) === 'CALL' ? 'text-emerald-600' : 'text-red-600'}>
                        {h.Direction || h.direction}
                      </span>
                      <span>{h.Entry_Price || h.entry_price}</span>
                      <span>{h.Stop_Loss || h.stop_loss}</span>
                      <span>{h.Target_Price || h.target_price}</span>
                      <span className="opacity-50">
                        {new Date(h.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="p-8 text-center opacity-30 italic text-sm">No trades recorded today.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-12 pt-8 border-t border-line/10 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-mono uppercase opacity-50">
        <div className="flex gap-6">
          <span>Strategy: EMA Crossover + VWAP</span>
          <span>Risk Model: Fixed ₹1000</span>
          <span>Execution: Manual Confirmation</span>
        </div>
        <div className="flex gap-6">
          <span>Data Feed: Simulated</span>
          <span>Engine: Gemini 3.1 Pro</span>
        </div>
      </footer>
    </div>
  );
}
