/**
 * Form Survey Lokasi — Google Apps Script Backend (Split Sheets Design)
 * Spreadsheet ID: 1dd4qZjZ-tqVnM48f74zAkiouKZblrKgWoDkVAOzEAys
 * Sheets: Permohonan, Survey
 *
 * Deploy: Extensions > Apps Script > Deploy > New deployment
 * Type: Web App | Execute as: Me | Who has access: Anyone
 */

// ─── KONFIGURASI ─────────────────────────────────────────────────────────────
var SPREADSHEET_ID  = '1dd4qZjZ-tqVnM48f74zAkiouKZblrKgWoDkVAOzEAys';
var DRIVE_FOLDER_ID = '1ebRlXV1hV6oeAo-VAGNneLYDeTn-P_jF';

// Skema kolom untuk Sheet Permohonan (22 Kolom)
var HEADERS_PERMOHONAN = [
  'STATUS_PERMOHONAN', 'IDPEL', 'NAMA', 'ALAMAT', 'TARIF', 'DAYA',
  'MEDIA_PERMOHONAN', 'TANGGAL_PERMOHONAN', 'NAMA_PEMOHON', 'ALAMAT_PEMOHON',
  'NIK_PEMOHON', 'TARIF_BARU', 'DAYA_BARU', 'STATUS_PERSIL',
  'NIK_PELANGGAN', 'NO_TELEPON', 'PERUNTUKAN_LISTRIK', 'NAMA_LAPANGAN', 'ALAMAT_LAPANGAN',
  'KTP_ADA', 'IJIN_ADA', 'FOTO_ADA'
];

// Skema kolom untuk Sheet Survey (44 Kolom)
var HEADERS_SURVEY = [
  'STATUS_SURVEY', 'IDPEL', 'TANGGAL_SURVEY', 'NO_SURAT_TUGAS', 'TANGGAL_SURAT_TUGAS', 'NO_BA',
  'NO_TIANG', 'LAT', 'LONG', 'FOTO_RUMAH', 'DOKUMENTASI',
  'LETAK_APP', 'MCB_MERK', 'MCB_TAHUN', 'MCB_AMPERE',
  'METER_MERK', 'METER_TYPE', 'METER_TAHUN', 'METER_NO', 'METER_KONSTANTA',
  'METER_TEGANGAN', 'METER_ARUS', 'METER_STAND_LWBP', 'METER_STAND_WBP',
  'METER_TRAFO', 'METER_FAKTOR_KALI',
  'LETAK_SLTR', 'JENIS_SLTR', 'PANJANG_SLTR', 'FASA_TERSAMBUNG',
  'TEGANGAN_NOMINAL', 'PENGUKURAN', 'TRAFO_PLN', 'SEGEL_OK', 'PENGAMBILAN_DARI',
  'KESIMPULAN_SPI', 'PERUNTUKAN_ON_SITE', 'KESESUAIAN', 'TINDAKLANJUT',
  'INVENTARISASI_RT', 'INVENTARISASI_PL', 'PEMAKAIAN', 'JAM_NYALA', 'TARIF_KOREKSI'
];

// Skema kolom untuk Sheet Users
var HEADERS_USERS = ['username', 'password', 'role', 'status', 'nama'];

// ─── RESPONSE HELPER ─────────────────────────────────────────────────────────

