import React from 'react';
import useAssistant from './hooks/useAssistant';
import Header from './components/Header';
import PersonaToggle from './components/PersonaToggle';
import ChatInterface from './components/ChatInterface';
import CrowdDashboard from './components/CrowdDashboard';
import MapView from './components/MapView';
import AccessibilityPanel from './components/AccessibilityPanel';
import CrowdUpload from './components/CrowdUpload';
import AdBanner from './components/AdBanner';

function App() {
  const {
    messages,
    isLoading,
    error,
    currentPersona,
    currentStadium,
    crowdData,
    languageDetectionFailed,
    setLanguageDetectionFailed,
    smartSummary,
    isSummaryLoading,
    sendMessage,
    clearMessages,
    switchPersona,
    switchStadium,
    refreshCrowdData
  } = useAssistant();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header
        currentStadium={currentStadium}
        currentPersona={currentPersona}
        onStadiumChange={switchStadium}
      />
      <AdBanner />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-center md:justify-start">
          <PersonaToggle
            currentPersona={currentPersona}
            onSwitch={switchPersona}
          />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column (60% width on large screens) */}
          <div className="lg:col-span-6 flex flex-col">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSendMessage={sendMessage}
              currentPersona={currentPersona}
              crowdData={crowdData}
              languageDetectionFailed={languageDetectionFailed}
              setLanguageDetectionFailed={setLanguageDetectionFailed}
            />
          </div>

          {/* Right Column (40% width on large screens) */}
          <div className="lg:col-span-4 space-y-6">
            <CrowdUpload />
            <CrowdDashboard
              crowdData={crowdData}
              stadium={currentStadium}
              smartSummary={smartSummary}
              isSummaryLoading={isSummaryLoading}
            />
            <MapView
              stadium={currentStadium}
            />
            <AccessibilityPanel
              stadium={currentStadium}
            />
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        StadiumIQ | FIFA World Cup 2026 | Powered by Gemini AI
      </footer>
    </div>
  );
}

export default App;
