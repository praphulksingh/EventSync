import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import api from '../api/api';
import { Card } from './ui/card';

export default function FaceRegistration() {
  const videoRef = useRef();
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const { data: userInfo } = useQuery({ 
    queryKey: ['userInfo'], 
    queryFn: async () => (await api.get('/auth/userinfo')).data.user 
  });

  // 1. Load AI Models on mount
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
        toast.error("Failed to load AI models.");
      }
    };
    loadModels();
    
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsScanning(true);
    } catch (err) {
      toast.error("Could not access the camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  // 2. Capture and Register Face
  const captureAndRegisterFace = async () => {
    if (!videoRef.current || !isScanning) return;
    
    setIsRegistering(true);
    const toastId = toast.loading('Analyzing facial features...');

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('No face detected! Please look directly at the camera.', { id: toastId });
        setIsRegistering(false);
        return;
      }

      const faceDescriptorArray = Array.from(detection.descriptor);

      // ADD THIS: Safely get the real ID from the database query we added above
      const realStudentId = userInfo?.userId; 

      if (!realStudentId) {
         toast.error('Could not verify your student ID. Try refreshing the page.', { id: toastId });
         return;
      }

      // SEND THE REAL ID TO THE BACKEND
      await api.post('/face/save', { 
         userId: realStudentId, 
         faceDescriptor: faceDescriptorArray 
      });
      
      toast.success('Face registered successfully!', { id: toastId });
      setHasRegistered(true);
      stopCamera();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register face.', { id: toastId });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-3xl p-8 max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Biometric Enrollment</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Register your face to enable seamless, AI-powered attendance tracking at events.
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-black w-full max-w-[400px] aspect-square flex items-center justify-center border-4 border-gray-200 dark:border-gray-800 shadow-inner mb-6">
        {!isScanning && !hasRegistered && (
          <p className="text-gray-500 font-medium absolute z-10 text-center px-4">
            {isModelsLoaded ? "Camera is off" : "Loading AI Models..."}
          </p>
        )}
        {hasRegistered && !isScanning && (
          <div className="absolute z-10 text-emerald-500 flex flex-col items-center">
            <div className="text-6xl mb-2">✅</div>
            <p className="font-bold text-lg text-white">Face Registered</p>
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Scanning Overlay UI */}
        {isScanning && (
          <div className="absolute inset-0 border-2 border-blue-500/50 border-dashed rounded-2xl m-8 animate-pulse pointer-events-none" />
        )}
      </div>

      <div className="flex gap-4 w-full justify-center">
        {!isScanning ? (
          <button 
            onClick={startCamera} 
            disabled={!isModelsLoaded} 
            className="px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white font-bold rounded-xl shadow-lg hover:bg-gray-900 transition-all disabled:opacity-50"
          >
            {hasRegistered ? 'Retake Photo' : 'Turn On Camera'}
          </button>
        ) : (
          <>
            <button 
              onClick={stopCamera} 
              className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={captureAndRegisterFace} 
              disabled={isRegistering}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
            >
              {isRegistering ? 'Processing...' : '📸 Capture & Save'}
            </button>
          </>
        )}
      </div>
    </Card>
  );
}