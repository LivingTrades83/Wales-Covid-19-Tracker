const doGet = () => {
  const key = 'Covid19IndiaTracker';
  const cache = CacheService.getScriptCache();
  let data = cache.get(key);
  if (data === null) {
    data = getCurrentCovid19Cases_(false);
    cache.put(key, data, 21600);
  }
  return ContentService.createTextOutput(data).setMimeType(
    ContentService.MimeType.JSON
  );
};
