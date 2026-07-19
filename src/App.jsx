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
    switchPersona,
    switchStadium
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
        {/* About StadiumIQ Section */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-800">About StadiumIQ</h2>
            <p className="text-sm text-gray-600">
              FIFA World Cup 2026 spans 3 countries, 16 cities, and 48 teams, leaving fans without a unified multilingual navigation companion.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Translation Card */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c-.006 1.833-.37 3.533-1.039 4.96M6.412 9A18.01 18.01 0 003 9m3.412 0c.987-1.127 1.802-2.383 2.413-3.738" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Multilingual Translation</h4>
                <p className="text-xs text-gray-600">Translates queries and responses dynamically across 40+ native languages.</p>
              </div>
            </div>
            {/* Crowd AI Card */}
            <div className="p-4 bg-green-50 border border-green-100 rounded-md flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Crowd Intelligence</h4>
                <p className="text-xs text-gray-600">Analyzes and visualizes section densities, gate lines, and transport congestion.</p>
              </div>
            </div>
            {/* Fan Q&A Card */}
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-md flex items-start gap-3">
              <svg className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">Smart Fan Q&A</h4>
                <p className="text-xs text-gray-600">Gemini-powered chatbot answering venue, match, safety, and accessibility questions.</p>
              </div>
            </div>
          </div>
        </section>

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