function makeResponse(data, callbackName) {
  var json = JSON.stringify(data);
  if (callbackName) {
    return ContentService
      .createTextOutput(callbackName + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── GET HANDLER ─────────────────────────────────────────────────────────────

function doGet(e) {
  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  try {
    initDatabase();

    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getPermohonans';
    
    // Auth Validation for GET requests
    var token = (e && e.parameter && e.parameter.token) ? e.parameter.token : null;
    var userPayload = verifyToken(token);
    if (!userPayload) {
      return makeResponse({ status: 'unauthorized', message: 'Sesi habis atau tidak valid' }, callback);
    }

    var result;

    if (action === 'getPermohonans') {
      result = buildGetPermohonans(e);
    } else if (action === 'getSurveys') {
      result = buildGetSurveys(e);
    } else if (action === 'getStats') {
      result = buildGetStats();
    } else if (action === 'getById') {
      result = buildGetById(e);
    } else if (action === 'getUsers') {
      if (userPayload.role !== 'admin') {
        result = { status: 'forbidden', message: 'Akses ditolak: Hanya administrator yang dapat melihat user' };
      } else {
        result = buildGetUsers();
      }
    } else {
      result = { status: 'error', message: 'Unknown action: ' + action };
    }

    return makeResponse(result, callback);
  } catch (err) {
    return makeResponse({ status: 'error', message: err.toString() }, callback);
  }
}

// ─── POST HANDLER ────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    initDatabase();

    if (!e || !e.postData || !e.postData.contents) {
      return makeResponse({ status: 'error', message: 'Tidak ada data POST' });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return makeResponse({ status: 'error', message: 'Body bukan JSON: ' + parseErr.toString() });
    }

    var action = body.action;
    var result;

    // Login does not require token validation
    if (action === 'login') {
      result = doLogin(body.username, body.password);
      return makeResponse(result);
    }

    // Auth Validation for other POST requests
    var token = body.token;
    var userPayload = verifyToken(token);
    if (!userPayload) {
      return makeResponse({ status: 'unauthorized', message: 'Sesi habis atau tidak valid' });
    }

    if (action === 'savePermohonan') {
      result = doSavePermohonan(body.data);
    } else if (action === 'saveSurvey') {
      result = doSaveSurvey(body.data);
    } else if (action === 'deletePermohonan') {
      if (userPayload.role !== 'admin') {
        result = { status: 'forbidden', message: 'Akses ditolak: Hanya administrator yang dapat menghapus permohonan' };
      } else {
        result = doDeletePermohonan(body.idpel);
      }
    } else if (action === 'uploadPhoto') {
      result = doUploadPhoto(body);
    } else if (action === 'saveUser') {
      if (userPayload.role !== 'admin') {
        result = { status: 'forbidden', message: 'Akses ditolak: Hanya administrator yang dapat mengelola user' };
      } else {
        result = doSaveUser(body.data);
      }
    } else if (action === 'deleteUser') {
      if (userPayload.role !== 'admin') {
        result = { status: 'forbidden', message: 'Akses ditolak: Hanya administrator yang dapat mengelola user' };
      } else {
        result = doDeleteUser(body.username, userPayload.username);
      }
    } else {
      result = { status: 'error', message: 'Unknown action: ' + action };
    }

    return makeResponse(result);
  } catch (err) {
    return makeResponse({ status: 'error', message: err.toString() });
  }
}

// ─── SHEET INITIALIZATION & DATA MIGRATION ────────────────────────────────────

function initDatabase() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  var permohonanSheet = ss.getSheetByName('Permohonan');
  var surveySheet = ss.getSheetByName('Survey');
  var usersSheet = ss.getSheetByName('Users');
  
  var isNewPermohonan = false;
  var isNewSurvey = false;
  
  if (!permohonanSheet) {
    permohonanSheet = ss.insertSheet('Permohonan');
    permohonanSheet.appendRow(HEADERS_PERMOHONAN);
    permohonanSheet.setFrozenRows(1);
    isNewPermohonan = true;
  }
  
  if (!surveySheet) {
    surveySheet = ss.insertSheet('Survey');
    surveySheet.appendRow(HEADERS_SURVEY);
    surveySheet.setFrozenRows(1);
    isNewSurvey = true;
  }

  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow(HEADERS_USERS);
    usersSheet.setFrozenRows(1);
    // Seed default admin
    var hashedAdminPass = hashPassword('admin');
    usersSheet.appendRow(['admin', hashedAdminPass, 'admin', 'aktif', 'Administrator']);
  }
  
  // Sync column ordering on existing sheets to match new headers
  if (!isNewPermohonan) {
    updateSheetHeaders(permohonanSheet, HEADERS_PERMOHONAN);
    cleanAllDateColumns(permohonanSheet, HEADERS_PERMOHONAN);
  }
  if (!isNewSurvey) {
    updateSheetHeaders(surveySheet, HEADERS_SURVEY);
    cleanAllDateColumns(surveySheet, HEADERS_SURVEY);
  }

  // Migrasi otomatis dari sheet 'Pelanggan' lama jika ada data
  var oldSheet = ss.getSheetByName('Pelanggan');
  if (oldSheet && (isNewPermohonan || permohonanSheet.getLastRow() <= 1) && oldSheet.getLastRow() > 1) {
    migrateOldData(oldSheet, permohonanSheet, surveySheet);
  }
}

function updateSheetHeaders(sheet, expectedHeaders) {
  if (!sheet || sheet.getLastRow() < 1) return;
  var actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (actualHeaders.length === 0 || actualHeaders[0] !== expectedHeaders[0]) {
    var headerMap = {};
    for (var h = 0; h < actualHeaders.length; h++) {
      headerMap[String(actualHeaders[h]).trim()] = h;
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var allData = sheet.getRange(2, 1, lastRow - 1, actualHeaders.length).getValues();
      var reorderedData = [];
      for (var r = 0; r < allData.length; r++) {
        var oldRow = allData[r];
        var newRow = [];
        for (var c = 0; c < expectedHeaders.length; c++) {
          var key = expectedHeaders[c];
          var oldIdx = headerMap[key];
          newRow.push(oldIdx !== undefined && oldIdx < oldRow.length ? oldRow[oldIdx] : '');
        }
        reorderedData.push(newRow);
      }
      sheet.clear();
      sheet.appendRow(expectedHeaders);
      sheet.setFrozenRows(1);
      sheet.getRange(2, 1, reorderedData.length, expectedHeaders.length).setValues(reorderedData);
    } else {
      sheet.clear();
      sheet.appendRow(expectedHeaders);
      sheet.setFrozenRows(1);
    }
  }
}

