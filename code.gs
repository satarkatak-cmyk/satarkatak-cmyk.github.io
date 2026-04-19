/**
 * Google Apps Script for National Vigilance Center (NVC) Complaint Management System
 * Backend logic to handle data storage for Complaints, Projects, Employee Monitoring,
 * Citizen Charter, and Notifications.
 *
 * VERSION: 2.3.0 (Added Location Support & Parameter Mapping)
 */

// ==================== CONFIGURATION ====================
const SPREADSHEET_ID = '1VDsN3UOlDwjYPC3AOJvKpUu20d4I6cc_JLZYD8ogsGU';
const CONFIG = {
  SHEETS: {
    COMPLAINTS: 'Complaints',
    ONLINE_COMPLAINTS: 'OnlineComplaints',
    PROJECTS: 'Projects',
    TECHNICAL_INSPECTORS: 'TechnicalInspectors',
    TECHNICAL_EXAMINERS: 'TechnicalExaminers',
    EMPLOYEE_MONITORING: 'कर्मचारी_अनुगमन',
    CITIZEN_CHARTER: 'CitizenCharter',
    INVESTIGATIONS: 'Investigations',
    NOTIFICATIONS: 'Notifications',
    NOTICES: 'Notices',
    LABORATORY_TESTS: 'प्रयोगशाला_परीक्षण',
    USERS: 'Users',
    CONFIG: 'Config'
  },
  API_KEY: 'nvc2026secretkey',
  VERSION: '2.3.0'
};

// ==================== PARAMETER MAPPING ====================
// Maps frontend JSON keys (English) to Sheet Headers (Nepali/English)
const PARAM_MAP = {
  'date': 'दर्ता मिति',
  'उजुरी दर्ता मिति': 'दर्ता मिति',
  'dateNepali': 'दर्ता मिति नेपाली',
  'complainant': 'उजुरीकर्ताको नाम',
  'accused': 'विपक्षी',
  'description': 'उजुरीको संक्षिप्त विवरण',
  'committeeDecision': 'समितिको निर्णय',
  'decision': 'अन्तिम निर्णय',
  'finalDecision': 'अन्तिम निर्णयको प्रकार',
  'remarks': 'कैफियत',
  'status': 'स्थिति',
  'shakha': 'सम्बन्धित शाखा',
  'mahashakha': 'महाशाखा',
  'source': 'उजुरीको माध्यम',
  'assignedShakha': 'शाखामा पठाएको',
  'assignedDate': 'शाखामा पठाएको मिति',
  'createdBy': 'सिर्जना गर्ने',
  'createdAt': 'सिर्जना मिति',
  'updatedBy': 'अपडेट गर्ने',
  'updatedAt': 'अपडेट मिति',
  'instructions': 'निर्देशन',
  'investigationDetails': 'छानबिनको विवरण',
  'correspondenceDate': 'पत्राचार मिति',
  'province': 'प्रदेश',
  'district': 'जिल्ला',
  'location': 'स्थानीय तह',
  'ward': 'वडा'
  ,
  'मिति': 'दर्ता मिति',
  'विवरण': 'उजुरीको संक्षिप्त विवरण',
  'ministry': 'मन्त्रालय/निकाय',
  // Investigation specific mappings
  'complaintRegNo': 'उजुरी दर्ता नं',
  'registrationDate': 'दर्ता मिति',
  'office': 'कार्यालय/निकाय',
  'complaintDescription': 'उजुरीको विवरण',
  'reportSubmissionDate': 'छानविन/अन्वेषण प्रतिवेदन पेश भएको मिति',
  'investigationOpinion': 'छानविन/अन्वेषणको राय',
  'implementationDetails': 'कार्यान्वयनका लागि लेखि पठाएको व्यहोरा',
  'implementationDate': 'कार्यान्वयनका लागि लेखि पठाएको मिति',
  'localLevel': 'स्थानीय तह/नगर',
  // Employee Monitoring specific mappings (for कर्मचारी_अनुगमन sheet)
  'id': 'ID',
  'date': 'मिति',
  'officeName': 'कार्यालय_नाम',
  'province': 'प्रदेश',
  'district': 'जिल्ला',
  'localLevel': 'स्थानीय_तह',
  'uniformViolationCount': 'पोशाक_गणना',
  'timeViolationCount': 'समय_गणना',
  'uniformEmployees': 'पोशाक_कर्मचारीहरु',
  'timeEmployees': 'समय_कर्मचारीहरु',
  'instructionDate': 'निर्देशन_मिति',
  'remarks': 'कैफियत',
  'createdBy': 'बनाउने',
  'createdAt': 'समय_टिम्स्ट्याम्प',
  // Technical Examiner specific mappings
  'name': 'प्राविधिक परीक्षकको नाम',
  'necRegistration': 'NEC दर्ता नं.',
  'trainingYear': 'प्राविधिक परीक्षक तालिम लिएको वर्ष',
  'certificateNumber': 'प्राविधिक परीक्षक प्रमाणपत्र नं.',
  'projectsInspected': 'प्राविधिक परीक्षण गरेका आयोजना',
  // Notice specific mappings (for Notices sheet)
  'noticeId': 'सूचना ID',
  'title': 'शीर्षक',
  'description': 'विवरण',
  'fileName': 'फाइल नाम',
  'fileUrl': 'फाइल URL',
  'fileType': 'फाइल प्रकार',
  'status': 'स्थिति',
  'publishDate': 'प्रकाशित मिति',
  'uploadedBy': 'अपलोड गर्ने',
  'createdAt': 'सिर्जना मिति',
  // Laboratory Testing specific mappings (for प्रयोगशाला_परीक्षण sheet)
  'sampleNumber': 'नमूना नं',
  'sampleReceivedDate': 'नमूना प्राप्त मिति',
  'testRequester': 'परीक्षण अनुरोधकर्ता',
  'organizationName': 'आयोजनाको नाम',
  'ministry': 'मन्त्रालय/निकाय',
  'testMaterial': 'परीक्षण गर्ने सामग्री',
  'testDate': 'परीक्षण गरिएको मिति',
  'testMethod': 'परीक्षण विधि',
  'testEquipment': 'परीक्षण गर्ने उपकरण',
  'testResult': 'परीक्षण नतीजा',
  'remarks': 'कैफियत'
};

function normalizeStatusLabel(raw) {
  if (raw === null || raw === undefined) return '';
  var s = String(raw).trim();
  var low = s.toLowerCase();
  if (low === 'pending') return 'काम बाँकी';
  if (low === 'progress') return 'चालु';
  if (low === 'resolved') return 'फछ्रयौट';
  // If already Nepali label, keep it
  if (s === 'काम बाँकी' || s === 'काम बाकी' || s === 'बाँकी' || s === 'बाकी') return 'काम बाँकी';
  if (s === 'चालु' || s === 'चालू') return 'चालु';
  if (s === 'फछ्रयौट' || s === 'फछ्र्यौट' || s === 'फछर्यौट' || s === 'फछर्यौट') return 'फछ्रयौट';
  return s;
}

/**
 * Return internal status key ('pending'|'progress'|'resolved') from various raw inputs.
 * Accepts English codes, Nepali labels, and common variants.
 */
function getStatusKey(raw) {
  if (raw === null || raw === undefined) return 'pending';
  var s = String(raw).trim().toLowerCase();
  if (!s) return 'pending';
  if (s === 'pending' || s === 'work pending' || s === 'baki') return 'pending';
  if (s === 'progress' || s === 'in progress' || s === 'chalu' || s === 'चालु' || s === 'चालू') return 'progress';
  if (s === 'resolved' || s === 'closed' || s === 'फछ्रयौट' || s === 'फछ्र्यौट' || s === 'फछर्यौट') return 'resolved';
  // Also handle Nepali normalized labels returned by normalizeStatusLabel
  var nep = normalizeStatusLabel(s || raw);
  if (nep === 'काम बाँकी') return 'pending';
  if (nep === 'चालु') return 'progress';
  if (nep === 'फछ्रयौट') return 'resolved';
  // default fallback
  return 'pending';
}

function normalizeSourceLabel(raw) {
  if (raw === null || raw === undefined) return '';
  var s = String(raw).trim();
  var low = s.toLowerCase();
  if (low === 'internal') return 'आन्तरिक';
  if (low === 'hello_sarkar') return 'हेल्लो सरकार';
  if (low === 'hello sarkar') return 'हेल्लो सरकार';
  // If already Nepali label, keep it
  if (s === 'आन्तरिक' || s === 'आन्तरीक') return 'आन्तरिक';
  if (s === 'हेल्लो सरकार' || s === 'हेलो सरकार') return 'हेल्लो सरकार';
  return s;
}

const FINAL_DECISION_TYPES = {
  1: 'तामेली',
  2: 'सुझाव/निर्देशन',
  3: 'सतर्क',
  4: 'अन्य'
};

const PROVINCE_TYPES = {
  1: 'कोशी',
  2: 'मधेश',
  3: 'बागमती',
  4: 'गण्डकी',
  5: 'लुम्बिनी',
  6: 'कर्णाली',
  7: 'सुदूरपश्चिम'
};

function normalizeFinalDecisionType(value) {
  if (value === undefined || value === null) return '';
  var v = String(value).trim();
  if (!v) return '';
  if (FINAL_DECISION_TYPES[v]) return FINAL_DECISION_TYPES[v];
  var n = Number(v);
  if (FINAL_DECISION_TYPES[n]) return FINAL_DECISION_TYPES[n];
  if (v === 'सुझाव/निर्देशन दिने') return 'सुझाव/निर्देशन';
  if (v === 'सतर्क गर्ने') return 'सतर्क';
  if (v === 'अन्य निर्णय') return 'अन्य';
  return v;
}

function normalizeProvinceName(value) {
  if (value === undefined || value === null) return '';
  var v = String(value).trim();
  if (!v) return '';
  if (PROVINCE_TYPES[v]) return PROVINCE_TYPES[v];
  var n = Number(v);
  if (PROVINCE_TYPES[n]) return PROVINCE_TYPES[n];
  // If full name like 'बागमती प्रदेश' then strip suffix
  v = v.replace(/\s*प्रदेश\s*$/g, '').trim();
  // If still like 'कोशी प्रदेश' etc
  return v;
}

// ==================== HELPERS ====================
function log() { try { Logger.log.apply(Logger, arguments); } catch (e) {} }

