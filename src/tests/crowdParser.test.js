import { parseCrowdExcel } from '../services/CrowdParser';
import * as XLSX from 'xlsx';

jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

describe('CrowdParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('correctly parses Excel data row structures and creates gemini_context', () => {
    const mockHeaders = [
      'match_id', 'venue_name', 'home_team', 'away_team', 'actual_attendance',
      'occupancy_pct', 'crowd_sentiment', 'dominant_language',
      'secondary_languages', 'chant_intensity', 'fan_zone_A', 'home_fans',
      'away_fans', 'neutral_fans', 'incident_flags'
    ];
    const mockRow = [
      'metlife', 'MetLife Stadium', 'USA', 'Mexico', 80000,
      120.0, 'excited', 'English',
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
    
    const metlife = data.metlife;
    expect(metlife.occupancy_pct).toBe(1.2); // Normalization check: 120.0 / 100
    expect(metlife.chant_intensity).toBe(8);
    expect(metlife.incident_flags).toBe('none');
    expect(metlife.secondary_languages).toEqual(['Spanish', 'French']);
    expect(metlife.gemini_context).toContain('Match: USA vs Mexico at MetLife Stadium');
  });

  it('throws error if sheet is empty or contains no match rows', () => {
    XLSX.read.mockReturnValue({
      SheetNames: ['Crowd Data'],
      Sheets: { 'Crowd Data': {} }
    });
    XLSX.utils.sheet_to_json.mockReturnValue([['match_id']]); // Header only

    expect(() => parseCrowdExcel(new ArrayBuffer(0))).toThrow("No match data found in file");
  });
});