function migrateOldData(oldSheet, permohonanSheet, surveySheet) {
  var oldLastRow = oldSheet.getLastRow();
  var oldValues = oldSheet.getRange(2, 1, oldLastRow - 1, 23).getValues();
  
  var oldHeaders = [
    'IDPEL', 'Nama', 'ALAMAT', 'Tarif', 'Daya', 'NO TIANG',
    'LAT', 'LONG', 'FOTO RUIMAH', 'MERK METER', 'TYPE METER',
    'TAHUN', 'NO METER', 'PEMAKAIAN', 'JAM NYALA', 'TEGANGAN',
    'ARUS', 'TARIF KOREKSI', 'KESIMPULAN SPI', 'DOKUMENTASI',
    'PERUNTUKAN ON SITE', 'KESESUAIAN', 'TINDAKLANJUT'
  ];
  
  for (var r = 0; r < oldValues.length; r++) {
    var oldRow = oldValues[r];
    var data = {};
    for (var h = 0; h < oldHeaders.length; h++) {
      data[oldHeaders[h]] = oldRow[h];
    }
    
    if (!data.IDPEL || String(data.IDPEL).trim() === '') continue;
    
    // 1. Data Permohonan
    var pData = {
      'IDPEL': String(data.IDPEL),
      'NAMA': data.Nama,
      'ALAMAT': data.ALAMAT,
      'TARIF': data.Tarif,
      'DAYA': data.Daya,
      'MEDIA_PERMOHONAN': 'CC123',
      'TANGGAL_PERMOHONAN': new Date().toISOString().slice(0, 10),
      'NAMA_PEMOHON': data.Nama,
      'ALAMAT_PEMOHON': data.ALAMAT,
      'NIK_PEMOHON': '3373000000000000',
      'TARIF_BARU': data['TARIF KOREKSI'] || '',
      'DAYA_BARU': data.Daya ? data.Daya + ' VA' : '',
      'STATUS_PERSIL': 'Milik Sendiri',
      'NIK_PELANGGAN': '3373000000000000',
      'NO_TELEPON': '',
      'KTP_ADA': 'Ada',
      'IJIN_ADA': 'Tidak Ada',
      'FOTO_ADA': 'Ada',
      'STATUS_PERMOHONAN': 'Selesai'
    };
    
    var pRow = HEADERS_PERMOHONAN.map(function(h) { return pData[h] || ''; });
    permohonanSheet.appendRow(pRow);
    
    // 2. Data Survey
    var sData = {
      'IDPEL': String(data.IDPEL),
      'TANGGAL_SURVEY': new Date().toISOString().slice(0, 10),
      'NO_SURAT_TUGAS': '0005.STg/SDM.02/07/F03110000/2026',
      'TANGGAL_SURAT_TUGAS': '05 Januari 2026',
      'NO_BA': '52351-' + String(data.IDPEL).slice(-7),
      'NO_TIANG': data['NO TIANG'],
      'LAT': data.LAT,
      'LONG': data.LONG,
      'FOTO_RUMAH': data['FOTO RUIMAH'],
      'DOKUMENTASI': data.DOKUMENTASI,
      'LETAK_APP': 'Bangunan bagian luar',
      'MCB_MERK': 'SND',
      'MCB_TAHUN': '2023',
      'MCB_AMPERE': '',
      'METER_MERK': data['MERK METER'],
      'METER_TYPE': data['TYPE METER'],
      'METER_TAHUN': data.TAHUN,
      'METER_NO': data['NO METER'],
      'METER_KONSTANTA': '',
      'METER_TEGANGAN': data.TEGANGAN,
      'METER_ARUS': data.ARUS,
      'METER_STAND_LWBP': '',
      'METER_STAND_WBP': '',
      'METER_TRAFO': '',
      'METER_FAKTOR_KALI': '',
      'LETAK_SLTR': '',
      'JENIS_SLTR': '',
      'PANJANG_SLTR': '',
      'FASA_TERSAMBUNG': '',
      'TEGANGAN_NOMINAL': '',
      'PENGUKURAN': '',
      'TRAFO_PLN': '',
      'SEGEL_OK': '',
      'PENGAMBILAN_DARI': '',
      'KESIMPULAN_SPI': data['KESIMPULAN SPI'],
      'PERUNTUKAN_ON_SITE': data['PERUNTUKAN ON SITE'],
      'KESESUAIAN': data.KESESUAIAN,
      'TINDAKLANJUT': data.TINDAKLANJUT,
      'INVENTARISASI_RT': '[]',
      'INVENTARISASI_PL': '[]',
      'PEMAKAIAN': data.PEMAKAIAN,
      'JAM_NYALA': data['JAM NYALA'],
      'TARIF_KOREKSI': data['TARIF KOREKSI'] || '',
      'STATUS_SURVEY': data['KESIMPULAN SPI'] ? 'Selesai' : 'Belum'
    };
    
    var sRow = HEADERS_SURVEY.map(function(h) { return sData[h] || ''; });
    surveySheet.appendRow(sRow);
  }
}

// ─── API BUILD METHODS (GET) ──────────────────────────────────────────────────