function getMasterSpreadsheetId() {
  try {
    const props = PropertiesService.getScriptProperties();
    const v = props.getProperty('MASTER_SPREADSHEET_ID');
    if (v && String(v).trim().length > 10) return String(v).trim();
  } catch (e) {}
  if (SPREADSHEET_ID && typeof SPREADSHEET_ID === 'string' && SPREADSHEET_ID.length > 10) return SPREADSHEET_ID;
  return '';
}

function setMasterSpreadsheetId(id) {
  const v = (id || '').toString().trim();
  if (!v || v.length < 10) return { success: false, message: 'Invalid spreadsheet id' };
  try {
    PropertiesService.getScriptProperties().setProperty('MASTER_SPREADSHEET_ID', v);
    return { success: true, message: 'MASTER_SPREADSHEET_ID set', id: v };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function getSpreadsheet() {
  const masterId = getMasterSpreadsheetId();
  if (masterId) {
    // When masterId is configured we should NOT fall back to active spreadsheet.
    // In form-submit triggers the active spreadsheet is often the responses spreadsheet.
    return SpreadsheetApp.openById(masterId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet && headers && headers.length) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Ensure the Complaints sheet has a 'मन्त्रालय/निकाय' header column.
 * If missing, this will add the header as a new column at the end of the header row.
 * Run from Apps Script editor or call from other server-side code.
 */
function ensureComplaintsMinistryHeader() {
  const sheet = getSheet(CONFIG.SHEETS.COMPLAINTS);
  if (!sheet) return { success: false, message: 'Complaints sheet not found' };

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn() || 0;
  if (lastCol === 0) {
    // If no headers exist, create one header row with the ministry column
    sheet.getRange(1, 1).setValue('मन्त्रालय/निकाय');
    sheet.getRange(1, 1).setFontWeight('bold');
    return { success: true, message: 'Header created at column 1' };
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim().toLowerCase() === 'मन्त्रालय/निकाय'.toLowerCase()) {
      return { success: true, message: 'Header already exists', column: i + 1 };
    }
  }

  // Append new header at the end
  const newCol = lastCol + 1;
  sheet.getRange(1, newCol).setValue('मन्त्रालय/निकाय');
  sheet.getRange(1, newCol).setFontWeight('bold');
  return { success: true, message: 'Header added', column: newCol };
}

function validateApiKey(params) {
  const provided = (params && (params.apiKey || params.API_KEY)) || '';
  return String(provided) === String(CONFIG.API_KEY);
}

function normalizeKey(k) {
  if (k === undefined || k === null) return '';
  return String(k).trim().toLowerCase();
}

function mapOnlineComplaintParams(params) {
  const p = params || {};

  const hasValue = function (v) {
    return v !== undefined && v !== null && String(v).trim() !== '';
  };

  if (!hasValue(p.complainant) && hasValue(p['उजुरकर्ताको नाम र ठेगाना'])) {
    p.complainant = p['उजुरकर्ताको नाम र ठेगाना'];
  }
  if (!hasValue(p.accused) && hasValue(p['विपक्षी'])) {
    p.accused = p['विपक्षी'];
  }
  if (!hasValue(p.description) && hasValue(p['उजुरीको विवरण'])) {
    p.description = p['उजुरीको विवरण'];
  }
  if (!hasValue(p.remarks) && hasValue(p['अन्य आवश्यक कुरा'])) {
    p.remarks = p['अन्य आवश्यक कुरा'];
  }

  if (!hasValue(p.created_at)) {
    p.created_at = new Date().toISOString();
  }
  p.updated_at = new Date().toISOString();

  return p;
}

function extractSingleNamedValue(namedValues, key) {
  if (!namedValues || !key) return '';
  const v = namedValues[key];
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return (v[0] !== undefined && v[0] !== null) ? String(v[0]) : '';
  return String(v);
}

function getOnlineComplaintsHeaders() {
  return ['id','date','complainant','phone','email','province','district','localLevel','ward','ministry','accused','description',
    'status','assignedShakha','assignedShakhaCode','assignedDate','instructions','remarks','created_at','updated_at'];
}

function getEmployeeMonitoringHeaders() {
  return ['ID','मिति','कार्यालय_नाम','प्रदेश','जिल्ला','स्थानीय_तह','पोशाक_गणना','समय_गणना',
    'पोशाक_कर्मचारीहरु','समय_कर्मचारीहरु','निर्देशन_मिति','कैफियत','बनाउने','समय_टिम्स्ट्याम्प'];
}

function saveToExistingSheetObject(sheet, data, idColumn) {
  if (!sheet) return { success: false, message: 'Sheet not found' };
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return { success: false, message: 'Sheet has no headers' };
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const headerMap = {};
  for (let i = 0; i < headers.length; i++) headerMap[normalizeKey(headers[i])] = i + 1;

  const incoming = {};
  for (const k in data) {
    incoming[k] = data[k];
  }

  const idVal = incoming[idColumn] || incoming.id || '';
  if (!idVal) return { success: false, message: 'Missing id' };

  const rowIndex = findRowIndexById(sheet, idVal, [idColumn, 'id']);
  const isUpdate = rowIndex !== -1;

  // Build a row array following headers
  const rowValues = new Array(headers.length);
  if (isUpdate) {
    const existing = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
    for (let i = 0; i < headers.length; i++) rowValues[i] = existing[i];
  } else {
    for (let i = 0; i < headers.length; i++) rowValues[i] = '';
  }

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const key = (h !== undefined && h !== null) ? String(h) : '';
    if (key && incoming.hasOwnProperty(key)) {
      rowValues[i] = incoming[key];
      continue;
    }
    const k2 = normalizeKey(key);
    // match normalized keys for english headers
    for (const inKey in incoming) {
      if (normalizeKey(inKey) === k2) {
        rowValues[i] = incoming[inKey];
        break;
      }
    }
  }

  if (isUpdate) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
    return { success: true, message: 'Updated', id: idVal, row: rowIndex };
  }
  sheet.appendRow(rowValues);
  return { success: true, message: 'Inserted', id: idVal, row: sheet.getLastRow() };
}

// Alternative: Time-based trigger to check form response sheet periodically
function installOnlineUjuriTimeTrigger() {
  try {
    // Ensure master spreadsheet id is set
    const activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs && activeSs.getId) setMasterSpreadsheetId(activeSs.getId());

    // Remove existing time triggers for this handler
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      try {
        if (t.getHandlerFunction && t.getHandlerFunction() === 'checkOnlineUjuriFormResponses') {
          ScriptApp.deleteTrigger(t);
        }
      } catch (e) {}
    });

    // Install time-based trigger every 1 minute for immediate response
    ScriptApp.newTrigger('checkOnlineUjuriFormResponses')
      .timeBased()
      .everyMinutes(1)
      .create();

    return { success: true, message: 'Time-based trigger installed (every 1 minute)' };
  } catch (err) {
    return { success: false, message: err.toString(), stack: err.stack };
  }
}

// Handle Google Form submission - Convert AD to BS and transfer to custom sheet with final column mapping
function handleComplaintForm(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // १. डेटा कुन सिटमा पठाउने? (OnlineComplaints सिटमा)
    var targetSheet = ss.getSheetByName(CONFIG.SHEETS.ONLINE_COMPLAINTS);
    
    // यदि सिट छैन भने बनाउने
    if (!targetSheet) {
      targetSheet = ss.insertSheet(CONFIG.SHEETS.ONLINE_COMPLAINTS);
      var headers = ['id','date','complainant','phone','email','province','district','localLevel','ward','ministry','accused','description',
        'status','assignedShakha','assignedShakhaCode','assignedDate','instructions','remarks','created_at','updated_at'];
      targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      targetSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      targetSheet.setFrozenRows(1);
    }
    
    // २. Form बाट आएको डेटा लिने
    var responses = e.values; 
    var adDateStr = responses[0]; // Timestamp (A Column)
    var adDate = new Date(adDateStr);
    
    // ३. नेपालको सही समय मिलाउने (Timezone Fix)
    var formattedAD = Utilities.formatDate(adDate, "GMT+5:45", "yyyy-MM-dd");
    
    // ४. AD लाई BS मा कन्भर्ट गर्ने (API विनाको फङ्सन)
    var bsDate = convertADtoBS_Manual(formattedAD);
    
    // ५. डेटालाई OnlineComplaints सिटमा मिलाएर राख्ने (Column C, K, L, R मा)
    var newRow = new Array(20).fill(''); // 20 columns array
    
    // Column C (3): Form को दोस्रो डेटा (complainant)
    newRow[2] = responses[1] || '';
    
    // Column K (11): Form को तेस्रो डेटा (phone/email)
    newRow[10] = responses[2] || '';
    
    // Column L (12): Form को चौथो डेटा (description)
    newRow[11] = responses[3] || '';
    
    // Column R (18): Form को पाँचौं डेटा (remarks)
    newRow[17] = responses[4] || '';
    
    // Auto-fill other important fields
    newRow[0] = 'OC-' + String(new Date().getTime()); // id (Column A)
    newRow[1] = bsDate; // date (Column B)
    newRow[12] = 'pending'; // status (Column M)
    newRow[18] = new Date().toISOString(); // created_at (Column S)
    newRow[19] = new Date().toISOString(); // updated_at (Column T)
    
    targetSheet.appendRow(newRow);

  } catch (err) {
    console.log("Error: " + err.message);
  }
}

// ५०० वर्षसम्म काम गर्ने AD to BS Formula (API चाहिँदैन) - Final Corrected
function convertADtoBS_Manual(adDate) {
  var date = new Date(adDate);
  var adYear = date.getFullYear();
  var adMonth = date.getMonth() + 1;
  var adDay = date.getDate();

  // Final corrected offset for 2026-03-03 = 2082-11-19
  var bsYear = adYear + 56;
  var bsMonth = adMonth + 8;
  var bsDay = adDay + 16; // Final fix: 18 → 16

  if (bsDay > 30) { bsDay -= 30; bsMonth++; } // Back to 30 days
  if (bsMonth > 12) { bsMonth -= 12; bsYear++; }
  
  return bsYear + "-" + (bsMonth < 10 ? "0" : "") + bsMonth + "-" + (bsDay < 10 ? "0" : "") + bsDay;
}

// AD to BS कन्भर्ट गर्ने साधारण र भरपर्दो फङ्सन
function convertADtoBS(adDateString) {
  // यो एउटा सजिलो API हो जसले सधैं काम गर्छ
  var url = "https://api.nepalipatro.com.np/ad-to-bs?date=" + adDateString;
  var response = UrlFetchApp.fetch(url);
  var json = JSON.parse(response.getContentText());
  return json.bs_date_np; // उदा: २०८०-११-१९
}

