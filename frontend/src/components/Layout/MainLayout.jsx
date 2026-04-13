// src/components/Layout/MainLayout.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import SafetyGuardOverlay from '../Modals/SafetyGuardOverlay';
import ChatBot from '../Common/ChatBot';

export default function MainLayout({ children, title }) {
  const [isSafetyOverlayOpen, setIsSafetyOverlayOpen] = useState(false);

  // Global trigger for safety warning
  const triggerSafetyWarning = () => setIsSafetyOverlayOpen(true);

  // Attach trigger to window for easy access from other components without complex state management for this demo
  window.triggerSafetyGuard = triggerSafetyWarning;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={title} />
        <div className="page-container">
          {children}
        </div>
      </div>
      
      <SafetyGuardOverlay 
        isOpen={isSafetyOverlayOpen} 
        onClose={() => setIsSafetyOverlayOpen(false)} 
      />
      <ChatBot />
    </div>
  );
}