function buildGetPermohonans(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Permohonan');
  var list = getAllDataFromSheet(sheet, HEADERS_PERMOHONAN);

  // Filters
  var search = (e && e.parameter && e.parameter.search) ? e.parameter.search.toLowerCase() : '';
  var status = (e && e.parameter && e.parameter.statusPermohonan) ? e.parameter.statusPermohonan : '';

  var filtered = list;
  if (search) {
    filtered = filtered.filter(function(row) {
      return (String(row.IDPEL || '')).toLowerCase().indexOf(search) !== -1 ||
             (String(row.NAMA || '')).toLowerCase().indexOf(search) !== -1 ||
             (String(row.ALAMAT || '')).toLowerCase().indexOf(search) !== -1;
    });
  }
  if (status) {
    filtered = filtered.filter(function(row) { return row.STATUS_PERMOHONAN === status; });
  }

  // Sorting
  var sortBy = (e && e.parameter && e.parameter.sortBy) ? e.parameter.sortBy : '';
  var sortOrder = (e && e.parameter && e.parameter.sortOrder) ? e.parameter.sortOrder : 'ASC';
  if (sortBy) {
    filtered.sort(function(a, b) {
      var valA = getComparableValue(a[sortBy]);
      var valB = getComparableValue(b[sortBy]);
      if (valA < valB) return sortOrder === 'DESC' ? 1 : -1;
      if (valA > valB) return sortOrder === 'DESC' ? -1 : 1;
      return 0;
    });
  }

  // Pagination
  var page = parseInt((e && e.parameter && e.parameter.page) ? e.parameter.page : '1', 10) || 1;
  var limit = parseInt((e && e.parameter && e.parameter.limit) ? e.parameter.limit : '50', 10) || 50;
  var total = filtered.length;
  var start = (page - 1) * limit;
  var paged = filtered.slice(start, start + limit);

  return {
    status: 'success',
    data: paged,
    meta: { total: total, page: page, limit: limit, totalPages: Math.ceil(total / limit) || 1 }
  };
}

function buildGetSurveys(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var pSheet = ss.getSheetByName('Permohonan');
  var sSheet = ss.getSheetByName('Survey');

  var pList = getAllDataFromSheet(pSheet, HEADERS_PERMOHONAN);
  var sList = getAllDataFromSheet(sSheet, HEADERS_SURVEY);

  // Map Survey by IDPEL
  var sMap = {};
  for (var i = 0; i < sList.length; i++) {
    sMap[String(sList[i].IDPEL)] = sList[i];
  }

  // Auto-sync: check if any Permohonan doesn't have a Survey row, and append it
  var missingIds = [];
  for (var j = 0; j < pList.length; j++) {
    var idpel = String(pList[j].IDPEL);
    if (!sMap[idpel]) {
      missingIds.push(idpel);
    }
  }

  if (missingIds.length > 0) {
    for (var m = 0; m < missingIds.length; m++) {
      var newRow = HEADERS_SURVEY.map(function(h) {
        if (h === 'IDPEL') return missingIds[m];
        if (h === 'STATUS_SURVEY') return 'Belum';
        return '';
      });
      sSheet.appendRow(newRow);
    }
    // Re-fetch survey list
    sList = getAllDataFromSheet(sSheet, HEADERS_SURVEY);
    sMap = {};
    for (var i = 0; i < sList.length; i++) {
      sMap[String(sList[i].IDPEL)] = sList[i];
    }
  }

  // Merge: Every Permohonan needs a Survey record (defaults to 'Belum' if not surveyed yet)
  var merged = [];
  for (var j = 0; j < pList.length; j++) {
    var pRow = pList[j];
    var idpel = String(pRow.IDPEL);
    var sRow = sMap[idpel];

    if (!sRow) {
      sRow = {
        'IDPEL': idpel,
        'STATUS_SURVEY': 'Belum'
      };
      for (var k = 0; k < HEADERS_SURVEY.length; k++) {
        var h = HEADERS_SURVEY[k];
        if (sRow[h] === undefined) sRow[h] = '';
      }
    }

    // Merge basic customer info from Permohonan
    var mergedRow = {};
    for (var key in sRow) { mergedRow[key] = sRow[key]; }
    mergedRow['NAMA'] = pRow.NAMA;
    mergedRow['ALAMAT'] = pRow.ALAMAT;
    mergedRow['TARIF'] = pRow.TARIF;
    mergedRow['DAYA'] = pRow.DAYA;
    mergedRow['TARIF_BARU'] = pRow.TARIF_BARU;
    mergedRow['DAYA_BARU'] = pRow.DAYA_BARU;

    merged.push(mergedRow);
  }

  // Filters
  var search = (e && e.parameter && e.parameter.search) ? e.parameter.search.toLowerCase() : '';
  var status = (e && e.parameter && e.parameter.statusSurvey) ? e.parameter.statusSurvey : '';

  var filtered = merged;
  if (search) {
    filtered = filtered.filter(function(row) {
      return (String(row.IDPEL || '')).toLowerCase().indexOf(search) !== -1 ||
             (String(row.NAMA || '')).toLowerCase().indexOf(search) !== -1 ||
             (String(row.ALAMAT || '')).toLowerCase().indexOf(search) !== -1;
    });
  }
  if (status) {
    filtered = filtered.filter(function(row) { return row.STATUS_SURVEY === status; });
  }

  // Sorting
  var sortBy = (e && e.parameter && e.parameter.sortBy) ? e.parameter.sortBy : '';
  var sortOrder = (e && e.parameter && e.parameter.sortOrder) ? e.parameter.sortOrder : 'ASC';
  if (sortBy) {
    filtered.sort(function(a, b) {
      var valA = getComparableValue(a[sortBy]);
      var valB = getComparableValue(b[sortBy]);
      if (valA < valB) return sortOrder === 'DESC' ? 1 : -1;
      if (valA > valB) return sortOrder === 'DESC' ? -1 : 1;
      return 0;
    });
  }

  // Pagination
  var page = parseInt((e && e.parameter && e.parameter.page) ? e.parameter.page : '1', 10) || 1;
  var limit = parseInt((e && e.parameter && e.parameter.limit) ? e.parameter.limit : '50', 10) || 50;
  var total = filtered.length;
  var start = (page - 1) * limit;
  var paged = filtered.slice(start, start + limit);

  return {
    status: 'success',
    data: paged,
    meta: { total: total, page: page, limit: limit, totalPages: Math.ceil(total / limit) || 1 }
  };
}

