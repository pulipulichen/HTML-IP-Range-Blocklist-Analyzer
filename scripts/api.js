// 查詢國家
async function fetchCountryWithRetry(ip) {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  if (cache[ip]) return cache[ip];

  let currentIp = ip;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts <= maxAttempts) {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      // const response = await fetch(`https://freeipapi.com/api/json/${currentIp}`);
      const response = await fetch(`https://script.google.com/macros/s/AKfycbxn-NPm_mB6YYpZT2zex6LRSoc6iTvXu-VLslhIQjdY1xp4iRJ5KloLyWIDRzmfPX-CGg/exec?ip=${currentIp}`);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      if (data.countryName && data.countryName !== 'Unknown') {
        const country = data.countryName;
        cache[ip] = country;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return country;
      }
    } catch (e) {
      console.warn(`Attempt ${attempts + 1} failed for ${currentIp}`);
    }
    currentIp = incrementIP(currentIp);
    attempts++;
  }
  return 'Unknown';
}
