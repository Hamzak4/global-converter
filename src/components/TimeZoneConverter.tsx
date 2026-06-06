import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Trash2, Calendar } from 'lucide-react';

interface TimeZoneConverterProps {
  currentLang: 'en' | 'es' | 'ur';
}

interface TZOption {
  id: string;
  name: string;
  fullName: string;
  offset: number; // relative to UTC in hours
  country: string;
}

const TZ_OPTIONS: TZOption[] = [
  { id: 'UTC', name: 'UTC / GMT', fullName: 'Coordinated Universal Time', offset: 0, country: 'International' },
  { id: 'EST', name: 'New York (EST/EDT)', fullName: 'Eastern Standard Time', offset: -5, country: 'United States' },
  { id: 'PST', name: 'Los Angeles (PST/PDT)', fullName: 'Pacific Standard Time', offset: -8, country: 'United States' },
  { id: 'CST', name: 'Chicago (CST/CDT)', fullName: 'Central Standard Time', offset: -6, country: 'United States' },
  { id: 'GMT', name: 'London (GMT/BST)', fullName: 'Greenwich Mean Time', offset: 0, country: 'United Kingdom' },
  { id: 'CET', name: 'Paris (CET/CEST)', fullName: 'Central European Time', offset: 1, country: 'France' },
  { id: 'IST', name: 'Mumbai (IST)', fullName: 'Indian Standard Time', offset: 5.5, country: 'India' },
  { id: 'PKT', name: 'Karachi (PKT)', fullName: 'Pakistan Standard Time', offset: 5, country: 'Pakistan' },
  { id: 'JST', name: 'Tokyo (JST)', fullName: 'Japan Standard Time', offset: 9, country: 'Japan' },
  { id: 'AEST', name: 'Sydney (AEST/AEDT)', fullName: 'Australian Eastern Time', offset: 10, country: 'Australia' },
  { id: 'GST', name: 'Dubai (GST)', fullName: 'Gulf Standard Time', offset: 4, country: 'United Arab Emirates' }
];

