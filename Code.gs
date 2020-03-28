// Based on a script written by Amit Agarwal amit@labnol.org
//
// https://www.labnol.org/code/covid-19-india-tracker-200325

/**
 * Get today's COVID-19 figures from those compiled by Tom White 
 * for the UK
 *
 * https://github.com/tomwhite/covid-19-uk-data
 */ 
const getCurrentCovid19Cases_ = (json = true) => {
  const spreadsheet = SpreadsheetApp.getActive();
  const counties = getCounties();
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const url = 'https://raw.githubusercontent.com/tomwhite/covid-19-uk-data/master/data/daily/covid-19-cases-' + date + '-wales.csv';
  const csv = UrlFetchApp.fetch(url).getContentText();
  const data = Utilities.parseCsv(csv);
  data.shift(); // Remove the headers
  let boards = {};  
  if (data.length >= 22 && data.length <= 24) { // Data lists by county, not board
    data.forEach((row) => {
      const nextCounty = row[3]
      const nextBoard = counties[nextCounty]
      if (boards[nextBoard] === undefined) {
        boards[nextBoard] = parseInt(row[4], 10);
      } else {
        boards[nextBoard] = boards[nextBoard] + parseInt(row[4], 10);
      }
    })
  } else if (data.length >= 7 && data.length <= 9) { // Data lists by board
    data.forEach(row => boards[row[3]] = parseInt(row[4], 10))
  } else {
    throw new Error('Unrecognised format: ' + JSON.stringify(data))
  }
  return json ? boards : JSON.stringify(boards);
  
  // Private Functions
  // -----------------
  
  function getCounties() {  
    var data = spreadsheet.getSheetByName('Counties').getDataRange().getValues()
    data.shift(); // Remove headers
    let object = {}
    data.forEach(row => object[row[0]] = row[1])
    return object
  }
};

/**
 * Write the parsed data into a new column in Google Sheet
 * All the historic data is also preserved in the sheet.
 */
const writeNewCovid19CasesToSheets_ = (covid19Cases) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
  const totalCount = Object.keys(covid19Cases).reduce((acc, state) => acc + covid19Cases[state], 0);
  const stateData = sheet
    .getRange(3, 1, sheet.getLastRow() - 3, 1)
    .getValues()
    .map(([state]) => [covid19Cases[state] || 0]);
  sheet
    .getRange(2, sheet.getLastColumn() + 1, stateData.length + 2, 1)  
    .setValues([[new Date], ...stateData.map((count) => [count]), [totalCount]]);
};

const triggerCheckCovid19Cases = () => {
  const currentCases = getCurrentCovid19Cases_();
  writeNewCovid19CasesToSheets_(currentCases);
};
