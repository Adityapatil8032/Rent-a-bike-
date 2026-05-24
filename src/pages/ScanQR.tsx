import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function ScanQR() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    // Simulate scanning process
    const timer = setTimeout(() => {
      setScanning(false);
      setTimeout(() => {
        navigate('/ride', { state: location.state });
      }, 1500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, location.state]);

  return (
    <div className="h-full bg-gray-900 flex flex-col relative text-white">
      <div className="p-6 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Scan to Unlock</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="relative w-64 h-64 mb-8">
          {/* Scanner Frame */}
          <div className="absolute inset-0 border-2 border-emerald-500 rounded-3xl opacity-50"></div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl"></div>

          {/* Scanning Animation */}
          {scanning ? (
            <motion.div 
              animate={{ y: [0, 256, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
            />
          ) : (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-3xl"
            >
              <div className="bg-emerald-500 p-4 rounded-full">
                <Zap size={48} className="text-white" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {scanning ? "Align QR Code" : "Bike Unlocked!"}
          </h2>
          <p className="text-gray-400">
            {scanning 
              ? "Find the QR code on the handlebars or lock." 
              : "Starting your ride..."}
          </p>
        </div>
      </div>

      <div className="p-6 bg-gray-800 rounded-t-3xl mt-auto">
        <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-xl">
          <div className="bg-gray-600 p-3 rounded-lg">
            <QrCode size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold">Can't scan?</p>
            <p className="text-xs text-gray-400">Enter bike ID manually</p>
          </div>
        </div>
      </div>
    </div>
  );
}
