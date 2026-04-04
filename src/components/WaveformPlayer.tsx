import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';

interface WaveformPlayerProps {
  audioUrl: string;
  onReady?: (wavesurfer: WaveSurfer) => void;
}

export default function WaveformPlayer({ audioUrl, onReady }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    setHasError(false);

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5', // Indigo-600
      progressColor: '#818cf8', // Indigo-400
      cursorColor: '#c7d2fe', // Indigo-200
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
    });

    wavesurfer.load(audioUrl).catch((err) => {
      let errMsg = '';
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errMsg = String((err as any).message);
      } else {
        errMsg = String(err);
      }
      
      if (errMsg.includes('aborted') || errMsg.includes('abort')) {
        return;
      }
      console.error('WaveSurfer load error:', err);
      setIsReady(false);
      setHasError(true);
    });

    wavesurfer.on('ready', () => {
      setIsReady(true);
      if (onReady) {
        onReady(wavesurfer);
      }
    });

    wavesurfer.on('error', (err) => {
      // Ignore abort errors caused by React Strict Mode double-rendering or unmounting
      let errMsg = '';
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errMsg = String((err as any).message);
      } else {
        errMsg = String(err);
      }
      
      if (errMsg.includes('aborted') || errMsg.includes('abort')) {
        return;
      }
      console.error('WaveSurfer error:', err);
      setIsReady(false);
      setHasError(true);
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = wavesurfer;

    return () => {
      try {
        wavesurfer.destroy();
      } catch (err) {
        // Ignore "Cannot close a closed AudioContext" errors during cleanup
        console.debug('WaveSurfer cleanup error:', err);
      }
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.playPause();
    }
  };

  if (hasError) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 mb-6 text-zinc-400 text-sm italic">
        Temporary recording is no longer available.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 mb-6">
      <button
        onClick={togglePlayPause}
        disabled={!isReady}
        className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </button>
      <div className="flex-grow" ref={containerRef}></div>
    </div>
  );
}
