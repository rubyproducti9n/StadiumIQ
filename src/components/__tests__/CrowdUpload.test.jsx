import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CrowdUpload from '../CrowdUpload';
import { CrowdProvider } from '../../context/CrowdContext';
import * as CrowdParser from '../../services/CrowdParser';

vi.mock('../../services/CrowdParser', () => ({
  parseCrowdExcel: vi.fn()
}));

// Mock FileReader to execute onload automatically
class MockFileReader {
  constructor() {
    this.onload = null;
  }
  readAsArrayBuffer(file) {
    // Simulate async file loading
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: new ArrayBuffer(0) } });
      }
    }, 0);
  }
}

describe('CrowdUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal('FileReader', MockFileReader);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders file input and confirm button when preview data exists', () => {
    render(
      <CrowdProvider>
        <CrowdUpload />
      </CrowdProvider>
    );

    expect(screen.getByText('Upload Crowd Data (.xlsx)')).toBeInTheDocument();
  });

  it('shows error on wrong file type', async () => {
    const { container } = render(
      <CrowdProvider>
        <CrowdUpload />
      </CrowdProvider>
    );

    const input = container.querySelector('input[type="file"]');
    
    // Upload invalid file type
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(screen.getByText('Please upload .xlsx file only')).toBeInTheDocument();
  });

  it('shows preview table after valid file selected', async () => {
    const mockParsedData = {
      metlife: {
        match_id: 'metlife',
        home_team: 'USA',
        away_team: 'Mexico',
        actual_attendance: 80000,
        crowd_sentiment: 'excited',
        dominant_language: 'English',
        secondary_languages: ['Spanish'],
        fanWarning: false
      }
    };

    CrowdParser.parseCrowdExcel.mockReturnValue({
      data: mockParsedData,
      errors: []
    });

    const { container } = render(
      <CrowdProvider>
        <CrowdUpload />
      </CrowdProvider>
    );

    const input = container.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // Fast forward the FileReader load timer
    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('Preview matches:')).toBeInTheDocument();
    expect(screen.getByText('USA vs Mexico')).toBeInTheDocument();
    expect(screen.getByText('Confirm Upload')).toBeInTheDocument();
  });

  it('shows success toast after confirm', async () => {
    const mockParsedData = {
      metlife: {
        match_id: 'metlife',
        home_team: 'USA',
        away_team: 'Mexico',
        actual_attendance: 80000,
        crowd_sentiment: 'excited',
        dominant_language: 'English',
        secondary_languages: ['Spanish'],
        fanWarning: false
      }
    };

    CrowdParser.parseCrowdExcel.mockReturnValue({
      data: mockParsedData,
      errors: []
    });

    const { container } = render(
      <CrowdProvider>
        <CrowdUpload />
      </CrowdProvider>
    );

    const input = container.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // Fast forward FileReader load timer
    await act(async () => {
      vi.runAllTimers();
    });

    const confirmBtn = screen.getByText('Confirm Upload');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(screen.getByText('1 matches loaded. Crowd context ready.')).toBeInTheDocument();
    expect(screen.queryByText('Preview matches:')).toBeNull();
  });
});
