import React, { useState, useEffect } from 'react';
import { uploadCrowdData, startApiPolling, stopApiPolling } from '../services/CrowdService';

export default function CrowdToggle({ matchId, onDataUpdated }) {
  const [mode, setMode] = useState('upload'); // 'upload' or 'api'
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (mode === 'api') {
      setIsPolling(true);
      startApiPolling(matchId, (newData) => {
        if (onDataUpdated) {
          onDataUpdated(newData);
        }
      });
    } else {
      setIsPolling(false);
      stopApiPolling();
    }

    return () => {
      stopApiPolling();
    };
  }, [mode, matchId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    const fileType = file.name.endsWith('.json') ? 'json' : file.name.endsWith('.csv') ? 'csv' : null;
    if (!fileType) {
      setUploadError('Unsupported file type. Please upload a .json or .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target.result;
        const uploadedData = await uploadCrowdData(matchId, content, fileType);
        setUploadSuccess(true);
        if (onDataUpdated) {
          onDataUpdated(uploadedData);
        }
      } catch (err) {
        setUploadError(err.message || 'Failed to parse or upload crowd data.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-800 text-sm">Crowd Data Source</span>
        <div className="relative inline-flex items-center cursor-pointer select-none">
          <div className="flex bg-gray-100 p-0.5 rounded-full border border-gray-200">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                mode === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Upload Mode
            </button>
            <button
              type="button"
              onClick={() => setMode('api')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                mode === 'api'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Live API
            </button>
          </div>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Upload a CSV or JSON file containing crowd statistics (attendance, fan zones, chants) to manually inject live crowd data.
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-gray-500
                file:mr-3 file:py-1.5 file:px-3
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>
          {uploadError && (
            <p className="text-xs text-red-600 font-medium">{uploadError}</p>
          )}
          {uploadSuccess && (
            <p className="text-xs text-green-600 font-medium">✓ Crowd data uploaded & merged successfully!</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 leading-relaxed">
            Polling the crowd data API every 60 seconds. New statistics will automatically merge into Firestore.
          </p>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] text-green-700 font-semibold uppercase tracking-wider">
              {isPolling ? 'Active Polling' : 'Connecting...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