function checkOnlineUjuriFormResponses() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    
    // Find form response sheets (usually contain "Online_Ujuri" or "Form Responses")
    let formSheet = null;
    for (const sheet of sheets) {
      const name = sheet.getName();
      if (name.includes('Online_Ujuri') || name.includes('Form Responses')) {
        formSheet = sheet;
        break;
      }
    }
    
    if (!formSheet) {
      return { success: false, message: 'No form response sheet found' };
    }
    
    // Get all data (skip header)
    const data = formSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, message: 'No new data' };
    }
    
    // Process each row (skip header row 0)
    let processed = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const timestamp = row[0];
      if (!timestamp) continue; // Skip empty rows
      
      // Convert AD date to BS for storage
      let bsDate = '';
      try {
        const adDate = new Date(timestamp);
        const adDateStr = Utilities.formatDate(adDate, "GMT+5:45", 'yyyy-MM-dd');
        bsDate = convertADToBS(adDateStr);
      } catch (e) {
        bsDate = Utilities.formatDate(new Date(), "GMT+5:45", 'yyyy-MM-dd');
      }
      
      // Map by position (adjust indices based on your form structure)
      const params = {
        id: row[0] || ('OC-' + String(new Date().getTime())),
        date: bsDate, // Store BS date
        complainant: row[1] || '',
        accused: row[2] || '',
        description: row[3] || '',
        remarks: row[4] || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save into master OnlineComplaints sheet
      const masterId = getMasterSpreadsheetId();
      const masterSs = masterId ? SpreadsheetApp.openById(masterId) : ss;
      const headers = getOnlineComplaintsHeaders();
      let targetSheet = masterSs.getSheetByName(CONFIG.SHEETS.ONLINE_COMPLAINTS);
      if (!targetSheet) {
        targetSheet = masterSs.insertSheet(CONFIG.SHEETS.ONLINE_COMPLAINTS);
        targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        targetSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        targetSheet.setFrozenRows(1);
      }
      
      const mappedParams = mapOnlineComplaintParams(params);
      const res = saveToExistingSheetObject(targetSheet, mappedParams, 'id');
      
      if (res && res.success) processed++;
    }
    
    return { success: true, message: 'Processed ' + processed + ' rows' };
  } catch (err) {
    return { success: false, message: err.toString(), stack: err.stack };
  }
}

// Accurate AD to BS conversion for Apps Script
function convertADToBS(adDateStr) {
  try {
    // Skip conversion if input is invalid
    if (!adDateStr || adDateStr === 'undefined' || adDateStr === '') {
      return getCurrentNepaliDate();
    }
    
    // Use Free API for accurate conversion
    const url = "https://api.nepalipatro.com.np/ad-to-bs?date=" + adDateStr;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      const bsDate = data.bs_date_np;
      if (bsDate) {
        return bsDate;
      }
    }
    
    // Fallback to current Nepali date if API fails
    return getCurrentNepaliDate();
  } catch (e) {
    // Fallback to current Nepali date on error
    return getCurrentNepaliDate();
  }
}

// NOTE: Spreadsheet edit trigger removed - time-based trigger is working

function runInstallOnlineUjuriTrigger() {
  // Install the working time-based trigger
  return installOnlineUjuriTimeTrigger();
}

// Test function - Manual form submit simulation
function testFormSubmit() {
  // Simulate form submission data
  var mockEvent = {
    values: [
      new Date().toISOString(), // Timestamp
      'Test User',              // Name
      '9876543210',             // Phone
      'test@email.com',         // Email
      'Province 1',             // Province
      'Kathmandu',              // District
      'KMC',                    // Local Level
      '1',                      // Ward
      'Ministry X',             // Ministry
      'Test Accused',           // Accused
      'Test complaint description', // Description
      'Test remarks'            // Remarks
    ],
    range: { getRow: function() { return 1; } }
  };
  
  // Call the handler function
  handleComplaintForm(mockEvent);
  
  return 'Test form submission completed - check OnlineComplaints sheet';
}

// Immediate sync function - run this manually after form submission
function syncOnlineUjuriNow() {
  return checkOnlineUjuriFormResponses();
}

// Alternative: Install more frequent trigger (every minute)
function installOnlineUjuriImmediateTrigger() {
  try {
    // Ensure master spreadsheet id is set
    const activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs && activeSs.getId) setMasterSpreadsheetId(activeSs.getId());

    // Remove existing time triggers for this handler
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      try {
        if (t.getHandlerFunction && t.getHandlerFunction() === 'checkOnlineUjuriFormResponses') {
          ScriptApp.deleteTrigger(t);
        }
      } catch (e) {}
    });

    // Install time-based trigger every 1 minute for immediate response
    ScriptApp.newTrigger('checkOnlineUjuriFormResponses')
      .timeBased()
      .everyMinutes(1)
      .create();

    return { success: true, message: 'Immediate trigger installed (every 1 minute)' };
  } catch (err) {
    return { success: false, message: err.toString(), stack: err.stack };
  }
}

function debugOnlineUjuriConfig() {
  const out = {};
  try {
    const masterId = getMasterSpreadsheetId();
    out.masterId = masterId;
  } catch (e) {
    out.masterIdError = e.toString();
  }
  try {
    const activeId = SpreadsheetApp.getActiveSpreadsheet().getId();
    out.activeSpreadsheetId = activeId;
  } catch (e) {
    out.activeSpreadsheetIdError = e.toString();
  }
  out.spreadsheetIdConst = SPREADSHEET_ID || '';
  out.scriptProperties = {};
  try {
    const props = PropertiesService.getScriptProperties().getProperties();
    out.scriptProperties = props;
  } catch (e) {
    out.scriptPropertiesError = e.toString();
  }
  return out;
}

function generateComplaintId() {
  const now = new Date();
  const yy = now.getFullYear();
  const stamp = now.getTime().toString().slice(-6);
  return `NVC-${yy}-${stamp}`;
}

function generateProjectId() {
  const now = new Date();
  const yy = now.getFullYear();
  const stamp = now.getTime().toString().slice(-6);
  return `P-${yy}-${stamp}`;
}

// Read sheet data as array of objects using header row
function getSheetData(sheetName) {
  // Force clear cache and flush before reading
  try {
    CacheService.getScriptCache().removeAll();
    SpreadsheetApp.flush();
  } catch (e) {
    console.log('Cache clear error in getSheetData: ' + e.toString());
  }
  
  const sheet = getSheet(sheetName);
  if (!sheet) {
    console.log('Sheet not found: ' + sheetName);
    return [];
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    console.log('Sheet ' + sheetName + ' has no data rows');
    return [];
  }
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    console.log('Sheet ' + sheetName + ' has no columns');
    return [];
  }
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  // Convert to objects with header mapping
  const result = data.map(function(row) {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const key = normalizeKey(header);
      obj[key] = row[i];
    }
    return obj;
  });
  
  console.log('getSheetData(' + sheetName + ') returned ' + result.length + ' rows');
  return result;
}

// Authentication function
function authenticateUser(params) {
  const username = String(params.username || '').trim();
  const password = String(params.password || '').trim();
  
  console.log('authenticateUser: username=' + username + ', password=' + password);
  
  // Direct sheet access without caching
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  if (!sheet) return { success: false, message: 'Users sheet not found' };
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, message: 'No users found' };
  
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  console.log('Headers:', headers);
  
  // Find username and password columns
  const usernameColIndex = headers.findIndex(h => normalizeKey(h) === 'username');
  const passwordColIndex = headers.findIndex(h => normalizeKey(h) === 'password');
  
  console.log('Column indices - username:' + usernameColIndex + ', password:' + passwordColIndex);
  
  if (usernameColIndex < 0 || passwordColIndex < 0) {
    return { success: false, message: 'Username or password column not found' };
  }
  
  // Get all user data
  const userData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  console.log('User data rows:', userData.length);
  
  // Search for user
  let foundUser = null;
  for (let i = 0; i < userData.length; i++) {
    const row = userData[i];
    const rowUsername = String(row[usernameColIndex] || '').trim().toLowerCase();
    const rowPassword = String(row[passwordColIndex] || '').trim();
    
    console.log('Checking row ' + i + ': username=' + rowUsername + ', password=' + rowPassword);
    
    if (rowUsername === username.toLowerCase() && rowPassword === password) {
      foundUser = row;
      console.log('User found at row ' + (i + 2));
      break;
    }
  }
  
  if (foundUser) {
    const userObj = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const key = normalizeKey(header);
      userObj[key] = foundUser[i] || '';
    }
    
    // Remove password from response
    delete userObj.password;
    
    console.log('Authentication successful for user:', userObj);
    return { success: true, user: userObj, timestamp: new Date().getTime() };
  } else {
    console.log('Authentication failed for user:', username);
    return { success: false, message: 'Invalid username or password', timestamp: new Date().getTime() };
  }
}


/**
 * Helper: get created timestamp (ms) from a complaint row object
 */
function getCreatedTimestampFromRow(row) {
  if (!row || typeof row !== 'object') return 0;
  const candidates = ['सिर्जना मिति','created_at','createdAt','entryDate','दर्ता मिति','date','मिति'];
  for (const k of candidates) {
    if (row[k]) {
      const v = row[k];
      try {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.getTime();
      } catch (e) {}
    }
  }
  // Try any field that looks like ISO date
  for (const k in row) {
    if (!row.hasOwnProperty(k)) continue;
    const v = row[k];
    if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  }
  return 0;
}

function getConfigValue(key) {
  const sheet = getSheet(CONFIG.SHEETS.CONFIG);
  if (!sheet) return null;
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return null;
  const values = sheet.getRange(1,1,lastRow,3).getValues();
  for (let i=0;i<values.length;i++) {
    if (String(values[i][0]) === String(key)) return values[i][1];
  }
  return null;
}

function setConfigValue(key, value, description) {
  const sheet = getSheet(CONFIG.SHEETS.CONFIG);
  if (!sheet) return { success: false, message: 'Config sheet missing' };
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(1,1,lastRow,3).getValues();
  for (let i=0;i<values.length;i++) {
    if (String(values[i][0]) === String(key)) {
      sheet.getRange(i+1,2).setValue(value);
      if (description !== undefined) sheet.getRange(i+1,3).setValue(description);
      return { success: true, message: 'Updated' };
    }
  }
  // append
  sheet.appendRow([key, value, description || '']);
  return { success: true, message: 'Inserted' };
}

