import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioPlayerState {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    audioSrc: string | null;
    setAudioSrc: (src: string | null) => void;
    audioError: string | null;
    setAudioError: (err: string | null) => void;
    duration: number;
    curTime: number;
    isPlaying: boolean;
    volume: number;
    setVolume: React.Dispatch<React.SetStateAction<number>>;
    progressPercent: number;
    formatTime: (secs?: number | null) => string;
    onSeek: (time: number) => void;
    handleRewind: () => void;
    handleForward: () => void;
    togglePlay: () => void;
    toggleMute: () => void;
}

export function useAudioPlayer(): AudioPlayerState {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const prevVolumeRef = useRef<number>(100);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [curTime, setCurTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(100);

    const progressPercent = duration ? Math.max(0, Math.min(100, (curTime / duration) * 100)) : 0;

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        if (audioSrc) {
            a.src = audioSrc;
            a.load();
        } else {
            a.removeAttribute('src');
            a.load();
            setDuration(0);
            setCurTime(0);
            setIsPlaying(false);
        }
    }, [audioSrc]);

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        const onLoaded = () => setDuration(isFinite(a.duration) ? a.duration : 0);
        const onTime = () => setCurTime(a.currentTime || 0);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);

        a.addEventListener('loadedmetadata', onLoaded);
        a.addEventListener('timeupdate', onTime);
        a.addEventListener('play', onPlay);
        a.addEventListener('pause', onPause);
        a.addEventListener('ended', onEnded);

        return () => {
            a.removeEventListener('loadedmetadata', onLoaded);
            a.removeEventListener('timeupdate', onTime);
            a.removeEventListener('play', onPlay);
            a.removeEventListener('pause', onPause);
            a.removeEventListener('ended', onEnded);
        };
    }, [audioSrc]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }, [volume]);

    const onSeek = useCallback((time: number) => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = Math.max(0, Math.min(time, duration || a.duration || Infinity));
        setCurTime(a.currentTime);
    }, [duration]);

    const handleRewind = useCallback(() => { onSeek((audioRef.current?.currentTime || 0) - 5); }, [onSeek]);
    const handleForward = useCallback(() => { onSeek((audioRef.current?.currentTime || 0) + 5); }, [onSeek]);

    const togglePlay = useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        if (isPlaying) a.pause();
        else a.play().catch(() => { });
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
        const a = audioRef.current;
        if (a) {
            if (a.muted || a.volume === 0) {
                a.muted = false;
                const v = prevVolumeRef.current ?? 100;
                a.volume = Math.max(0, Math.min(1, v / 100));
                setVolume(v);
            } else {
                prevVolumeRef.current = Math.round((a.volume || 1) * 100);
                a.muted = true;
                a.volume = 0;
                setVolume(0);
            }
            return;
        }
        if (volume === 0) setVolume(prevVolumeRef.current ?? 100);
        else { prevVolumeRef.current = volume || 100; setVolume(0); }
    }, [volume]);

    const formatTime = (secs?: number | null) => {
        const s = Math.max(0, Math.floor(secs || 0));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return {
        audioRef,
        audioSrc,
        setAudioSrc,
        audioError,
        setAudioError,
        duration,
        curTime,
        isPlaying,
        volume,
        setVolume,
        progressPercent,
        formatTime,
        onSeek,
        handleRewind,
        handleForward,
        togglePlay,
        toggleMute,
    };
}