function buildGetStats() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var pSheet = ss.getSheetByName('Permohonan');
  var sSheet = ss.getSheetByName('Survey');

  var pList = getAllDataFromSheet(pSheet, HEADERS_PERMOHONAN);
  var sList = getAllDataFromSheet(sSheet, HEADERS_SURVEY);

  // Permohonan stats
  var totalPermohonan = pList.length;
  var selesaiPermohonan = 0;
  var draftPermohonan = 0;
  var belumPermohonan = 0;

  var peruntukanDist = {};
  var mediaDist = {};
  var persilDist = {};
  var tarifBaruDist = {};

  for (var i = 0; i < pList.length; i++) {
    var p = pList[i];
    var st = p.STATUS_PERMOHONAN;
    if (st === 'Selesai') selesaiPermohonan++;
    else if (st === 'Draft') draftPermohonan++;
    else belumPermohonan++;

    var peruntukan = p.PERUNTUKAN_LISTRIK || 'Rumah Tinggal';
    peruntukanDist[peruntukan] = (peruntukanDist[peruntukan] || 0) + 1;

    var media = p.MEDIA_PERMOHONAN || 'Lainnya';
    mediaDist[media] = (mediaDist[media] || 0) + 1;

    var persil = p.STATUS_PERSIL || 'Milik Sendiri';
    persilDist[persil] = (persilDist[persil] || 0) + 1;

    var tBaru = p.TARIF_BARU || 'Belum Diisi';
    tarifBaruDist[tBaru] = (tarifBaruDist[tBaru] || 0) + 1;
  }

  // Survey stats & SPI Kesimpulan
  var selesaiSurvey = 0;
  var draftSurvey = 0;
  var belumSurvey = 0;
  var spiDist = { 'Efektif': 0, 'Tidak Efektif': 0, 'Belum Survey': 0 };

  var sMap = {};
  for (var j = 0; j < sList.length; j++) {
    var sObj = sList[j];
    sMap[String(sObj.IDPEL)] = sObj;
  }

  for (var k = 0; k < pList.length; k++) {
    var idpel = String(pList[k].IDPEL);
    var surveyObj = sMap[idpel];
    var status = surveyObj ? surveyObj.STATUS_SURVEY : 'Belum';
    if (status === 'Selesai') selesaiSurvey++;
    else if (status === 'Draft') draftSurvey++;
    else belumSurvey++;

    if (surveyObj && surveyObj.KESIMPULAN_SPI) {
      var spi = surveyObj.KESIMPULAN_SPI;
      spiDist[spi] = (spiDist[spi] || 0) + 1;
    } else {
      spiDist['Belum Survey']++;
    }
  }

  return {
    status: 'success',
    data: {
      permohonan: {
        total: totalPermohonan,
        selesai: selesaiPermohonan,
        draft: draftPermohonan,
        belum: belumPermohonan
      },
      survey: {
        total: pList.length,
        selesai: selesaiSurvey,
        draft: draftSurvey,
        belum: belumSurvey
      },
      distributions: {
        peruntukan: peruntukanDist,
        media: mediaDist,
        persil: persilDist,
        tarifBaru: tarifBaruDist,
        kesimpulanSpi: spiDist
      }
    }
  };
}