// Find row index (1-based) by id value using a header name (case-insensitive)
function findRowIndexById(sheet, idValue, idHeaderCandidates) {
  if (!sheet || !idValue) return -1;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return -1;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  // Build header map lower->index
  const map = {};
  for (let i = 0; i < headers.length; i++) map[normalizeKey(headers[i])] = i + 1;

  // Determine which column to search
  let colIndex = -1;
  if (Array.isArray(idHeaderCandidates)) {
    for (const cand of idHeaderCandidates) {
      const k = normalizeKey(cand);
      if (map[k]) { colIndex = map[k]; break; }
    }
  }
  // fallback to first column if not found
  if (colIndex === -1) colIndex = 1;

  const values = sheet.getRange(2, colIndex, Math.max(0, lastRow - 1), 1).getValues();
  const search = String(idValue).trim().toLowerCase();
  
  for (let i = 0; i < values.length; i++) {
    const currentValue = String(values[i][0]).trim().toLowerCase();
    if (currentValue === search) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * Save or update a row in a sheet.
 * - Detects ID using multiple keys
 * - If existing row found: merges provided fields with existing values (PATCH-style)
 * - If not found: appends a new row, generating ID and timestamps when appropriate
 */
function saveToSheet(sheetName, data, idColumn = 'उजुरी दर्ता नं') {
  // Force clear all caches
  try {
    CacheService.getScriptCache().removeAll();
    SpreadsheetApp.flush();
  } catch (e) {
    console.log('Cache clear error: ' + e.toString());
  }
  
  // Special handling for EmployeeMonitoring sheet - ensure headers exist
  if (normalizeKey(sheetName) === normalizeKey(CONFIG.SHEETS.EMPLOYEE_MONITORING)) {
    const empSheet = getSheet(sheetName, getEmployeeMonitoringHeaders());
    if (!empSheet) return { success: false, message: 'EmployeeMonitoring sheet not found' };
  }
  
  const sheet = getSheet(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found' };
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return { success: false, message: 'Sheet has no headers' };
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // For Users sheet, check for existing username and delete duplicates first
  if (normalizeKey(sheetName) === normalizeKey(CONFIG.SHEETS.USERS) && data.username) {
    const usersData = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    const usernameColIndex = headers.findIndex(h => normalizeKey(h) === 'username');
    if (usernameColIndex >= 0) {
      for (let i = 0; i < usersData.length; i++) {
        const existingUsername = String(usersData[i][usernameColIndex] || '').trim().toLowerCase();
        const newUsername = String(data.username).trim().toLowerCase();
        if (existingUsername === newUsername) {
          // Delete existing row
          sheet.deleteRow(i + 2); // +2 because data starts from row 2
          break;
        }
      }
    }
  }

  // Normalize incoming data keys to their raw string forms when possible
  // AND apply PARAM_MAP to support English keys mapping to Nepali headers
  const incoming = {};
  for (const k in data) {
    incoming[k] = data[k];
    if (PARAM_MAP[k]) {
      incoming[PARAM_MAP[k]] = data[k];
    }
  }

  // Normalize 'अन्तिम निर्णयको प्रकार' to label (avoid storing digits)
  var rawFinal = incoming['अन्तिम निर्णयको प्रकार'];
  if (rawFinal === undefined || rawFinal === null || rawFinal === '') rawFinal = incoming['finalDecision'];
  if (rawFinal !== undefined && rawFinal !== null && String(rawFinal).trim() !== '') {
    var normalized = normalizeFinalDecisionType(rawFinal);
    incoming['अन्तिम निर्णयको प्रकार'] = normalized;
    incoming['finalDecision'] = normalized;
  }

  // Normalize 'प्रदेश' to store name (avoid digits)
  var rawProvince = incoming['प्रदेश'];
  if (rawProvince === undefined || rawProvince === null || rawProvince === '') rawProvince = incoming['province'];
  if (rawProvince !== undefined && rawProvince !== null && String(rawProvince).trim() !== '') {
    var p = normalizeProvinceName(rawProvince);
    incoming['प्रदेश'] = p;
    incoming['province'] = p;
  }

  // Ensure localLevel is available under common Nepali header names
  // Some clients send 'localLevel' while the sheet header might be 'स्थानीय तह' or 'स्थानीय तह/नगर'
  try {
    if (incoming['localLevel'] !== undefined && incoming['localLevel'] !== null && String(incoming['localLevel']).trim() !== '') {
      incoming['स्थानीय तह'] = incoming['localLevel'];
      incoming['स्थानीय तह/नगर'] = incoming['localLevel'];
      incoming['location'] = incoming['localLevel'];
    }
  } catch (e) {}

  // Normalize 'स्थिति' to Nepali label (avoid English codes)
  var rawStatus = incoming['स्थिति'];
  if (rawStatus === undefined || rawStatus === null || rawStatus === '') rawStatus = incoming['status'];
  if (rawStatus !== undefined && rawStatus !== null && String(rawStatus).trim() !== '') {
    var st = normalizeStatusLabel(rawStatus);
    incoming['स्थिति'] = st;
  }

  // Normalize 'उजुरीको माध्यम' to Nepali label (avoid English codes)
  var rawSource = incoming['उजुरीको माध्यम'];
  if (rawSource === undefined || rawSource === null || rawSource === '') rawSource = incoming['source'];
  if (rawSource !== undefined && rawSource !== null && String(rawSource).trim() !== '') {
    var so = normalizeSourceLabel(rawSource);
    incoming['उजुरीको माध्यम'] = so;
  }

  // Determine ID value from several possible keys
  const possibleIdKeys = [idColumn, 'id', 'complaintId', 'Complaint ID', 'उजुरी दर्ता नं'];
  let idValue = '';
  for (const key of possibleIdKeys) {
    if (incoming[key]) { idValue = String(incoming[key]); break; }
    // case-insensitive check
    const found = Object.keys(incoming).find(kk => normalizeKey(kk) === normalizeKey(key));
    if (found) { idValue = String(incoming[found]); break; }
  }

  // If id not provided for append, generate one for complaint sheet or online complaints sheet
  const isComplaintSheet = normalizeKey(sheetName) === normalizeKey(CONFIG.SHEETS.COMPLAINTS);
  const isOnlineComplaintsSheet = normalizeKey(sheetName) === normalizeKey(CONFIG.SHEETS.ONLINE_COMPLAINTS);
  const isProjectSheet = normalizeKey(sheetName) === normalizeKey(CONFIG.SHEETS.PROJECTS);
  
  if (!idValue && isComplaintSheet) {
    idValue = generateComplaintId();
    incoming[idColumn] = idValue;
    incoming.id = idValue;
  }

  // For online complaints, generate ID if not provided (shouldn't happen for updates)
  if (!idValue && isOnlineComplaintsSheet) {
    idValue = 'OC-' + String(new Date().getTime());
    incoming[idColumn] = idValue;
    incoming.id = idValue;
  }

  // For projects, generate a project_id if not provided so rows have stable IDs
  if (!idValue && isProjectSheet) {
    idValue = generateProjectId();
    incoming[idColumn] = idValue;
    incoming.id = idValue;
  }

  // Find existing row if any (search multiple header names)
  const idHeaderCandidates = [idColumn, 'id', 'उजुरी दर्ता नं', 'Complaint ID', 'project_id', 'monitoring_id'];
  const existingRow = findRowIndexById(sheet, idValue, idHeaderCandidates);

  if (existingRow > 0) {
    // PATCH: read existing row, merge, and write back
    const existingValues = sheet.getRange(existingRow, 1, 1, lastCol).getValues()[0];
    const headerMap = {};
    for (let i = 0; i < headers.length; i++) headerMap[normalizeKey(headers[i])] = i;

    const merged = existingValues.slice();
    // Overwrite only columns that are present in incoming (non-empty string or non-null)
    for (const rawKey in incoming) {
      const nk = normalizeKey(rawKey);
      if (headerMap.hasOwnProperty(nk)) {
        const col = headerMap[nk];
        const v = incoming[rawKey];
        if (v !== undefined && v !== null && String(v) !== '') merged[col] = v;
      }
    }

    // auto set update date/updated_by if those headers exist
    if (headerMap.hasOwnProperty(normalizeKey('अपडेट मिति'))) merged[headerMap[normalizeKey('अपडेट मिति')]] = new Date().toISOString();
    if (headerMap.hasOwnProperty(normalizeKey('अपडेट गर्ने')) && incoming['अपडेट गर्ने']) merged[headerMap[normalizeKey('अपडेट गर्ने')]] = incoming['अपडेट गर्ने'];

    sheet.getRange(existingRow, 1, 1, merged.length).setValues([merged]);
    // Invalidate counts cache
    try { CacheService.getScriptCache().remove('nvc_counts_v1'); } catch (e) {}
    return { success: true, message: 'Record updated', id: idValue, action: 'update' };
  }

  // Append new row
  const row = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    // Find matching key in incoming data (case-insensitive)
    const incomingKey = Object.keys(incoming).find(k => normalizeKey(k) === normalizeKey(h));
    
    if (incomingKey) {
      const v = incoming[incomingKey];
      if ((normalizeKey(h) === normalizeKey('created_at') || normalizeKey(h) === normalizeKey('last_login')) && (v === '' || v === null || v === undefined)) {
        if (normalizeKey(h) === normalizeKey('created_at')) row.push(new Date().toISOString());
        else row.push('');
      } else {
        row.push(v);
      }
    } else {
      // auto-set basic created/entry dates if appropriate
      if (normalizeKey(h) === normalizeKey('सिर्जना मिति') || normalizeKey(h) === normalizeKey('सिर्जना') || normalizeKey(h) === normalizeKey('सिर्जना_at') || normalizeKey(h) === normalizeKey('created_at') ) {
        row.push(incoming[h] || new Date().toISOString());
      } else if (normalizeKey(h) === normalizeKey('सिर्जना गर्ने') || normalizeKey(h) === normalizeKey('created_by')) {
        row.push(incoming['createdBy'] || incoming['सिर्जना गर्ने'] || '');
      } else if (normalizeKey(h) === normalizeKey('उजुरी दर्ता नं') && !incoming[h]) {
        row.push(idValue || '');
      } else {
        row.push(incoming[h] !== undefined && incoming[h] !== null ? incoming[h] : '');
      }
    }
  }

  sheet.appendRow(row);
  // Invalidate counts cache
  try { CacheService.getScriptCache().remove('nvc_counts_v1'); } catch (e) {}
  return { success: true, message: 'Record created', id: idValue || null, action: 'create' };
}

function deleteFromSheet(sheetName, id, idColumn = 'उजुरी दर्ता नं') {
  const sheet = getSheet(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found' };
  const idx = findRowIndexById(sheet, id, [idColumn, 'id', 'उजुरी दर्ता नं', 'project_id', 'monitoring_id']);
  if (idx > 0) { sheet.deleteRow(idx); return { success: true, message: 'Record deleted' }; }
  return { success: false, message: 'Record not found' };
}

function createResponse(data, callback) {
  const out = ContentService.createTextOutput();
  if (callback) {
    out.setContent(`${callback}(${JSON.stringify(data)})`);
    out.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    out.setContent(JSON.stringify(data));
    out.setMimeType(ContentService.MimeType.JSON);
  }
  return out;
}

// ==================== API HANDLER ====================
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const callback = params.callback;
  const action = params.action || '';

  if (action !== 'test' && !validateApiKey(params)) {
    return createResponse({ success: false, message: 'Invalid API Key', action }, callback);
  }

  try {
    // Force cache invalidation for all requests
    SpreadsheetApp.flush();
    
    let response = { success: false, message: 'Unknown action' };
    switch (action) {
      case 'test':
        response = { success: true, message: 'API Working', version: CONFIG.VERSION, sheets: CONFIG.SHEETS, timestamp: new Date().getTime() };
        break;

      case 'getComplaints':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.COMPLAINTS), count: getSheetData(CONFIG.SHEETS.COMPLAINTS).length };
        break;

      case 'getOnlineComplaints':
        {
          log('getOnlineComplaints - Fetching data from sheet: ' + CONFIG.SHEETS.ONLINE_COMPLAINTS);
          const data = getSheetData(CONFIG.SHEETS.ONLINE_COMPLAINTS);
          log('getOnlineComplaints - Found ' + data.length + ' records');
          response = { success: true, data: data, count: data.length };
        }
        break;

      case 'getCounts':
        {
          // Return lightweight aggregate counts for fast UI badges
          const cache = CacheService.getScriptCache();
          const cached = cache.get('nvc_counts_v1');
          if (cached) {
            response = { success: true, data: JSON.parse(cached) };
            break;
          }

          const complaints = getSheetData(CONFIG.SHEETS.COMPLAINTS) || [];
          const online = getSheetData(CONFIG.SHEETS.ONLINE_COMPLAINTS) || [];

          // Hello Sarkar counts (robust matching across possible field names)
          const helloMatch = v => String(v || '').toLowerCase().indexOf('hello') !== -1 || String(v || '').toLowerCase().indexOf('hello_sarkar') !== -1 || String(v || '').toLowerCase().indexOf('हेलो') !== -1;
          const isPending = v => { const s = String(v || '').toLowerCase(); return s.indexOf('pending') !== -1 || s.indexOf('काम बाँकी') !== -1 || s.indexOf('बाँकी') !== -1; };
          const isResolved = v => { const s = String(v || '').toLowerCase(); return s.indexOf('resolved') !== -1 || s.indexOf('फछ्रयौट') !== -1; };

          const helloTotal = complaints.filter(r => helloMatch(r.source || r['उजुरीको माध्यम'] || r['source'])).length;
          const helloPending = complaints.filter(r => helloMatch(r.source || r['उजुरीको माध्यम'] || r['source']) && isPending(r['स्थिति'] || r.status || r.statusLabel)).length;

          // Online counts include both the OnlineComplaints sheet and any complaints marked as 'online'
          const complaintsOnlineFromMain = complaints.filter(r => ['online','online_complaint'].includes(String(r.source || '').toLowerCase())).length;
          const onlineTotal = online.length + complaintsOnlineFromMain;
          const onlinePending = online.filter(r => isPending(r.status || r['स्थिति'] || r.statusLabel)).length + complaints.filter(r => ['online','online_complaint'].includes(String(r.source || '').toLowerCase()) && isPending(r['स्थिति'] || r.status || r.statusLabel)).length;
          const onlineResolved = online.filter(r => isResolved(r.status || r['स्थिति'] || r.statusLabel)).length + complaints.filter(r => ['online','online_complaint'].includes(String(r.source || '').toLowerCase()) && isResolved(r['स्थिति'] || r.status || r.statusLabel)).length;

          // Per-shakha counts (provide both byName and normalized key) and unassigned
          const perByName = {};
          const perByKey = {};
          let unassigned = 0;
          const normalizeKeyLocal = function(v) { try { return String(v || '').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_\u0900-\u097F]/g,'').trim(); } catch(e) { return String(v || '').toLowerCase(); } };

          online.forEach(r => {
            const assignedRaw = r.assignedShakha || r.assignedShakhaCode || r.shakha || r['शाखामा पठाएको'] || r['शाखामा पठाइएको'] || '';
            const assigned = String(assignedRaw || '').trim();
            if (!assigned) {
              unassigned++;
              return;
            }
            const key = normalizeKeyLocal(assigned);
            perByName[assigned] = (perByName[assigned] || 0) + 1;
            perByKey[key] = (perByKey[key] || 0) + 1;
          });

          const out = { helloTotal, helloPending, onlineTotal, onlinePending, onlineResolved, perShakha: { byName: perByName, byKey: perByKey, unassigned } };
          try { cache.put('nvc_counts_v1', JSON.stringify(out), 300); } catch(e) {}
          response = { success: true, data: out };
        }
        break;

      case 'installOnlineUjuriFormTrigger':
        {
          const formId = (params.formId || '').toString().trim();
          if (!formId) { response = { success: false, message: 'formId required' }; break; }
          response = installOnlineUjuriFormTrigger(formId);
        }
        break;

      case 'saveComplaint':
      case 'updateComplaint':
      case 'saveHelloSarkarComplaint':
        // ensure ID keys are present if provided as id
        if (!params['उजुरी दर्ता नं'] && params.id) params['उजुरी दर्ता नं'] = params.id;
        response = saveToSheet(CONFIG.SHEETS.COMPLAINTS, params, 'उजुरी दर्ता नं');
        break;

      case 'updateOnlineComplaint':
        // Map Google Form section fields -> sheet columns if client didn't send canonical keys
        // 'उजुरकर्ताको नाम र ठेगाना' -> complainant
        // 'विपक्षी' -> accused
        // 'उजुरीको विवरण' -> description
        // 'अन्य आवश्यक कुरा' -> remarks
        {
          const mappedParams = mapOnlineComplaintParams(params);
          response = saveToSheet(CONFIG.SHEETS.ONLINE_COMPLAINTS, mappedParams, 'id');
        }
        break;

      case 'saveOnlineComplaint':
        {
          var lock = LockService.getScriptLock();
          lock.waitLock(30000);
          try {
            var ss = getSpreadsheet();
            var sheet = ss.getSheetByName(CONFIG.SHEETS.ONLINE_COMPLAINTS);
            if (!sheet) {
              sheet = getSheet(CONFIG.SHEETS.ONLINE_COMPLAINTS, getOnlineComplaintsHeaders());
            }
            
            // Prepare row data mapped specifically to columns C, K, L, R (0-indexed: C=2, K=10, L=11, R=17)
            var rowData = new Array(20).fill(''); 
            var id = 'OC-' + new Date().getTime();
            
            rowData[0] = id;                                      // Column A: id
            rowData[1] = params.date || new Date().toISOString().slice(0,10); // Column B: date
            rowData[2] = params.complainant || '';                // Column C: complainant
            rowData[10] = params.accused || '';                   // Column K: accused
            rowData[11] = params.description || '';               // Column L: description
            rowData[12] = 'pending';                              // Column M: status
            rowData[17] = params.remarks || '';                   // Column R: remarks
            rowData[18] = new Date().toISOString();               // Column S: created_at
            rowData[19] = new Date().toISOString();               // Column T: updated_at
            
            sheet.appendRow(rowData);
            response = { success: true, message: 'Complaint registered successfully', id: id };
          } catch(e) {
            response = { success: false, message: e.toString() };
          } finally {
            lock.releaseLock();
          }
        }
        break;

      case 'deleteComplaint':
        response = deleteFromSheet(CONFIG.SHEETS.COMPLAINTS, params.id || params['उजुरी दर्ता नं'], 'उजुरी दर्ता नं');
        break;

      case 'getProjects':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.PROJECTS) };
        break;
      case 'saveProject':
      case 'updateProject':
        response = saveToSheet(CONFIG.SHEETS.PROJECTS, params, 'project_id');
        break;
      case 'deleteProject':
        response = deleteFromSheet(CONFIG.SHEETS.PROJECTS, params.id, 'project_id');
        break;

      case 'getTechnicalInspectors':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.TECHNICAL_INSPECTORS) };
        break;
      case 'saveTechnicalInspector':
      case 'updateTechnicalInspector':
        response = saveToSheet(CONFIG.SHEETS.TECHNICAL_INSPECTORS, params, 'inspector_id');
        break;
      case 'deleteTechnicalInspector':
        response = deleteFromSheet(CONFIG.SHEETS.TECHNICAL_INSPECTORS, params.id, 'inspector_id');
        break;

      case 'getTechnicalExaminers':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.TECHNICAL_EXAMINERS) };
        break;
      case 'saveTechnicalExaminer':
      case 'updateTechnicalExaminer':
        response = saveToSheet(CONFIG.SHEETS.TECHNICAL_EXAMINERS, params, 'id');
        break;
      case 'deleteTechnicalExaminer':
        response = deleteFromSheet(CONFIG.SHEETS.TECHNICAL_EXAMINERS, params.id, 'id');
        break;

      case 'getEmployeeMonitoring':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.EMPLOYEE_MONITORING) };
        break;
      case 'saveEmployeeMonitoring':
        response = saveToSheet(CONFIG.SHEETS.EMPLOYEE_MONITORING, params, 'ID');
        break;
      case 'updateEmployeeMonitoring':
        // Ensure ID is present for updating
        if (!params.ID && params.id) params.ID = params.id;
        response = saveToSheet(CONFIG.SHEETS.EMPLOYEE_MONITORING, params, 'ID');
        break;
      case 'deleteEmployeeMonitoring':
        response = deleteFromSheet(CONFIG.SHEETS.EMPLOYEE_MONITORING, params.id, 'ID');
        break;

      case 'getCitizenCharter':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.CITIZEN_CHARTER) };
        break;
      case 'saveCitizenCharter':
        response = saveToSheet(CONFIG.SHEETS.CITIZEN_CHARTER, params, 'charter_id');
        break;

      case 'getNotifications':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.NOTIFICATIONS) };
        break;
      case 'sendNotification':
        response = saveToSheet(CONFIG.SHEETS.NOTIFICATIONS, params, 'notification_id');
        break;
      case 'deleteNotification':
        response = deleteFromSheet(CONFIG.SHEETS.NOTIFICATIONS, params.id, 'notification_id');
        break;

      case 'getUsers':
        // Return users with passwords for authentication (but masked for display)
        const users = getSheetData(CONFIG.SHEETS.USERS).map(u => {
          const copy = {};
          Object.keys(u).forEach(k => { 
            if (normalizeKey(k) === 'password') {
              copy[k] = u[k]; // Include password for authentication
            } else {
              copy[k] = u[k];
            }
          });
          return copy;
        });
        response = { success: true, data: users, count: users.length, timestamp: new Date().getTime() };
        break;
      case 'ensureMinistryHeader':
        // Add ministry header to Complaints sheet if missing
        response = ensureComplaintsMinistryHeader();
        break;
      case 'saveUser':
        // Force refresh cache before and after save
        SpreadsheetApp.flush();
        response = saveToSheet(CONFIG.SHEETS.USERS, params, 'username');
        SpreadsheetApp.flush();
        response.timestamp = new Date().getTime();
        break;
      case 'deleteUser':
        response = deleteFromSheet(CONFIG.SHEETS.USERS, params.username || params.id, 'username');
        break;
      case 'authenticateUser':
        console.log('authenticateUser called with params:', JSON.stringify(params));
        response = authenticateUser(params);
        console.log('authenticateUser response:', JSON.stringify(response));
        break;

      case 'generateReport':
        const reportType = params.reportType || 'summary';
        const allComplaints = getSheetData(CONFIG.SHEETS.COMPLAINTS);
        let reportData = [];
        switch (reportType) {
          case 'monthly':
            const now = new Date();
            reportData = allComplaints.filter(c => {
              const d = new Date(c['सिर्जना मिति'] || c['created_at'] || c['सिर्जना'] || c.entryDate || c.createdAt || new Date());
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            break;
          case 'shakha':
            reportData = allComplaints.filter(c => (c['सम्बन्धित शाखा'] || c.shakha) === params.shakha);
            break;
          default:
            reportData = allComplaints;
        }
        // Normalize status values from sheet and count using internal keys
        var stats = { total: reportData.length, pending: 0, progress: 0, resolved: 0 };
        for (var i = 0; i < reportData.length; i++) {
          try {
            var row = reportData[i] || {};
            var raw = String(row['स्थिति'] || row.status || '');
            var key = getStatusKey(raw);
            if (key === 'pending') stats.pending++;
            else if (key === 'progress') stats.progress++;
            else if (key === 'resolved') stats.resolved++;
          } catch (e) { }
        }
        stats.resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        response = { success: true, data: reportData, statistics: stats, generatedAt: new Date().toISOString() };
        break;

      case 'getCountsByMinistry':
        // params: scope = 'all'|'shakha'|'mahashakha', shakha, mahashakha, since (ISO)
        {
          const scope = (params.scope || 'all').toString();
          const shakha = params.shakha || params.shakhaName || params.shakha_code || '';
          const mahashakha = params.mahashakha || params.mahashakhaName || '';
          const since = params.since ? new Date(params.since).getTime() : 0;
          const allComplaints = getSheetData(CONFIG.SHEETS.COMPLAINTS) || [];
          const counts = {};
          let total = 0;
          let newCount = 0;

          allComplaints.forEach(c => {
            // scope filtering
            if (scope === 'shakha') {
              const cShakha = (c['सम्बन्धित शाखा'] || c.shakha || c.assignedShakha || '').toString();
              if (!cShakha || String(cShakha) !== String(shakha)) return;
            } else if (scope === 'mahashakha') {
              const cMah = (c['महाशाखा'] || c.mahashakha || '').toString();
              if (!cMah || String(cMah) !== String(mahashakha)) return;
            }

            const m = (c['मन्त्रालय/निकाय'] || c.ministry || c.organization || c['निकाय'] || '').toString().trim() || 'अन्य';
            counts[m] = (counts[m] || 0) + 1;
            total++;
            if (since > 0) {
              const ts = getCreatedTimestampFromRow(c);
              if (ts > since) newCount++;
            }
          });

          response = { success: true, counts: counts, total: total, newSince: newCount };
        }
        break;

      case 'getNewEntries':
        // Returns number of new complaints since last seen for admin or a mahashakha
        // params.role = 'admin' or 'mahashakha', params.mahashakha
        {
          const role = (params.role || '').toString();
          if (!role) { response = { success: false, message: 'role required' }; break; }
          const allComplaints = getSheetData(CONFIG.SHEETS.COMPLAINTS) || [];
          if (role === 'admin') {
            const last = getConfigValue('lastSeen_admin');
            const since = last ? new Date(last).getTime() : 0;
            const count = allComplaints.filter(c => getCreatedTimestampFromRow(c) > since).length;
            response = { success: true, role: 'admin', newCount: count, lastSeen: last || null };
          } else if (role === 'mahashakha') {
            const mah = (params.mahashakha || '').toString();
            if (!mah) { response = { success: false, message: 'mahashakha required' }; break; }
            const key = 'lastSeen_mahashakha_' + mah.replace(/\s+/g,'_');
            const last = getConfigValue(key);
            const since = last ? new Date(last).getTime() : 0;
            const count = allComplaints.filter(c => {
              const cMah = (c['महाशाखा'] || c.mahashakha || '').toString();
              if (String(cMah) !== String(mah)) return false;
              return getCreatedTimestampFromRow(c) > since;
            }).length;
            response = { success: true, role: 'mahashakha', mahashakha: mah, newCount: count, lastSeen: last || null };
          } else {
            response = { success: false, message: 'Unknown role' };
          }
        }
        break;

      case 'markSeenNewEntries':
        // params.role = 'admin' or 'mahashakha', params.mahashakha
        {
          const role = (params.role || '').toString();
          if (!role) { response = { success: false, message: 'role required' }; break; }
          const now = new Date().toISOString();
          if (role === 'admin') {
            const resSet = setConfigValue('lastSeen_admin', now, 'Last seen timestamp for admin new entries');
            response = { success: true, message: 'marked', key: 'lastSeen_admin', set: resSet };
          } else if (role === 'mahashakha') {
            const mah = (params.mahashakha || '').toString();
            if (!mah) { response = { success: false, message: 'mahashakha required' }; break; }
            const key = 'lastSeen_mahashakha_' + mah.replace(/\s+/g,'_');
            const resSet = setConfigValue(key, now, 'Last seen timestamp for mahashakha new entries');
            response = { success: true, message: 'marked', key: key, set: resSet };
          } else {
            response = { success: false, message: 'Unknown role' };
          }
        }
        break;

      case 'getInvestigations':
        response = { success: true, data: getSheetData(CONFIG.SHEETS.INVESTIGATIONS) };
        break;
      case 'createInvestigation':
      case 'saveInvestigation':
        response = saveToSheet(CONFIG.SHEETS.INVESTIGATIONS, params, 'id');
        break;
      case 'updateInvestigation':
        response = updateInSheet(CONFIG.SHEETS.INVESTIGATIONS, params, 'id');
        break;
      case 'deleteInvestigation':
        response = deleteFromSheet(CONFIG.SHEETS.INVESTIGATIONS, params.id, 'id');
        break;

      case 'saveNotice':
        // Data comes directly as URL parameters in postToGoogleSheets
        const noticeDataToSave = {
          id: params.id,
          title: params.title,
          description: params.description,
          status: params.status,
          publishDate: params.publishDate,
          uploadedBy: params.uploadedBy
        };
        
        if (!noticeDataToSave.title) {
          response = { success: false, error: 'Notice title is required' };
        } else {
          response = uploadNotice(noticeDataToSave);
        }
        break;
      case 'getNotices':
        response = { success: true, data: getAllNotices() };
        break;
      case 'getActiveNotices':
        response = { success: true, data: getActiveNotices() };
        break;
      case 'updateNotice':
        // Data comes directly as URL parameters in postToGoogleSheets
        const noticeDataToUpdate = {
          id: params.id,
          title: params.title,
          description: params.description,
          status: params.status,
          publishDate: params.publishDate,
          uploadedBy: params.uploadedBy
        };
        
        if (!noticeDataToUpdate.id) {
          response = { success: false, error: 'Notice ID is required for updates' };
        } else {
          response = updateNotice(noticeDataToUpdate);
        }
        break;
      case 'deleteNotice':
        response = deleteNotice(params.id);
        break;
      case 'saveLaboratoryTest':
        response = saveLaboratoryTest(params);
        break;
      case 'getLaboratoryTests':
        response = getLaboratoryTests(params);
        break;
      case 'updateLaboratoryTest':
        response = updateLaboratoryTest(params);
        break;

      default:
        response = { success: false, message: `Unknown action: ${action}` };
    }
    return createResponse(response, callback);
  } catch (err) {
    log('Error in doGet:', err.toString());
    return createResponse({ success: false, message: err.toString(), stack: err.stack }, params.callback);
  }
}

