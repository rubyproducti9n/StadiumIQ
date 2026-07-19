import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseCrowdExcel } from '../CrowdParser';
import * as XLSX from 'xlsx';

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn()
  }
}));

describe('CrowdParser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses valid xlsx row correctly', () => {
    const mockHeaders = [
      'match_id', 'venue_name', 'home_team', 'away_team', 'actual_attendance',
      'occupancy_pct', 'crowd_sentiment', 'dominant_language',
      'secondary_languages', 'chant_intensity', 'fan_zone_A', 'home_fans',
      'away_fans', 'neutral_fans', 'incident_flags'
    ];
    const mockRow = [
      'metlife', 'MetLife Stadium', 'USA', 'Mexico', 80000,
      0.85, 'excited', 'English',
      'Spanish, French', 8, 5000, 40000,
      35000, 5000, 'NONE'
    ];

    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });

    XLSX.utils.sheet_to_json.mockReturnValue([mockHeaders, mockRow]);

    const { data, errors } = parseCrowdExcel(new ArrayBuffer(0));

    expect(errors.length).toBe(0);
    expect(data.metlife).toBeDefined();
    expect(data.metlife.occupancy_pct).toBe(0.85);
    expect(data.metlife.chant_intensity).toBe(8);
    expect(data.metlife.secondary_languages).toEqual(['Spanish', 'French']);
    expect(data.metlife.gemini_context).toContain('Match: USA vs Mexico at MetLife Stadium');
  });

  it('normalizes occupancy_pct > 1.0 by dividing by 100', () => {
    const mockHeaders = ['match_id', 'occupancy_pct', 'actual_attendance'];
    const mockRow = ['metlife', 120.0, 80000];

    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });

    XLSX.utils.sheet_to_json.mockReturnValue([mockHeaders, mockRow]);

    const { data } = parseCrowdExcel(new ArrayBuffer(0));
    expect(data.metlife.occupancy_pct).toBe(1.2);
  });

  it('clamps chant_intensity below 1 to 1', () => {
    const mockHeaders = ['match_id', 'chant_intensity', 'actual_attendance'];
    const mockRow = ['metlife', -5, 80000];

    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });

    XLSX.utils.sheet_to_json.mockReturnValue([mockHeaders, mockRow]);

    const { data } = parseCrowdExcel(new ArrayBuffer(0));
    expect(data.metlife.chant_intensity).toBe(1);
  });

  it('clamps chant_intensity above 10 to 10', () => {
    const mockHeaders = ['match_id', 'chant_intensity', 'actual_attendance'];
    const mockRow = ['metlife', 15, 80000];

    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });

    XLSX.utils.sheet_to_json.mockReturnValue([mockHeaders, mockRow]);

    const { data } = parseCrowdExcel(new ArrayBuffer(0));
    expect(data.metlife.chant_intensity).toBe(10);
  });

  it('splits secondary_languages string into array', () => {
    const mockHeaders = ['match_id', 'secondary_languages', 'actual_attendance'];
    const mockRow = ['metlife', 'Spanish, German, Japanese', 80000];

    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });

    XLSX.utils.sheet_to_json.mockReturnValue([mockHeaders, mockRow]);

    const { data } = parseCrowdExcel(new ArrayBuffer(0));
    expect(data.metlife.secondary_languages).toEqual(['Spanish', 'German', 'Japanese']);
  });

  it('applies default values for missing/null fields', () => {
    const mockHeaders = ['match_id', 'actual_attendance'];
    const mockRow = ['metlife', 80000];

    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });

    XLSX.utils.sheet_to_json.mockReturnValue([mockHeaders, mockRow]);

    const { data } = parseCrowdExcel(new ArrayBuffer(0));
    expect(data.metlife.crowd_sentiment).toBe('neutral');
    expect(data.metlife.chant_intensity).toBe(5);
    expect(data.metlife.incident_flags).toBe('none');
    expect(data.metlife.dominant_language).toBe('English');
  });

  it('returns empty array for empty sheet', () => {
    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });
    XLSX.utils.sheet_to_json.mockReturnValue([]);

    expect(() => parseCrowdExcel(new ArrayBuffer(0))).toThrow("No match data found in file");
  });

  it('throws readable error for wrong file type', () => {
    XLSX.read.mockImplementation(() => {
      throw new Error("Corrupted file structure");
    });

    expect(() => parseCrowdExcel(new ArrayBuffer(0))).toThrow("Corrupted file structure");
  });
});