export const TimeZoneConverter: React.FC<TimeZoneConverterProps> = () => {
  const [baseTzId, setBaseTzId] = useState<string>('EST');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Scrub value (minutes from 00:00 to 1439 of the chosen day)
  const [scrubMinutes, setScrubMinutes] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<string[]>(['UTC', 'PST', 'CET', 'IST', 'JST']);

  useEffect(() => {
    // Sync scrub value to current time on load
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    setScrubMinutes(mins);
  }, []);

  useEffect(() => {
    if (isScrubbing) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      // Automatically slide if not busy scrubbing
      const mins = now.getHours() * 60 + now.getMinutes();
      setScrubMinutes(mins);
    }, 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, [isScrubbing]);

  const baseZone = TZ_OPTIONS.find(t => t.id === baseTzId)!;

  // Compute datetime from the slider scrub
  const getCalculatedTimeForBase = (): Date => {
    const d = new Date(currentTime);
    const hrs = Math.floor(scrubMinutes / 60);
    const mns = scrubMinutes % 60;
    d.setHours(hrs);
    d.setMinutes(mns);
    d.setSeconds(0);
    return d;
  };

  const calculatedBaseTime = getCalculatedTimeForBase();

  const getTargetTime = (targetTzId: string): Date => {
    const targetZone = TZ_OPTIONS.find(t => t.id === targetTzId)!;
    
    // Difference between target offset and base offset in hours
    const diffHours = targetZone.offset - baseZone.offset;
    const computedDate = new Date(calculatedBaseTime.getTime() + diffHours * 60 * 60 * 1000);
    return computedDate;
  };

  const addToWatchlist = (tzId: string) => {
    if (!watchlist.includes(tzId) && tzId !== baseTzId) {
      setWatchlist([...watchlist, tzId]);
    }
  };

  const removeFromWatchlist = (tzId: string) => {
    setWatchlist(watchlist.filter(id => id !== tzId));
  };

  const formatTimeString = (date: Date): { time: string; period: string; dateStr: string } => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    return {
      time: `${hours}:${minutesStr}`,
      period,
      dateStr
    };
  };

  const currentBaseFormatted = formatTimeString(calculatedBaseTime);

  return (
    <div id="timezone-converter-root" className="space-y-6">
      
      {/* Prime Base Clock Header */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-slate-950/10">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5 mb-5 relative z-10">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">
              Anchor Reference Timezone
            </span>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <Clock className="h-4.5 w-4.5 text-blue-500" />
              <select
                value={baseTzId}
                onChange={(e) => {
                  setBaseTzId(e.target.value);
                  // Remove from watchlist if selected as base
                  setWatchlist(watchlist.filter(id => id !== e.target.value));
                }}
                className="bg-transparent text-sm font-black border-none text-white focus:outline-none cursor-pointer pr-4"
              >
                {TZ_OPTIONS.map((tz) => (
                  <option key={tz.id} value={tz.id} className="bg-slate-900 text-white">
                    {tz.name} (UTC{tz.offset >= 0 ? `+${tz.offset}` : tz.offset})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-1">{baseZone.fullName}</p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans">
              {currentBaseFormatted.time}
              <span className="text-sm font-bold text-blue-400 ml-1 uppercase">{currentBaseFormatted.period}</span>
            </span>
            <div className="flex items-center space-x-1.5 md:justify-end text-xs text-slate-400 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{currentBaseFormatted.dateStr}</span>
            </div>
          </div>
        </div>

        {/* scrub Slider Timeline */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>00:00 Midnight</span>
            <span>06:00 AM</span>
            <span>12:00 Noon</span>
            <span>06:00 PM</span>
            <span>11:59 PM</span>
          </div>
          <input
            type="range"
            min="0"
            max="1439"
            value={scrubMinutes}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={() => setIsScrubbing(false)}
            onTouchStart={() => setIsScrubbing(true)}
            onTouchEnd={() => setIsScrubbing(false)}
            onChange={(e) => setScrubMinutes(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[11px] font-semibold text-blue-300">
            <span>Coordinate any time above by dragging timeline slider</span>
            <button 
              onClick={() => {
                const now = new Date();
                setCurrentTime(now);
                setScrubMinutes(now.getHours() * 60 + now.getMinutes());
              }}
              className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 tracking-wide font-mono"
            >
              Sync to current time
            </button>
          </div>
        </div>
      </div>

      {/* Target watchlist Cards Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            Destination Clocks
          </span>
          
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 font-semibold font-mono">Add Watcher:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addToWatchlist(e.target.value);
                  e.target.value = '';
                }
              }}
              className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-850 p-1.5 rounded-lg focus:outline-none"
            >
              <option value="">Select city...</option>
              {TZ_OPTIONS.filter(o => o.id !== baseTzId && !watchlist.includes(o.id)).map(tz => (
                <option key={tz.id} value={tz.id}>
                  {tz.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((tzId) => {
            const tz = TZ_OPTIONS.find(t => t.id === tzId);
            if (!tz) return null;
            
            const targetTime = getTargetTime(tzId);
            const targetFormatted = formatTimeString(targetTime);

            return (
              <motion.div
                key={tzId}
                layout
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {tz.name}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-400 font-mono block tracking-wide mt-0.5 uppercase">
                      {tz.fullName}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(tzId)}
                    className="p-1 text-slate-350 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-end mt-6">
                  <div>
                    <span className="text-lg font-extrabold tracking-tight text-slate-700 dark:text-slate-200">
                      {targetFormatted.time}
                    </span>
                    <span className="text-[10px] font-extrabold text-blue-500 uppercase ml-0.5">
                      {targetFormatted.period}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-semibold">{targetFormatted.dateStr}</p>
                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                      Offset: {tz.offset - baseZone.offset >= 0 ? `+${tz.offset - baseZone.offset}` : tz.offset - baseZone.offset}h from base
                    </p>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