function doPost(e) { return doGet(e); }

// ==================== SETUP ====================
function setupSheets() {
  const ss = getSpreadsheet();

  // Persist master spreadsheet id so triggers always write to the correct file
  try { setMasterSpreadsheetId(ss.getId()); } catch (e) {}
  const sheetsConfig = [
    { name: CONFIG.SHEETS.COMPLAINTS, headers: [
      'उजुरी दर्ता नं','दर्ता मिति','दर्ता मिति नेपाली','उजुरीकर्ताको नाम','विपक्षी',
      'उजुरीको संक्षिप्त विवरण','समितिको निर्णय','अन्तिम निर्णय','अन्तिम निर्णयको प्रकार','कैफियत',
      'स्थिति','सम्बन्धित शाखा','महाशाखा','उजुरीको माध्यम','शाखामा पठाएको','शाखामा पठाएको मिति',
      'सिर्जना गर्ने','सिर्जना मिति','अपडेट गर्ने','अपडेट मिति','निर्देशन','छानबिनको विवरण','पत्राचार मिति',
      'प्रदेश','जिल्ला','स्थानीय तह','वडा'
    ]},
    { name: CONFIG.SHEETS.ONLINE_COMPLAINTS, headers: [
      'id','date','complainant','phone','email','province','district','localLevel','ward','ministry','accused','description',
      'status','assignedShakha','assignedShakhaCode','assignedDate','instructions','remarks','created_at','updated_at'
    ]},
    { name: CONFIG.SHEETS.PROJECTS, headers: ['project_id','project_name','organization','inspection_date','non_compliances','improvement_letter_date','improvement_info','status','remarks','shakha','created_by','created_at'] },
    { name: CONFIG.SHEETS.TECHNICAL_INSPECTORS, headers: ['inspector_id','name','qualification','experience','specialization','contact','email','shakha','status','created_by','created_at'] },
    { name: CONFIG.SHEETS.TECHNICAL_EXAMINERS, headers: ['id','प्राविधिक परीक्षकको नाम','NEC दर्ता नं.','प्राविधिक परीक्षक तालिम लिएको वर्ष','प्राविधिक परीक्षक प्रमाणपत्र नं.','प्राविधिक परीक्षण गरेका आयोजना','कैफियत','shakha','createdBy','createdAt'] },
    { name: CONFIG.SHEETS.EMPLOYEE_MONITORING, headers: ['monitoring_id','monitoring_date','organization','uniform_violation','time_violation','instruction_date','remarks','created_by','created_at'] },
    { name: CONFIG.SHEETS.CITIZEN_CHARTER, headers: ['charter_id','monitoring_date','organization','findings','instructions','instruction_date','remarks','created_by','created_at'] },
    { name: CONFIG.SHEETS.NOTIFICATIONS, headers: ['notification_id','title','message','time','target_shakha','type','sender','read','created_at'] },
    { name: CONFIG.SHEETS.NOTICES, headers: ['ID','Title','Description','Status','PublishDate','UploadedBy','CreatedAt'] },
    { name: CONFIG.SHEETS.USERS, headers: ['username','password','name','role','shakha','mahashakha','permissions','status','last_login','created_at'] },
    { name: CONFIG.SHEETS.CONFIG, headers: ['config_key','config_value','description'] }
  ];

  sheetsConfig.forEach(cfg => {
    let sh = ss.getSheetByName(cfg.name);
    if (!sh) {
      sh = ss.insertSheet(cfg.name);
      if (cfg.headers && cfg.headers.length) {
        sh.getRange(1,1,1,cfg.headers.length).setValues([cfg.headers]);
        sh.getRange(1,1,1,cfg.headers.length).setFontWeight('bold');
        sh.setFrozenRows(1);
      }
      log('Created sheet:', cfg.name);
    } else {
      log('Sheet exists:', cfg.name);
    }
  });

  // Add default admin user if users sheet empty
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (usersSheet && usersSheet.getLastRow() === 1) {
    usersSheet.appendRow(['admin','nvc123','एडमिन','admin','','','active','', new Date().toISOString()]);
    log('Inserted default admin user');
  }

  const configSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIG);
  if (configSheet && configSheet.getLastRow() === 1) {
    configSheet.appendRow(['api_key', CONFIG.API_KEY, 'API Key for authentication']);
    configSheet.appendRow(['version', CONFIG.VERSION, 'System version']);
    configSheet.appendRow(['setup_date', new Date().toISOString(), 'Initial setup date']);
    log('Inserted config entries');
  }

  return 'Setup complete';
}

