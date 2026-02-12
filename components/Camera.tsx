"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface CameraProps {
  onCapture: (imageBase64: string) => void;
  onError?: (error: string) => void;
}

export default function Camera({ onCapture, onError }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      const msg = "Camera access denied. Please allow camera access and try again.";
      setError(msg);
      onError?.(msg);
    }
  }, [onError]);

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    // Stop camera
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setStreaming(false);

    onCapture(dataUrl);
  }, [onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-vueling-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-vueling-dark font-medium text-sm mb-1">Camera not available</p>
        <p className="text-vueling-gray text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Video feed */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Passport guide overlay */}
        {streaming && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] h-[60%] border-2 border-white/60 rounded-lg relative">
              {/* Corner markers */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-vueling-yellow rounded-tl-md" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-vueling-yellow rounded-tr-md" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-vueling-yellow rounded-bl-md" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-vueling-yellow rounded-br-md" />

              {/* MRZ zone indicator */}
              <div className="absolute bottom-2 left-2 right-2 h-[25%] border border-dashed border-white/40 rounded flex items-center justify-center">
                <span className="text-white/50 text-[10px] font-mono">MRZ ZONE</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Capture button */}
      {streaming && (
        <div className="flex justify-center mt-5">
          <button
            onClick={capture}
            className="w-16 h-16 rounded-full bg-vueling-yellow border-4 border-white shadow-lg active:scale-95 transition-transform flex items-center justify-center"
            aria-label="Capture passport photo"
          >
            <div className="w-12 h-12 rounded-full border-2 border-vueling-dark/20" />
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Instructions */}
      {streaming && (
        <p className="text-center text-vueling-gray text-xs mt-3">
          Position your passport within the frame and tap to capture
        </p>
      )}
    </div>
  );
}
