import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

function calcRemaining(startTime, endTime) {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (now < start) {
    return { phase: 'before', diff: start - now, label: 'Ouvre dans' };
  }
  if (now < end) {
    return { phase: 'open', diff: end - now, label: 'Clôture dans' };
  }
  return { phase: 'ended', diff: 0, label: 'Marché clôturé' };
}

function formatDiff(ms) {
  if (ms <= 0) return '00h 00m 00s';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) return `${days}j ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
}

export function CountdownTimer({ startTime, endTime, compact = false }) {
  const [state, setState] = useState(() => calcRemaining(startTime, endTime));

  useEffect(() => {
    const id = setInterval(() => {
      setState(calcRemaining(startTime, endTime));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  if (state.phase === 'ended') {
    return (
      <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold">
        <Timer className="w-3.5 h-3.5" />
        <span>Marché clôturé</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-bold ${
        state.phase === 'open'
          ? 'bg-amber-50 border border-amber-200 text-amber-900'
          : 'bg-blue-50 border border-blue-200 text-[#0033B3]'
      } ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}
    >
      <Timer className="w-4 h-4 shrink-0 animate-pulse text-[#0033B3]" />
      <span>{state.label} :</span>
      <span className="font-mono font-black tracking-tight text-[#001B6B]">
        {formatDiff(state.diff)}
      </span>
    </div>
  );
}