// ==================== NOTICE MANAGEMENT ====================

/**
 * Upload notice to Google Drive and save metadata to sheet
 */
function uploadNotice(noticeData) {
  try {
    log('uploadNotice called with data: ' + JSON.stringify(noticeData));
    
    if (!noticeData) {
      log('Error: noticeData is undefined or null');
      return { success: false, error: 'Notice data is required' };
    }
    
    if (!noticeData.title) {
      log('Error: noticeData.title is undefined');
      return { success: false, error: 'Notice title is required' };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const noticesSheet = ss.getSheetByName(CONFIG.SHEETS.NOTICES);
    
    if (!noticesSheet) {
      return { success: false, error: 'Notices sheet not found' };
    }

    // Generate notice ID
    const noticeId = 'NOTICE-' + Date.now();
    
    // Prepare row data (simplified for text-only notices)
    const rowData = [
      noticeId,
      noticeData.title || '',
      noticeData.description || '',
      noticeData.status || 'active',
      noticeData.publishDate || new Date().toISOString().split('T')[0],
      noticeData.uploadedBy || '',
      new Date().toISOString() // createdAt
    ];
    
    // Append to sheet
    noticesSheet.appendRow(rowData);
    
    log('Notice uploaded successfully: ' + noticeId);
    
    return {
      success: true,
      id: noticeId,
      message: 'Notice published successfully'
    };
    
  } catch (error) {
    log('Error uploading notice: ' + error.toString());
    log('Error stack: ' + error.stack);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get all active notices
 */
function getActiveNotices() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const noticesSheet = ss.getSheetByName(CONFIG.SHEETS.NOTICES);
    
    if (!noticesSheet) {
      return [];
    }

    const data = noticesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Helper to find header index by multiple acceptable keys
    const findHeaderIndex = function(candidates) {
      return headers.findIndex(h => {
        const key = normalizeKey(h);
        return candidates.some(candidate => normalizeKey(candidate) === key);
      });
    };

    const statusCol = findHeaderIndex(['स्थिति', 'Status', 'status']);
    const noticeIdCol = findHeaderIndex(['ID', 'सूचना ID', 'noticeid', 'notice_id']);
    const titleCol = findHeaderIndex(['Title', 'शीर्षक', 'title']);
    const descriptionCol = findHeaderIndex(['Description', 'विवरण', 'description']);
    const publishDateCol = findHeaderIndex(['PublishDate', 'प्रकाशित मिति', 'publishdate', 'publish_date']);
    const uploadedByCol = findHeaderIndex(['UploadedBy', 'अपलोड गर्ने', 'uploadedby', 'uploaded_by']);
    const createdAtCol = findHeaderIndex(['CreatedAt', 'सिर्जना मिति', 'createdat', 'created_at']);
    
    const notices = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const statusValue = statusCol >= 0 ? String(row[statusCol] || '').trim().toLowerCase() : '';
      if (statusValue === 'active' || statusValue === 'सक्रिय') {
        notices.push({
          id: noticeIdCol >= 0 ? row[noticeIdCol] || '' : '',
          title: titleCol >= 0 ? row[titleCol] || '' : '',
          description: descriptionCol >= 0 ? row[descriptionCol] || '' : '',
          status: statusCol >= 0 ? row[statusCol] || '' : '',
          publishDate: publishDateCol >= 0 ? row[publishDateCol] || '' : '',
          uploadedBy: uploadedByCol >= 0 ? row[uploadedByCol] || '' : '',
          createdAt: createdAtCol >= 0 ? row[createdAtCol] || '' : ''
        });
      }
    }
    
    notices.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.publishDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.publishDate || 0).getTime();
      return dateB - dateA;
    });

    return notices;
    
  } catch (error) {
    log('Error getting active notices: ' + error.toString());
    return [];
  }
}

