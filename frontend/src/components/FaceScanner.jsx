import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import api from '../api/api';

export default function FaceScanner({ eventId, onMatch }) {
  const videoRef = useRef(null);
  
  // CRITICAL FIX: Use refs to prevent React stale closures inside the setInterval loop
  const intervalRef = useRef(null);
  const faceMatcherRef = useRef(null);
  const onMatchRef = useRef(onMatch);

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Keep the callback function fresh on every render
  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  // Cleanup the interval when the component unmounts
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // 1. Load AI Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; 
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelsLoaded(true);
      } catch (err) {
        toast.error("Failed to load AI models. Ensure they are in the public/models folder.");
      }
    };
    loadModels();
  }, []);

  // 2. Start Camera & Fetch Student Face Data
  const startScanner = async () => {
    try {
      const res = await api.get(`/events/faculty/faces/${eventId}`);
      const validFaces = res.data.data; 

      if (!validFaces || validFaces.length === 0) {
        return toast.error("No students with registered faces found for this event. Have students registered their faces in their portal?");
      }

      const descriptors = validFaces.map(reg => {
        const floatArray = new Float32Array(reg.student.faceDescriptor);
        // Store the Database ID as the label
        return new faceapi.LabeledFaceDescriptors(reg.student._id.toString(), [floatArray]);
      });

      // Save the matcher to the Ref so the interval can see it
      faceMatcherRef.current = new faceapi.FaceMatcher(descriptors, 0.6); // 0.6 is the distance threshold

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
      toast.success("AI Scanner Activated! Look at the camera.");
    } catch (err) {
      toast.error("Could not start camera or fetch face data.");
    }
  };

  const stopScanner = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  // 3. The Scanning Loop
  const handleVideoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      // If camera is off or matcher isn't ready, do nothing
      if (!videoRef.current || !isScanning || !faceMatcherRef.current) return;

      try {
        const detection = await faceapi.detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          // Compare the live face against the Database Math Array
          const match = faceMatcherRef.current.findBestMatch(detection.descriptor);
          
          if (match.label !== 'unknown') {
            const studentId = match.label;
            // Use the Ref to fire the event, bypassing React closure traps
            onMatchRef.current(studentId); 
          }
        }
      } catch (error) {
        console.error("Scanning Error:", error);
      }
    }, 2000); // Scans every 2 seconds
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 dark:bg-gray-950 p-6 rounded-3xl shadow-2xl border border-gray-800">
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="text-white text-xl font-bold flex items-center gap-2">
          🤖 AI Attendance Scanner
        </h3>
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isModelsLoaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {isModelsLoaded ? 'AI Ready' : 'Loading AI...'}
        </span>
      </div>
      
      <div className="relative rounded-2xl overflow-hidden bg-black w-full max-w-[640px] aspect-video flex items-center justify-center border-4 border-gray-800 transition-colors duration-300 data-[scanning=true]:border-emerald-500" data-scanning={isScanning}>
        {!isScanning && (
          <p className="text-gray-500 font-medium absolute z-10">Camera is off</p>
        )}
        <video 
          ref={videoRef} 
          onPlay={handleVideoPlay} 
          autoPlay 
          muted 
          playsInline
          className={`w-full h-full object-cover ${isScanning ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div className="mt-6 w-full flex justify-center">
        {!isScanning ? (
          <button onClick={startScanner} disabled={!isModelsLoaded} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Start Live Scan
          </button>
        ) : (
          <button onClick={stopScanner} className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/30 transition-all">
            Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}