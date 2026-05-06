import { useEffect, useRef, useState } from "react";
import { Play, Pause, Maximize, Film } from "lucide-react";

interface VideoPlayerProps {
  url: string | null;
  onWatched?: () => void;
  watched?: boolean;
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function toYouTubeEmbed(url: string) {
  const idMatch =
    url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  const id = idMatch?.[1];
  if (!id) return url;
  return `https://www.youtube.com/embed/${id}`;
}

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ url, onWatched, watched }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = !!watched;
  }, [watched]);

  if (!url) {
    return (
      <div
        className="aspect-video w-full rounded-xl shadow-md flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1B4332, #2D6A4F)" }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20 mb-3">
          <Play className="h-8 w-8 text-white ml-1" />
        </div>
        <p className="text-white/80 text-sm">Vídeo em breve</p>
      </div>
    );
  }

  if (isYouTube(url)) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md bg-black">
        <iframe
          src={toYouTubeEmbed(url)}
          className="w-full h-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title="Vídeo da etapa"
        />
      </div>
    );
  }

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    if (
      !firedRef.current &&
      v.duration > 0 &&
      v.currentTime / v.duration >= 0.9
    ) {
      firedRef.current = true;
      onWatched?.();
    }
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-xl overflow-hidden shadow-md bg-black group"
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
      />

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          aria-label="Reproduzir"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="h-10 w-10 text-[#1B4332] ml-1" />
          </div>
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div
          className="h-1.5 bg-white/30 rounded-full cursor-pointer mb-2"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-white text-xs">
          <button onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproduzir"}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <span className="font-mono">
            {fmt(current)} / {fmt(duration)}
          </span>
          <button onClick={toggleFullscreen} aria-label="Tela cheia">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
