import { X } from 'lucide-react';
import type { JSX, ReactNode } from 'react';
import AudioPlayer from './AudioPlayer';
import type { AudioPlayerState } from './useAudioPlayer';

interface DetailPanelProps {
    /** Panel heading, e.g. "Order Details" or "Reservation Details" */
    title: string;
    /** Subtitle id label, e.g. "#1234" or "ID: abc" */
    idLabel: string;
    onClose: () => void;
    /** Customer / guest info for the avatar card */
    customer: {
        name?: string;
        phone?: string;
        /** Transcription for orders, note text for reservations */
        note?: string;
    };
    loading?: boolean;
    /** Full audio player state from useAudioPlayer hook */
    audio: AudioPlayerState;
    /** Detail rows specific to each page (items, date/time, party size, etc.) */
    children?: ReactNode;
    /** Footer action buttons */
    footer?: ReactNode;
}

export default function DetailPanel({
    title,
    idLabel,
    onClose,
    customer,
    loading,
    audio,
    children,
    footer,
}: DetailPanelProps): JSX.Element {
    const initials = ((customer.name ?? 'G')
        .toString()
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')) || 'G';

    return (
        <aside className="fixed right-0 top-0 bottom-0 w-[380px] border-l border-[#e8e9f3] bg-white overflow-hidden z-50">
            <div className="flex flex-col h-full">

                {/* Fixed top: header + customer card + audio — never scrolls */}
                <div className="flex-shrink-0 p-6 pb-3 space-y-4 border-b border-[#e8e9f3]">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-extrabold text-[#0e101b]">{title}</h3>
                            <p className="text-xs text-[#505795] uppercase tracking-widest mt-1">{idLabel}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[#f8f9fb] cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="text-black" />
                        </button>
                    </div>

                    {/* Customer card */}
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-14 w-48 bg-gray-200 rounded animate-pulse" />
                            <div className="h-36 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ) : (
                        <div className="bg-primary/5 rounded-xl p-4 border border-[#e8e9f3] overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-700 flex items-center justify-center text-white text-xl font-black">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-base font-bold text-[#0e101b] break-words">{customer.name}</div>
                                    <div className="text-sm text-[#505795]">{customer.phone ?? ''}</div>
                                </div>
                            </div>
                            {customer.note && (
                                <div className="text-sm text-[#505795] mt-3 break-words whitespace-normal line-clamp-3">
                                    {customer.note}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Audio player */}
                    <AudioPlayer
                        audioRef={audio.audioRef}
                        audioSrc={audio.audioSrc}
                        audioError={audio.audioError}
                        duration={audio.duration}
                        curTime={audio.curTime}
                        isPlaying={audio.isPlaying}
                        volume={audio.volume}
                        progressPercent={audio.progressPercent}
                        formatTime={audio.formatTime}
                        onSeek={audio.onSeek}
                        handleRewind={audio.handleRewind}
                        handleForward={audio.handleForward}
                        togglePlay={audio.togglePlay}
                        toggleMute={audio.toggleMute}
                        setVolume={audio.setVolume}
                    />
                </div>

                {/* Scrollable zone: page-specific detail rows only */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 [scrollbar-width:thin] [scrollbar-color:#d1d3e6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#d1d3e6] [&::-webkit-scrollbar-thumb]:rounded-full">
                    {children}
                </div>

                {/* Footer — pinned, never scrolls */}
                <div className="flex-shrink-0 border-t border-[#e8e9f3] bg-white p-6 grid grid-cols-2 gap-3">
                    {loading ? (
                        <>
                            <div className="h-11 rounded-lg bg-gray-200 animate-pulse" />
                            <div className="h-11 rounded-lg bg-gray-200 animate-pulse" />
                        </>
                    ) : (
                        footer ?? <div className="col-span-2" />
                    )}
                </div>
            </div>
        </aside>
    );
}
