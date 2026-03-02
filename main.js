// 從 LocalStorage 載入原本的設定
window.onload = () => {
  const savedConfig = localStorage.getItem(CONFIG_KEY);
  if (savedConfig) {
    document.getElementById('configInput').value = savedConfig;
  }
  updateManualLinks();
};

// 監聽輸入框變化以更新手動連結
document.getElementById('suspectInput').addEventListener('input', updateManualLinks);

// 執行主程式分析邏輯
document.getElementById('runAnalysis').addEventListener('click', async () => {
  const suspectRaw = document.getElementById('suspectInput').value;
  const configRaw = document.getElementById('configInput').value;
  const btn = document.getElementById('runAnalysis');
  const progressBarContainer = document.getElementById('progressBarContainer');
  const progressBar = document.getElementById('progressBar');
  const unknownSection = document.getElementById('unknownSection');
  const unknownIpButtons = document.getElementById('unknownIpButtons');

  if (!suspectRaw.trim()) {
    showStatus('請先輸入可疑清單', 'error');
    return;
  }

  btn.disabled = true;
  showStatus('準備分析中...');

  const configItems = configRaw.split('\n')
    .map(parseLine)
    .filter(x => x !== null && x.country !== 'Taiwan');

  const suspectLines = suspectRaw.split('\n').filter(l => l.trim() !== '');
  const existingCidrs = new Set(configItems.map(item => item.cidr));

  let newItems = [];
  let excludedTaiwanCount = 0;

  const pendingSuspects = suspectLines
    .map(parseLine)
    .filter(parsed => parsed && !existingCidrs.has(parsed.cidr));

  if (pendingSuspects.length > 0) {
    progressBarContainer.classList.remove('hidden');
    const startTime = Date.now();

    for (let i = 0; i < pendingSuspects.length; i++) {
      const parsed = pendingSuspects[i];
      const progress = Math.round(((i + 1) / pendingSuspects.length) * 100);
      progressBar.style.width = progress + '%';

      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      const avgTimePerIp = elapsed / (i + 1);
      const remainingIps = pendingSuspects.length - (i + 1);
      const estimatedSeconds = Math.round(avgTimePerIp * remainingIps);
      const timeInfo = estimatedSeconds > 0 ? ` (預計剩餘 ${estimatedSeconds} 秒)` : '';

      showStatus(`正在查詢 (${i + 1}/${pendingSuspects.length}): <strong>${parsed.cidr}</strong>${timeInfo}`, 'info');

      const country = await fetchCountryWithRetry(parsed.ip);
      parsed.country = country;

      if (country === 'Taiwan') {
        excludedTaiwanCount++;
      } else {
        newItems.push(parsed);
      }
    }
  }

  let allItems = [...configItems, ...newItems];
  const prefix16Count = {};
  const countryStats = {};
  let unknownIps = [];

  allItems.forEach(item => {
    prefix16Count[item.prefix16] = (prefix16Count[item.prefix16] || 0) + 1;
    const c = item.country || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
    if (c === 'Unknown') unknownIps.push(item);
  });

  allItems = allItems.map(item => {
    let updatedGroup = item.groupName;
    if (prefix16Count[item.prefix16] >= 2) {
      updatedGroup = `group_${item.prefix16.replace(/\./g, '_')}`;
    } else {
      updatedGroup = `group_${item.prefix24.replace(/\./g, '_')}`;
    }
    return { ...item, groupName: updatedGroup };
  });

  allItems.sort((a, b) => ipToLong(a.ip) - ipToLong(b.ip));

  // 生成純文字結果 (Unknown 也帶網址註解)
  const finalResultText = allItems.map(item => {
    const ipField = item.cidr.padEnd(18, ' ');
    const groupField = `"${item.groupName}"`.padEnd(20, ' ');
    let textCountry = item.country || 'Unknown';
    if (textCountry === 'Unknown') textCountry = `Unknown (https://browserleaks.com/ip/${item.ip})`;
    return `    ${ipField} ${groupField} ;   # Freq: ${item.freq} / Diff IPs: ${item.diffIps} / Country: ${textCountry}`;
  }).join('\n');

  document.getElementById('outputResult').value = finalResultText;
  document.getElementById('configInput').value = finalResultText;
  localStorage.setItem(CONFIG_KEY, finalResultText);

  // 更新 Unknown 按鈕區
  if (unknownIps.length > 0) {
    unknownSection.classList.remove('hidden');
    unknownIps.sort((a, b) => ipToLong(a.ip) - ipToLong(b.ip));
    unknownIpButtons.innerHTML = unknownIps.map(item => `
                    <a href="https://browserleaks.com/ip/${item.ip}" target="_blank" onclick="markAsVisited(this)"
                       class="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        ${item.ip}
                    </a>
                `).join('');
    document.getElementById('unknownCounter').innerText = `待處理 Unknown: ${unknownIps.length}`;
  } else {
    unknownSection.classList.add('hidden');
    document.getElementById('unknownCounter').innerText = '';
  }

  const statsStr = Object.entries(countryStats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}: ${count}`)
    .join(', ');

  let statusMsg = `完成！合併後總計 ${allItems.length} 筆資料 (本次新增 ${newItems.length} 筆)。`;
  if (excludedTaiwanCount > 0) statusMsg += ` 已自動排除 ${excludedTaiwanCount} 筆台灣 IP。`;
  statusMsg += `<br><div class="mt-2 pt-2 border-t border-blue-200"><strong>國家分佈統計：</strong><span class="text-xs text-blue-600 font-normal">${statsStr}</span></div>`;

  showStatus(statusMsg, 'success');
  btn.disabled = false;
  progressBarContainer.classList.add('hidden');
  progressBar.style.width = '0%';
});