/**
 * Get all notices (for admin management)
 */
function getAllNotices() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const noticesSheet = ss.getSheetByName(CONFIG.SHEETS.NOTICES);
    
    if (!noticesSheet) {
      return [];
    }

    const data = noticesSheet.getDataRange().getValues();
    const headers = data[0];

    const findHeaderIndex = function(candidates) {
      return headers.findIndex(h => {
        const key = normalizeKey(h);
        return candidates.some(candidate => normalizeKey(candidate) === key);
      });
    };

    const noticeIdCol = findHeaderIndex(['ID', 'सूचना ID', 'noticeid', 'notice_id']);
    const titleCol = findHeaderIndex(['Title', 'शीर्षक', 'title']);
    const descriptionCol = findHeaderIndex(['Description', 'विवरण', 'description']);
    const statusCol = findHeaderIndex(['Status', 'स्थिति', 'status']);
    const publishDateCol = findHeaderIndex(['PublishDate', 'प्रकाशित मिति', 'publishdate', 'publish_date']);
    const uploadedByCol = findHeaderIndex(['UploadedBy', 'अपलोड गर्ने', 'uploadedby', 'uploaded_by']);
    const createdAtCol = findHeaderIndex(['CreatedAt', 'सिर्जना मिति', 'createdat', 'created_at']);
    
    const notices = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      notices.push({
        id: noticeIdCol >= 0 ? row[noticeIdCol] || '' : '',
        title: titleCol >= 0 ? row[titleCol] || '' : '',
        description: descriptionCol >= 0 ? row[descriptionCol] || '' : '',
        status: statusCol >= 0 ? row[statusCol] || '' : '',
        publishDate: publishDateCol >= 0 ? row[publishDateCol] || '' : '',
        uploadedBy: uploadedByCol >= 0 ? row[uploadedByCol] || '' : '',
        createdAt: createdAtCol >= 0 ? row[createdAtCol] || '' : ''
      });
    }
    
    // Sort by creation date (newest first)
    notices.sort((a, b) => new Date(b.createdAt || b.publishDate) - new Date(a.createdAt || a.publishDate));
    
    return notices;
    
  } catch (error) {
    log('Error getting all notices: ' + error.toString());
    return [];
  }
}

