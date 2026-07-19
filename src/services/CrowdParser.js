import * as XLSX from 'xlsx';

export function parseCrowdExcel(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  
  // Convert to array of arrays
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!rows || rows.length <= 1) {
    throw new Error("No match data found in file");
  }

  const headers = rows[0].map(h => (h || '').toString().trim());
  const dataRows = rows.slice(1);

  const parsedData = {};
  const errors = [];

  dataRows.forEach((row, index) => {
    // Skip completely empty rows
    if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
      return;
    }

    // Create a key-value object using headers
    const rowObj = {};
    headers.forEach((header, colIdx) => {
      rowObj[header] = row[colIdx];
    });

    const match_id = rowObj['match_id'] ? rowObj['match_id'].toString().trim() : '';
    if (!match_id) {
      errors.push({ rowNumber: index + 2, reason: "Missing match_id" });
      return;
    }

    // occupancy_pct: normalize to 0-1 float (if value > 1.0, divide by 100)
    let occupancy_pct = parseFloat(rowObj['occupancy_pct']);
    if (isNaN(occupancy_pct)) {
      occupancy_pct = 0.0;
    } else if (occupancy_pct > 1.0) {
      occupancy_pct = occupancy_pct / 100;
    }

    // secondary_languages: split by ", " -> string array
    const secondaryRaw = rowObj['secondary_languages'] || '';
    const secondary_languages = secondaryRaw 
      ? secondaryRaw.toString().split(',').map(s => s.trim()).filter(Boolean) 
      : [];

    // chant_intensity: parse as int, clamp 1-10
    let chant_intensity = parseInt(rowObj['chant_intensity'], 10);
    if (isNaN(chant_intensity)) {
      chant_intensity = 5;
    } else {
      chant_intensity = Math.max(1, Math.min(10, chant_intensity));
    }

    // incident_flags: lowercase trim, default "none" if empty/null
    let incident_flags = rowObj['incident_flags'] ? rowObj['incident_flags'].toString().trim().toLowerCase() : 'none';
    if (!incident_flags) incident_flags = 'none';

    // Missing/null field defaults
    const actual_attendance = parseInt(rowObj['actual_attendance'], 10) || 0;
    const home_fans = parseInt(rowObj['home_fans'], 10) || 0;
    const away_fans = parseInt(rowObj['away_fans'], 10) || 0;
    const neutral_fans = parseInt(rowObj['neutral_fans'], 10) || 0;

    const fanTotals = home_fans + away_fans + neutral_fans;
    const fanWarning = fanTotals > actual_attendance;

    const item = {
      match_id,
      venue_name: rowObj['venue_name'] || '',
      home_team: rowObj['home_team'] || '',
      away_team: rowObj['away_team'] || '',
      actual_attendance,
      occupancy_pct,
      crowd_sentiment: rowObj['crowd_sentiment'] || 'neutral',
      dominant_language: rowObj['dominant_language'] || 'English',
      secondary_languages,
      chant_intensity,
      fan_zone_A: parseInt(rowObj['fan_zone_A'], 10) || 0,
      fan_zone_B: parseInt(rowObj['fan_zone_B'], 10) || 0,
      fan_zone_C: parseInt(rowObj['fan_zone_C'], 10) || 0,
      fan_zone_D: parseInt(rowObj['fan_zone_D'], 10) || 0,
      home_fans,
      away_fans,
      neutral_fans,
      incident_flags,
      data_source: rowObj['data_source'] || 'excel',
      timestamp_utc: rowObj['timestamp_utc'] || new Date().toISOString(),
      wave_count: parseInt(rowObj['wave_count'], 10) || 0,
      vip_section_fill_pct: parseFloat(rowObj['vip_section_fill_pct']) || 0,
      media_personnel: parseInt(rowObj['media_personnel'], 10) || 0,
      fanWarning
    };

    // Create Gemini Context display string
    const occupancy_pct_display = Math.round(occupancy_pct * 100);
    const secondary_display = secondary_languages.length > 0 ? secondary_languages.join(', ') : 'none';
    
    item.gemini_context = `Match: ${item.home_team} vs ${item.away_team} at ${item.venue_name}.
Attendance: ${item.actual_attendance} (${occupancy_pct_display}% full).
Crowd mood: ${item.crowd_sentiment}. Chant intensity: ${item.chant_intensity}/10.
Fan split - Home: ${item.home_fans}, Away: ${item.away_fans}, Neutral: ${item.neutral_fans}.
Primary language: ${item.dominant_language}. Also spoken: ${secondary_display}.
Incidents: ${item.incident_flags}.`;

    parsedData[match_id] = item;
  });

  return { data: parsedData, errors };
}
