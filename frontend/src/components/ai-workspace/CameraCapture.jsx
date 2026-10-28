import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (!active) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera access was blocked or no camera is available."));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `camera-flower-${Date.now()}.jpg`, { type: "image/jpeg" }));
      onClose();
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Camera capture">
      <div className="camera-modal">
        <div className="modal-heading"><div><small>Live camera</small><h3>Place one flower inside the frame</h3></div><button onClick={onClose}><X /></button></div>
        <div className="camera-frame">
          {error ? <div className="camera-error"><RotateCcw /><p>{error}</p></div> : <video ref={videoRef} autoPlay playsInline muted />}
          <div className="focus-corners" />
        </div>
        <button className="button primary full" onClick={capture} disabled={Boolean(error)}><Camera /> Capture photo</button>
      </div>
    </div>
  );
}