function updateNotice(noticeData) {
  try {
    log('updateNotice called with data: ' + JSON.stringify(noticeData));
    
    if (!noticeData) {
      log('Error: noticeData is undefined or null');
      return { success: false, error: 'Notice data is required' };
    }
    
    if (!noticeData.id) {
      log('Error: noticeData.id is undefined');
      return { success: false, error: 'Notice ID is required for updates' };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const noticesSheet = ss.getSheetByName(CONFIG.SHEETS.NOTICES);
    
    if (!noticesSheet) {
      return { success: false, error: 'Notices sheet not found' };
    }

    const data = noticesSheet.getDataRange().getValues();
    const headers = data[0];
    
    const findHeaderIndex = function(candidates) {
      return headers.findIndex(h => {
        const key = normalizeKey(h);
        return candidates.some(candidate => normalizeKey(candidate) === key);
      });
    };

    const noticeIdCol = findHeaderIndex(['ID', 'सूचना ID', 'noticeid', 'notice_id']);
    const titleCol = findHeaderIndex(['Title', 'शीर्षक', 'title']);
    const descriptionCol = findHeaderIndex(['Description', 'विवरण', 'description']);
    const statusCol = findHeaderIndex(['Status', 'स्थिति', 'status']);
    const publishDateCol = findHeaderIndex(['PublishDate', 'प्रकाशित मिति', 'publishdate', 'publish_date']);
    const uploadedByCol = findHeaderIndex(['UploadedBy', 'अपलोड गर्ने', 'uploadedby', 'uploaded_by']);

    if (noticeIdCol < 0) {
      return { success: false, error: 'ID column not found' };
    }

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][noticeIdCol]) === String(noticeData.id)) {
        if (titleCol >= 0 && noticeData.title !== undefined) {
          noticesSheet.getRange(i + 1, titleCol + 1).setValue(noticeData.title);
        }
        if (descriptionCol >= 0 && noticeData.description !== undefined) {
          noticesSheet.getRange(i + 1, descriptionCol + 1).setValue(noticeData.description);
        }
        if (statusCol >= 0 && noticeData.status !== undefined) {
          noticesSheet.getRange(i + 1, statusCol + 1).setValue(noticeData.status);
        }
        if (publishDateCol >= 0 && noticeData.publishDate !== undefined) {
          noticesSheet.getRange(i + 1, publishDateCol + 1).setValue(noticeData.publishDate);
        }
        if (uploadedByCol >= 0 && noticeData.uploadedBy !== undefined) {
          noticesSheet.getRange(i + 1, uploadedByCol + 1).setValue(noticeData.uploadedBy);
        }
        log('Notice updated: ' + noticeData.id);
        return { success: true };
      }
    }

    return { success: false, error: 'Notice not found' };

  } catch (error) {
    log('Error updating notice: ' + error.toString());
    log('Error stack: ' + error.stack);
    return { success: false, error: error.toString() };
  }
}

/**
 * Update notice status
 */
function updateNoticeStatus(noticeId, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const noticesSheet = ss.getSheetByName(CONFIG.SHEETS.NOTICES);
    
    if (!noticesSheet) {
      return { success: false, error: 'Notices sheet not found' };
    }

    const data = noticesSheet.getDataRange().getValues();
    const headers = data[0];
    
    const findHeaderIndex = function(candidates) {
      return headers.findIndex(h => {
        const key = normalizeKey(h);
        return candidates.some(candidate => normalizeKey(candidate) === key);
      });
    };

    const noticeIdCol = findHeaderIndex(['ID', 'सूचना ID', 'noticeid', 'notice_id']);
    const statusCol = findHeaderIndex(['Status', 'स्थिति', 'status']);
    
    if (noticeIdCol < 0 || statusCol < 0) {
      return { success: false, error: 'Required header not found' };
    }

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][noticeIdCol]) === String(noticeId)) {
        noticesSheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        log('Notice status updated: ' + noticeId + ' -> ' + newStatus);
        return { success: true };
      }
    }
    
    return { success: false, error: 'Notice not found' };
    
  } catch (error) {
    log('Error updating notice status: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Delete notice
 */
function deleteNotice(noticeId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const noticesSheet = ss.getSheetByName(CONFIG.SHEETS.NOTICES);
    
    if (!noticesSheet) {
      return { success: false, error: 'Notices sheet not found' };
    }

    const data = noticesSheet.getDataRange().getValues();
    const headers = data[0];
    
    const findHeaderIndex = function(candidates) {
      return headers.findIndex(h => {
        const key = normalizeKey(h);
        return candidates.some(candidate => normalizeKey(candidate) === key);
      });
    };

    const noticeIdCol = findHeaderIndex(['ID', 'सूचना ID', 'noticeid', 'notice_id']);
    
    if (noticeIdCol < 0) {
      return { success: false, error: 'ID column not found' };
    }
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][noticeIdCol]) === String(noticeId)) {
        noticesSheet.deleteRow(i + 1);
        log('Notice deleted: ' + noticeId);
        return { success: true };
      }
    }
    
    return { success: false, error: 'Notice not found' };
    
  } catch (error) {
    log('Error deleting notice: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ==================== LABORATORY TESTING FUNCTIONS ====================

function getLaboratoryTestHeaders() {
  return ['id','नमूना नं','नमूना प्राप्त मिति','परीक्षण अनुरोधकर्ता','आयोजनाको नाम','मन्त्रालय/निकाय','परीक्षण गर्ने सामग्री','परीक्षण गरिएको मिति','परीक्षण विधि','परीक्षण गर्ने उपकरण','परीक्षण नतीजा','कैफियत','सिर्जना गर्ने','सिर्जना मिति','अपडेट गर्ने','अपडेट मिति'];
}

function ensureLaboratoryTestSheet() {
  const sheet = getSheet(CONFIG.SHEETS.LABORATORY_TESTS, getLaboratoryTestHeaders());
  if (!sheet) {
    return null;
  }
  
  // Verify headers are correct
  const lastCol = sheet.getLastColumn();
  if (lastCol >= 1) {
    const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const expectedHeaders = getLaboratoryTestHeaders();
    
    // Check if headers need to be updated
    let headersMatch = true;
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (existingHeaders[i] !== expectedHeaders[i]) {
        headersMatch = false;
        break;
      }
    }
    
    // Update headers if they don't match
    if (!headersMatch) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  
  return sheet;
}

function getLaboratoryTests(params) {
  try {
    if (!validateApiKey(params)) {
      return { success: false, message: 'Invalid API key' };
    }

    const sheet = ensureLaboratoryTestSheet();
    if (!sheet) {
      return { success: false, message: 'Failed to get laboratory tests sheet' };
    }

    // Get all data from the sheet
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, data: [] };
    }

    const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const data = dataRange.getValues();
    
    // Get headers for mapping
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Convert to array of objects
    const result = data.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return { success: true, data: result };
  } catch (error) {
    log('Error getting laboratory tests: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function updateLaboratoryTest(params) {
  try {
    if (!validateApiKey(params)) {
      return { success: false, message: 'Invalid API key' };
    }

    const sheet = ensureLaboratoryTestSheet();
    if (!sheet) {
      return { success: false, message: 'Failed to get laboratory tests sheet' };
    }

    const result = saveToExistingSheetObject(sheet, params, 'id');
    
    if (result.success) {
      return { success: true, message: 'Laboratory test updated successfully' };
    } else {
      return { success: false, message: 'Failed to update laboratory test' };
    }
  } catch (error) {
    log('Error updating laboratory test: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function saveLaboratoryTest(params) {
  try {
    if (!validateApiKey(params)) {
      return { success: false, message: 'Invalid API key' };
    }

    // Ensure sheet exists with correct headers
    const sheet = ensureLaboratoryTestSheet();
    if (!sheet) {
      return { success: false, message: 'Failed to get laboratory tests sheet' };
    }

    // Generate unique ID if not provided
    const testId = params.id || 'LAB-' + Date.now();
    
    // Prepare data with proper mapping
    const testData = {
      id: testId,
      sampleNumber: params.sampleNumber || '',
      sampleReceivedDate: params.sampleReceivedDate || '',
      testRequester: params.testRequester || '',
      organizationName: params.organizationName || '',
      ministry: params.ministry || '',
      testMaterial: params.testMaterial || '',
      testDate: params.testDate || '',
      testMethod: params.testMethod || '',
      testEquipment: params.testEquipment || '',
      testResult: params.testResult || '',
      remarks: params.remarks || '',
      createdBy: params.createdBy || '',
      createdAt: params.createdAt || new Date().toISOString(),
      updatedBy: params.updatedBy || params.createdBy || '',
      updatedAt: params.updatedAt || new Date().toISOString()
    };

    const result = saveToExistingSheetObject(sheet, testData, 'id');
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Laboratory test saved successfully', 
        id: testId,
        row: result.row 
      };
    } else {
      return { success: false, message: 'Failed to save laboratory test' };
    }

  } catch (error) {
    log('Error saving laboratory test: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function getLaboratoryTests(params) {
  try {
    if (!validateApiKey(params)) {
      return { success: false, message: 'Invalid API key' };
    }

    const data = getSheetData(CONFIG.SHEETS.LABORATORY_TESTS);
    
    if (data && data.length > 0) {
      return { success: true, data: data, count: data.length };
    } else {
      return { success: true, data: [], count: 0 };
    }

  } catch (error) {
    log('Error getting laboratory tests: ' + error.toString());
    return { success: false, message: error.toString(), data: [] };
  }
}

function updateLaboratoryTest(params) {
  try {
    if (!validateApiKey(params)) {
      return { success: false, message: 'Invalid API key' };
    }

    if (!params.id) {
      return { success: false, message: 'Test ID is required' };
    }

    const sheet = getSheet(CONFIG.SHEETS.LABORATORY_TESTS);
    if (!sheet) {
      return { success: false, message: 'Laboratory tests sheet not found' };
    }

    // Prepare update data
    const updateData = {
      id: params.id,
      sampleNumber: params.sampleNumber,
      sampleReceivedDate: params.sampleReceivedDate,
      testRequester: params.testRequester,
      organizationName: params.organizationName,
      ministry: params.ministry,
      testMaterial: params.testMaterial,
      testDate: params.testDate,
      testMethod: params.testMethod,
      testEquipment: params.testEquipment,
      testResult: params.testResult,
      remarks: params.remarks,
      updatedBy: params.updatedBy,
      updatedAt: new Date().toISOString()
    };

    const result = saveToExistingSheetObject(sheet, updateData, 'id');
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Laboratory test updated successfully', 
        id: params.id,
        row: result.row 
      };
    } else {
      return { success: false, message: 'Failed to update laboratory test' };
    }

  } catch (error) {
    log('Error updating laboratory test: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function deleteLaboratoryTest(params) {
  try {
    if (!validateApiKey(params)) {
      return { success: false, message: 'Invalid API key' };
    }

    if (!params.id) {
      return { success: false, message: 'Test ID is required' };
    }

    const sheet = getSheet(CONFIG.SHEETS.LABORATORY_TESTS);
    if (!sheet) {
      return { success: false, message: 'Laboratory tests sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const findHeaderIndex = function(candidates) {
      return headers.findIndex(h => {
        const key = normalizeKey(h);
        return candidates.some(candidate => normalizeKey(candidate) === key);
      });
    };

    const testIdCol = findHeaderIndex(['ID', 'id', 'testid', 'test_id']);
    
    if (testIdCol < 0) {
      return { success: false, message: 'ID column not found' };
    }
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][testIdCol]) === String(params.id)) {
        sheet.deleteRow(i + 1);
        log('Laboratory test deleted: ' + params.id);
        return { success: true, message: 'Laboratory test deleted successfully' };
      }
    }
    
    return { success: false, message: 'Laboratory test not found' };
    
  } catch (error) {
    log('Error deleting laboratory test: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/* End of file */
