import { Volume2, VolumeX } from 'lucide-react';
import type { JSX } from 'react';
import type { AudioPlayerState } from './useAudioPlayer';

interface AudioPlayerProps extends Pick<
    AudioPlayerState,
    | 'audioRef'
    | 'audioSrc'
    | 'audioError'
    | 'duration'
    | 'curTime'
    | 'isPlaying'
    | 'volume'
    | 'progressPercent'
    | 'formatTime'
    | 'onSeek'
    | 'handleRewind'
    | 'handleForward'
    | 'togglePlay'
    | 'toggleMute'
    | 'setVolume'
> { }

// Deterministic bar heights using sine variation for a natural waveform look
const BAR_COUNT = 48;
const barHeights: number[] = Array.from({ length: BAR_COUNT }, (_, i) => {
    const h = Math.abs(
        Math.sin(i * 0.45) * 0.5 +
        Math.sin(i * 1.1) * 0.3 +
        Math.sin(i * 0.22) * 0.2
    );
    return Math.max(0.15, Math.min(1, h));
});

export default function AudioPlayer({
    audioRef,
    audioSrc,
    duration,
    curTime,
    isPlaying,
    volume,
    progressPercent,
    formatTime,
    onSeek,
    handleRewind,
    handleForward,
    togglePlay,
    toggleMute,
    setVolume,
}: AudioPlayerProps): JSX.Element {
    return (
        <div className="w-full min-w-0 mb-3">
            <audio ref={audioRef} preload="auto" className="hidden" />

            <div className="flex flex-col border border-[#e8e9f3] rounded-lg pt-5 pb-3 px-3 gap-3">
                {/* Waveform row */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 tabular-nums w-8 text-right flex-shrink-0">
                        {formatTime(curTime)}
                    </span>

                    {/* Waveform bars */}
                    <div
                        className="flex-1 flex items-center gap-[2px] h-10 cursor-pointer"
                        onClick={(e) => {
                            if (!audioSrc) return;
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                            onSeek(pos * (duration || 0));
                        }}
                    >
                        {barHeights.map((h, i) => {
                            const barPos = ((i + 0.5) / BAR_COUNT) * 100;
                            const played = audioSrc && barPos <= progressPercent;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 rounded-full transition-colors duration-100"
                                    style={{
                                        height: `${Math.round(h * 100)}%`,
                                        backgroundColor: played ? '#2437e0' : '#d1d3e6',
                                        minWidth: '2px',
                                    }}
                                />
                            );
                        })}
                    </div>

                    <span className="text-xs text-slate-400 tabular-nums w-8 text-left flex-shrink-0">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleRewind}
                            aria-label="Rewind 5s"
                            disabled={!audioSrc}
                            className={`p-2 rounded-md ${audioSrc ? 'text-[#2437e0] hover:bg-[#eef2ff] cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6L11 18zM21 6v12l-8.5-6L21 6z" /></svg>
                        </button>
                        <button
                            onClick={togglePlay}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                            disabled={!audioSrc}
                            className={`p-2 rounded-full ${audioSrc ? 'text-white bg-[#2437e0] hover:bg-[#1a2ab8] cursor-pointer' : 'text-slate-300 bg-slate-100 cursor-not-allowed'}`}
                        >
                            {isPlaying ? (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18l15-9L5 3z" /></svg>
                            )}
                        </button>
                        <button
                            onClick={handleForward}
                            aria-label="Forward 5s"
                            disabled={!audioSrc}
                            className={`p-2 rounded-md ${audioSrc ? 'text-[#2437e0] hover:bg-[#eef2ff] cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 18V6l8.5 6L13 18zM3 6v12l8.5-6L3 6z" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                            disabled={!audioSrc}
                            className={`p-1.5 rounded-md ${audioSrc ? 'text-[#505795] hover:bg-[#eef2ff] cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                            {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            aria-label="volume"
                            disabled={!audioSrc}
                            className={`w-20 h-1 ${audioSrc ? 'accent-[#2437e0] cursor-pointer' : 'accent-slate-300 cursor-not-allowed'}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
