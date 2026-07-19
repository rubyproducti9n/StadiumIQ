import React, { useState } from 'react';
import { useCrowd } from '../context/CrowdContext';
import { parseCrowdExcel } from '../services/CrowdParser';

export default function CrowdUpload() {
  const { updateCrowdData, storageError } = useCrowd();
  const [previewRows, setPreviewRows] = useState([]);
  const [pendingData, setPendingData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [fileErrorRows, setFileErrorRows] = useState([]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewRows([]);
    setPendingData(null);
    setFileErrorRows([]);

    if (!file) return;

    // Check wrong file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      setErrorMsg("Please upload .xlsx file only");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const { data: parsedData, errors } = parseCrowdExcel(data);

        const rows = Object.values(parsedData);
        if (rows.length === 0) {
          setErrorMsg("No match data found in file");
          return;
        }

        setPreviewRows(rows);
        setPendingData(parsedData);
        if (errors.length > 0) {
          setFileErrorRows(errors);
        }
      } catch (err) {
        setErrorMsg(err.message || "Failed to parse the uploaded file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    if (!pendingData) return;

    try {
      updateCrowdData(pendingData);
      const count = Object.keys(pendingData).length;
      setSuccessMsg(`${count} matches loaded. Crowd context ready.`);
      setPendingData(null);
      setPreviewRows([]);
    } catch (err) {
      setErrorMsg("Failed to store crowd data");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
        <span>Upload Crowd Data (.xlsx)</span>
      </h3>

      {/* File Upload Input */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
          Excel Match Sheet
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-200 rounded-md p-1 bg-gray-50"
        />
      </div>

      {/* Storage quota warning */}
      {storageError && (
        <div className="p-2.5 bg-red-50 text-red-700 border border-red-100 rounded text-xs flex items-start gap-1.5">
          <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{storageError}</span>
        </div>
      )}

      {/* Custom general error messages */}
      {errorMsg && (
        <div className="p-2.5 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-medium flex items-start gap-1.5">
          <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Messages */}
      {successMsg && (
        <div className="p-2.5 bg-green-50 text-green-700 border border-green-100 rounded text-xs font-medium flex items-start gap-1.5">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Specific row parsing errors */}
      {fileErrorRows.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-red-600">Failed rows details:</p>
          <div className="max-h-24 overflow-y-auto border border-red-100 bg-red-50 p-2 rounded space-y-1">
            {fileErrorRows.map((err, idx) => (
              <p key={idx} className="text-[10px] text-red-700 font-mono">
                Row {err.rowNumber}: {err.reason}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      {previewRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Preview matches:</span>
            <button
              onClick={handleConfirm}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold shadow hover:bg-blue-700 transition"
            >
              Confirm Upload
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-md max-h-48">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-1.5">Match ID</th>
                  <th className="px-3 py-1.5">Fixture</th>
                  <th className="px-3 py-1.5">Attendance</th>
                  <th className="px-3 py-1.5">Sentiment</th>
                  <th className="px-3 py-1.5">Lang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-gray-600 font-medium">
                {previewRows.map((row) => (
                  <tr key={row.match_id} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-mono text-[10px]">{row.match_id}</td>
                    <td className="px-3 py-1.5 text-gray-800">
                      {row.home_team} vs {row.away_team}
                    </td>
                    <td className="px-3 py-1.5 font-mono flex items-center gap-1">
                      <span>{row.actual_attendance.toLocaleString()}</span>
                      {row.fanWarning && (
                        <span className="inline-flex items-center px-1 rounded-full text-[9px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200" title="Fan split totals exceeds actual attendance">
                          warning
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 capitalize text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700`}>
                        {row.crowd_sentiment}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 uppercase font-mono text-[10px]">
                      {row.dominant_language}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