function buildGetById(e) {
  var idpel = (e && e.parameter && e.parameter.idpel) ? String(e.parameter.idpel).trim() : null;
  if (!idpel) {
    return { status: 'error', message: 'IDPEL diperlukan' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var pSheet = ss.getSheetByName('Permohonan');
  var sSheet = ss.getSheetByName('Survey');

  var pRowIndex = findRowById(pSheet, idpel);
  var sRowIndex = findRowById(sSheet, idpel);

  if (!pRowIndex) {
    return { status: 'error', message: 'Data permohonan pelanggan tidak ditemukan' };
  }

  // Get data from Permohonan
  var pRowValues = pSheet.getRange(pRowIndex, 1, 1, HEADERS_PERMOHONAN.length).getValues()[0];
  var pObj = {};
  for (var i = 0; i < HEADERS_PERMOHONAN.length; i++) {
    pObj[HEADERS_PERMOHONAN[i]] = cleanCellValue(pRowValues[i], ss);
  }

  // Get data from Survey
  var sObj = {};
  if (sRowIndex) {
    var sRowValues = sSheet.getRange(sRowIndex, 1, 1, HEADERS_SURVEY.length).getValues()[0];
    for (var j = 0; j < HEADERS_SURVEY.length; j++) {
      sObj[HEADERS_SURVEY[j]] = cleanCellValue(sRowValues[j], ss);
    }
  } else {
    // Default blank
    for (var k = 0; k < HEADERS_SURVEY.length; k++) {
      sObj[HEADERS_SURVEY[k]] = HEADERS_SURVEY[k] === 'IDPEL' ? idpel : '';
    }
    sObj.STATUS_SURVEY = 'Belum';
  }

  return {
    status: 'success',
    data: {
      permohonan: pObj,
      survey: sObj
    }
  };
}

// ─── API WRITE METHODS (POST) ─────────────────────────────────────────────────

function doSavePermohonan(data) {
  if (!data || !data.IDPEL) {
    return { status: 'error', message: 'IDPEL wajib diisi' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Permohonan');
  var idpel = String(data.IDPEL).trim();
  var rowIndex = findRowById(sheet, idpel);

  // Set default status if missing
  if (!data.STATUS_PERMOHONAN) {
    data.STATUS_PERMOHONAN = 'Selesai'; // standard default
  }

  var rowValues = HEADERS_PERMOHONAN.map(function(h) {
    var val = data[h];
    if (h.indexOf('TANGGAL') !== -1 && val) {
      val = String(val).trim().split('T')[0];
    }
    return (val !== undefined && val !== null) ? val : '';
  });

  if (rowIndex) {
    for (var i = 0; i < rowValues.length; i++) {
      var cellRange = sheet.getRange(rowIndex, i + 1);
      if (HEADERS_PERMOHONAN[i].indexOf('TANGGAL') !== -1) {
        cellRange.setNumberFormat('@');
      }
      cellRange.setValue(rowValues[i]);
    }
  } else {
    sheet.appendRow(rowValues);
    var newRow = sheet.getLastRow();
    for (var col = 0; col < HEADERS_PERMOHONAN.length; col++) {
      if (HEADERS_PERMOHONAN[col].indexOf('TANGGAL') !== -1) {
        sheet.getRange(newRow, col + 1).setNumberFormat('@');
      }
    }
  }

  // Ensure Survey row exists
  var sSheet = ss.getSheetByName('Survey');
  var sRowIndex = findRowById(sSheet, idpel);
  if (!sRowIndex) {
    var sRowValues = HEADERS_SURVEY.map(function(h) {
      if (h === 'IDPEL') return idpel;
      if (h === 'STATUS_SURVEY') return 'Belum';
      return '';
    });
    sSheet.appendRow(sRowValues);
  }

  return {
    status: 'success',
    message: rowIndex ? 'Data permohonan berhasil diperbarui' : 'Data permohonan baru berhasil didaftarkan',
    data: data
  };
}

function doSaveSurvey(data) {
  if (!data || !data.IDPEL) {
    return { status: 'error', message: 'IDPEL wajib diisi' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Survey');
  var idpel = String(data.IDPEL).trim();
  var rowIndex = findRowById(sheet, idpel);

  if (!data.STATUS_SURVEY) {
    data.STATUS_SURVEY = 'Selesai';
  }

  var rowValues = HEADERS_SURVEY.map(function(h) {
    var val = data[h];
    if (h.indexOf('TANGGAL') !== -1 && val) {
      val = String(val).trim().split('T')[0];
    }
    return (val !== undefined && val !== null) ? val : '';
  });

  if (rowIndex) {
    for (var j = 0; j < rowValues.length; j++) {
      var cellRange = sheet.getRange(rowIndex, j + 1);
      if (HEADERS_SURVEY[j].indexOf('TANGGAL') !== -1) {
        cellRange.setNumberFormat('@');
      }
      cellRange.setValue(rowValues[j]);
    }
    return { status: 'success', message: 'Hasil survey lapangan berhasil diperbarui', data: data };
  } else {
    sheet.appendRow(rowValues);
    var newRow = sheet.getLastRow();
    for (var col = 0; col < HEADERS_SURVEY.length; col++) {
      if (HEADERS_SURVEY[col].indexOf('TANGGAL') !== -1) {
        sheet.getRange(newRow, col + 1).setNumberFormat('@');
      }
    }
    return { status: 'success', message: 'Hasil survey lapangan baru berhasil disimpan', data: data };
  }
}

function doDeletePermohonan(idpel) {
  if (!idpel) {
    return { status: 'error', message: 'IDPEL wajib diisi' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var pSheet = ss.getSheetByName('Permohonan');
  var sSheet = ss.getSheetByName('Survey');

  var pRowIndex = findRowById(pSheet, idpel);
  var sRowIndex = findRowById(sSheet, idpel);

  if (pRowIndex) {
    pSheet.deleteRow(pRowIndex);
  }
  if (sRowIndex) {
    sSheet.deleteRow(sRowIndex);
  }

  return { status: 'success', message: 'Data permohonan dan survey berhasil dihapus' };
}

function doUploadPhoto(body) {
  try {
    var fileName   = body.fileName;
    var mimeType   = body.mimeType;
    var base64Data = body.base64Data;
    var folderType = body.folderType || 'foto_rumah';

    if (!base64Data || !fileName) {
      return { status: 'error', message: 'Data foto tidak lengkap' };
    }

    var now         = new Date();
    var year        = String(now.getFullYear());
    var month       = ('0' + (now.getMonth() + 1)).slice(-2);

    var rootFolder  = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var yearFolder  = getOrCreateFolder(rootFolder, year);
    var monthFolder = getOrCreateFolder(yearFolder, month);
    var typeFolder  = getOrCreateFolder(monthFolder, folderType === 'dokumentasi' ? 'dokumentasi' : 'foto_rumah');

    var blob   = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    var file   = typeFolder.createFile(blob);
    var fileId = file.getId();

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      status:  'success',
      message: 'Foto berhasil diupload',
      data:    {
        fileId:  fileId,
        fileUrl: 'https://drive.google.com/uc?id=' + fileId,
        fileName: fileName
      }
    };
  } catch (err) {
    return { status: 'error', message: 'Upload gagal: ' + err.toString() };
  }
}

// ─── HELPER METHODS ──────────────────────────────────────────────────────────

function cleanCellValue(val, ss) {
  if (val === undefined || val === null) return '';
  if (val instanceof Date) {
    var tz = ss ? ss.getSpreadsheetTimeZone() : 'Asia/Jakarta';
    return Utilities.formatDate(val, tz, "yyyy-MM-dd");
  }
  if (typeof val === 'string') {
    var str = val.trim();
    if (str.indexOf('T') !== -1 && str.indexOf('Z') !== -1) {
      return str.split('T')[0];
    }
    return val;
  }
  return val;
}

function cleanAllDateColumns(sheet, headers) {
  if (!sheet || sheet.getLastRow() <= 1) return;
  var lastRow = sheet.getLastRow();
  var tz = sheet.getParent().getSpreadsheetTimeZone();
  
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    if (h.indexOf('TANGGAL') !== -1) {
      var colIdx = c + 1;
      var range = sheet.getRange(2, colIdx, lastRow - 1, 1);
      var vals = range.getValues();
      var changed = false;
      for (var r = 0; r < vals.length; r++) {
        var val = vals[r][0];
        if (val instanceof Date) {
          vals[r][0] = Utilities.formatDate(val, tz, "yyyy-MM-dd");
          changed = true;
        } else if (typeof val === 'string' && val.indexOf('T') !== -1 && val.indexOf('Z') !== -1) {
          vals[r][0] = val.split('T')[0];
          changed = true;
        }
      }
      if (changed) {
        range.setNumberFormat('@').setValues(vals);
      }
    }
  }
}

function getAllDataFromSheet(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  var values = range.getValues();
  var ss = sheet.getParent();

  var idpelIdx = headers.indexOf('IDPEL');
  var checkIdx = idpelIdx !== -1 ? idpelIdx : 0;

  var result = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[checkIdx] || String(row[checkIdx]).trim() === '') continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = cleanCellValue(row[j], ss);
    }
    result.push(obj);
  }
  return result;
}

function findRowById(sheet, idpel) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIdx = headers.indexOf('IDPEL') + 1;
  if (colIdx <= 0) colIdx = 2;

  var idpelCol = sheet.getRange(2, colIdx, lastRow - 1, 1).getValues();
  var search = String(idpel).trim();
  for (var i = 0; i < idpelCol.length; i++) {
    if (String(idpelCol[i][0]).trim() === search) {
      return i + 2; // 1-based + 1 for header
    }
  }
  return null;
}

function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function getComparableValue(val) {
  if (val === undefined || val === null) return '';
  var str = String(val);
  var clean = str.replace(/\s*va$/i, '').replace(/\./g, '').trim();
  var num = Number(clean);
  if (clean !== '' && !isNaN(num)) {
    return num;
  }
  return str.toLowerCase();
}

// ─── AUTHENTICATION HELPERS ──────────────────────────────────────────────────

function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return rawHash.map(function(val) {
    var v = val < 0 ? val + 256 : val;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function getJwtSecret() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('JWT_SECRET');
  if (!secret) {
    secret = Utilities.getUuid();
    props.setProperty('JWT_SECRET', secret);
  }
  return secret;
}

function generateToken(username, role) {
  var expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
  var dataToSign = username + '|' + role + '|' + expiry;
  var signature = Utilities.computeHmacSha256Signature(dataToSign, getJwtSecret());
  var sigHex = signature.map(function(val) {
    var v = val < 0 ? val + 256 : val;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
  return Utilities.base64EncodeWebSafe(dataToSign) + '.' + sigHex;
}

function verifyToken(token) {
  if (!token) return null;
  try {
    var parts = token.split('.');
    if (parts.length !== 2) return null;
    
    var dataStr = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
    var sigHex = parts[1];
    
    var expectedSignature = Utilities.computeHmacSha256Signature(dataStr, getJwtSecret());
    var expectedSigHex = expectedSignature.map(function(val) {
      var v = val < 0 ? val + 256 : val;
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
    
    if (sigHex !== expectedSigHex) return null;
    
    var dataParts = dataStr.split('|');
    if (dataParts.length !== 3) return null;
    
    var username = dataParts[0];
    var role = dataParts[1];
    var expiry = parseInt(dataParts[2], 10);
    
    if (Date.now() > expiry) return null;
    
    return { username: username, role: role };
  } catch (e) {
    return null;
  }
}

// ─── AUTH & USER API METHODS ──────────────────────────────────────────────────

function doLogin(username, password) {
  if (!username || !password) {
    return { status: 'error', message: 'Username dan password wajib diisi' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Users');
  if (!sheet) {
    return { status: 'error', message: 'Tabel Users belum diinisialisasi' };
  }

  var userRow = findUserRowByUsername(sheet, username);
  if (!userRow) {
    return { status: 'error', message: 'Username atau password salah' };
  }

  var rowValues = sheet.getRange(userRow, 1, 1, HEADERS_USERS.length).getValues()[0];
  var dbPassword = rowValues[1];
  var dbRole = rowValues[2];
  var dbStatus = rowValues[3];
  var dbNama = rowValues[4];

  if (dbStatus !== 'aktif') {
    return { status: 'error', message: 'Akun Anda dinonaktifkan. Silakan hubungi administrator.' };
  }

  var hashedInput = hashPassword(password);
  if (hashedInput !== dbPassword) {
    return { status: 'error', message: 'Username atau password salah' };
  }

  var token = generateToken(username, dbRole);

  return {
    status: 'success',
    message: 'Login berhasil',
    token: token,
    user: {
      username: username,
      role: dbRole,
      status: dbStatus,
      nama: dbNama || username
    }
  };
}

function buildGetUsers() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Users');
  var list = getAllDataFromSheet(sheet, HEADERS_USERS);

  // Hilangkan password hash untuk keamanan sebelum dikirim ke client
  var sanitized = list.map(function(u) {
    return {
      username: u.username,
      role: u.role,
      status: u.status,
      nama: u.nama || u.username
    };
  });

  return {
    status: 'success',
    data: sanitized
  };
}

function doSaveUser(data) {
  if (!data || !data.username) {
    return { status: 'error', message: 'Username wajib diisi' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Users');
  var username = String(data.username).trim().toLowerCase();
  
  if (username === '') {
    return { status: 'error', message: 'Username tidak boleh kosong' };
  }

  var userRow = findUserRowByUsername(sheet, username);

  if (userRow) {
    // Update existing user
    // Jika password kosong, jangan ubah password lamanya
    var existingValues = sheet.getRange(userRow, 1, 1, HEADERS_USERS.length).getValues()[0];
    var passwordToSave = existingValues[1];
    if (data.password && String(data.password).trim() !== '') {
      passwordToSave = hashPassword(data.password);
    }

    sheet.getRange(userRow, 1, 1, HEADERS_USERS.length).setValues([[
      username,
      passwordToSave,
      data.role || existingValues[2],
      data.status || existingValues[3],
      data.nama || existingValues[4]
    ]]);

    return { status: 'success', message: 'Data user berhasil diperbarui' };
  } else {
    // Create new user
    if (!data.password || String(data.password).trim() === '') {
      return { status: 'error', message: 'Password wajib diisi untuk user baru' };
    }
    
    var newRow = [
      username,
      hashPassword(data.password),
      data.role || 'petugas',
      data.status || 'aktif',
      data.nama || username
    ];
    sheet.appendRow(newRow);
    return { status: 'success', message: 'User baru berhasil didaftarkan' };
  }
}

function doDeleteUser(targetUsername, loggedInUsername) {
  if (!targetUsername) {
    return { status: 'error', message: 'Username wajib diisi' };
  }
  
  var targetLower = String(targetUsername).trim().toLowerCase();
  var loggedInLower = String(loggedInUsername).trim().toLowerCase();

  if (targetLower === 'admin') {
    return { status: 'error', message: 'Akun admin utama tidak dapat dihapus' };
  }

  if (targetLower === loggedInLower) {
    return { status: 'error', message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif' };
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Users');
  var userRow = findUserRowByUsername(sheet, targetLower);

  if (userRow) {
    sheet.deleteRow(userRow);
    return { status: 'success', message: 'User berhasil dihapus' };
  }

  return { status: 'error', message: 'User tidak ditemukan' };
}

function findUserRowByUsername(sheet, username) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  var userCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var search = String(username).trim().toLowerCase();
  for (var i = 0; i < userCol.length; i++) {
    if (String(userCol[i][0]).trim().toLowerCase() === search) {
      return i + 2;
    }
  }
  return null;
}
