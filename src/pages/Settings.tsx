import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUser } from '../context/UserContext';
import { User, Settings as SettingsIcon, Bell, Shield, Headphones, Mic, Monitor } from 'lucide-react';

export default function Settings() {
  const { user, deleteAccount } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate('/auth');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. You may need to log out and log back in before deleting.');
      setIsDeleting(false);
    }
  };

  const stopMicTest = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    setVolume(0);
    setIsTestingMic(false);
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedInput ? { deviceId: { exact: selectedInput } } : true
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        if (selectedOutput && 'setSinkId' in audioRef.current) {
          try {
            await (audioRef.current as any).setSinkId(selectedOutput);
          } catch (e) {
            console.error("Error setting output device", e);
          }
        }
        audioRef.current.play();
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVolume(Math.min(100, (avg / 255) * 100 * 1.5));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
      setIsTestingMic(true);
    } catch (err) {
      console.error("Error starting mic test", err);
    }
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(device => device.kind === 'audioinput');
        const outputs = devices.filter(device => device.kind === 'audiooutput');
        
        setInputDevices(inputs);
        setOutputDevices(outputs);
        
        if (inputs.length > 0 && !selectedInput) setSelectedInput(inputs[0].deviceId);
        if (outputs.length > 0 && !selectedOutput) setSelectedOutput(outputs[0].deviceId);
      } catch (err) {
        console.error("Error fetching devices", err);
      }
    };
    
    if (activeTab === 'devices') {
      getDevices();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'account', label: 'Account Details', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'devices', label: 'Audio Devices', icon: Headphones },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Settings</h1>
        <p className="text-zinc-400 text-lg">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  isActive 
                    ? 'bg-zinc-900 text-white border border-zinc-800' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card p-8 min-h-[400px]">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-white uppercase">
                  {user?.name?.[0] || user?.email?.[0] || '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                  <p className="text-zinc-400">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                  <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white">
                    {user?.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Email Address</label>
                  <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Experience Level</label>
                  <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white capitalize">
                    {user?.experienceLevel || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Primary Focus</label>
                  <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white capitalize">
                    {user?.goals?.join(', ') || 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
                <p className="text-zinc-400">Choose what updates you want to receive.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div>
                    <h3 className="text-white font-medium mb-1">Practice Reminders</h3>
                    <p className="text-sm text-zinc-400">Get daily reminders to keep your streak going.</p>
                  </div>
                  <button 
                    onClick={() => setPracticeReminders(!practiceReminders)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black ${
                      practiceReminders ? 'bg-indigo-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span 
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        practiceReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div>
                    <h3 className="text-white font-medium mb-1">Weekly Progress Report</h3>
                    <p className="text-sm text-zinc-400">Receive a weekly summary of your speaking improvements.</p>
                  </div>
                  <button 
                    onClick={() => setWeeklyReports(!weeklyReports)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black ${
                      weeklyReports ? 'bg-indigo-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span 
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        weeklyReports ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Audio Devices</h2>
                <p className="text-zinc-400">Manage your microphone and speaker settings.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Input Device (Microphone)</label>
                  <select 
                    value={selectedInput}
                    onChange={(e) => setSelectedInput(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    {inputDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                    {inputDevices.length === 0 && <option value="">No microphones found</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Output Device (Speaker)</label>
                  <select 
                    value={selectedOutput}
                    onChange={(e) => setSelectedOutput(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    {outputDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                    {outputDevices.length === 0 && <option value="">No speakers found</option>}
                  </select>
                </div>

                <div className="mt-8 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isTestingMic ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">Microphone Test</h3>
                        <p className="text-sm text-zinc-400">Speak to test your microphone and hear playback.</p>
                      </div>
                    </div>
                    <button
                      onClick={isTestingMic ? stopMicTest : startMicTest}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isTestingMic 
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                      }`}
                    >
                      {isTestingMic ? 'Stop Test' : 'Start Test'}
                    </button>
                  </div>
                  
                  {/* Volume Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-500 font-medium">
                      <span>Input Volume</span>
                      <span>{Math.round(volume)}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-75 ease-out"
                        style={{ width: `${volume}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Hidden audio element for playback */}
                  <audio ref={audioRef} muted={false} className="hidden" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Privacy & Security</h2>
                <p className="text-zinc-400">Manage your data and account security.</p>
              </div>

              <div className="space-y-6">
                {/* Delete History */}
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-medium mb-1">Delete Practice History</h3>
                      <p className="text-sm text-zinc-400">Permanently remove all your past practice sessions and recordings.</p>
                    </div>
                    {!showDeleteHistoryConfirm ? (
                      <button 
                        onClick={() => setShowDeleteHistoryConfirm(true)}
                        className="px-4 py-2 rounded-lg font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap"
                      >
                        Delete History
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setShowDeleteHistoryConfirm(false)}
                          className="px-4 py-2 rounded-lg font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            // Mock deletion logic here
                            setShowDeleteHistoryConfirm(false);
                          }}
                          className="px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                          Yes, Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Account */}
                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-red-400 font-medium mb-1">Delete Account</h3>
                      <p className="text-sm text-red-400/70">Permanently delete your account and all associated data. This action cannot be undone.</p>
                      {deleteError && (
                        <p className="text-sm font-medium text-red-500 mt-2">{deleteError}</p>
                      )}
                    </div>
                    {!showDeleteAccountConfirm ? (
                      <button 
                        onClick={() => setShowDeleteAccountConfirm(true)}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setShowDeleteAccountConfirm(false)}
                          disabled={isDeleting}
                          className="px-4 py-2 rounded-lg font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'account' && activeTab !== 'notifications' && activeTab !== 'devices' && activeTab !== 'privacy' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <SettingsIcon className="w-12 h-12 text-zinc-600" />
              <h3 className="text-xl font-medium text-zinc-300">Coming Soon</h3>
              <p className="text-zinc-500 max-w-sm">
                This section is currently under development. Check back later for updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
