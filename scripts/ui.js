// 點擊按鈕後標記為已存取
function markAsVisited(el) {
  el.classList.remove('bg-orange-600', 'hover:bg-orange-700', 'bg-white', 'text-blue-600');
  el.classList.add('bg-slate-400', 'hover:bg-slate-500', 'text-white', 'border-slate-500');
}

// 顯示狀態訊息
function showStatus(msg, type = 'info') {
  const box = document.getElementById('statusBox');
  box.innerHTML = msg;
  box.classList.remove('hidden', 'bg-blue-100', 'text-blue-700', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');

  if (type === 'error') box.classList.add('bg-red-100', 'text-red-700');
  else if (type === 'success') box.classList.add('bg-green-100', 'text-green-700');
  else box.classList.add('bg-blue-100', 'text-blue-700');
}

// 更新手動連結
function updateManualLinks() {
  const input = document.getElementById('suspectInput').value;
  const container = document.getElementById('manualCheckLinks');

  // 使用正則提取所有 IP
  const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
  const matches = input.match(ipRegex);

  if (!matches || matches.length === 0) {
    container.innerHTML = '<span class="text-xs text-gray-400 italic">輸入 IP 後將在此顯示快捷連結...</span>';
    return;
  }

  // 去重並按 IP 數值排序
  const uniqueIps = [...new Set(matches)].sort((a, b) => ipToLong(a) - ipToLong(b));

  container.innerHTML = uniqueIps.map(ip => `
                <a href="https://browserleaks.com/ip/${ip}" target="_blank" onclick="markAsVisited(this)"
                   class="inline-flex items-center px-2 py-1 bg-white border border-gray-300 rounded text-[11px] text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors shadow-sm">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    ${ip}
                </a>
            `).join('');
}

// 複製功能
function copyResult() {
  const text = document.getElementById('outputResult').value;
  if (!text) return;
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showStatus('已複製到剪貼簿！', 'success');
  } catch (err) {
    showStatus('複製失敗，請手動全選複製。', 'error');
  }
  document.body.removeChild(textArea);
}
