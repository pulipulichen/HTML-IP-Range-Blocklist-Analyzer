// IP 轉數值 (用於排序)
function ipToLong(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return 0;
  return parts.reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// IP 加 1 邏輯
function incrementIP(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return ip;

  parts[3] += 1;
  for (let i = 3; i >= 0; i--) {
    if (parts[i] > 255) {
      parts[i] = 0;
      if (i > 0) parts[i - 1] += 1;
    }
  }
  return parts.join('.');
}

// 解析單行資料
function parseLine(line) {
  if (!line.trim()) return null;
  const regex = /^\s*([\d\.\/]+)\s+"([^"]+)"\s*;?\s*#\s*Freq:\s*(\d+)\s*\/\s*Diff IPs:\s*(\d+)(?:\s*\/\s*Country:\s*([^#\n\r]+))?/;
  const match = line.match(regex);
  if (match) {
    const cidr = match[1];
    const ip = cidr.split('/')[0];
    const parts = ip.split('.');
    return {
      fullLine: line,
      cidr: cidr,
      ip: ip,
      prefix16: parts.slice(0, 2).join('.'),
      prefix24: parts.slice(0, 3).join('.'),
      groupName: match[2],
      freq: match[3],
      diffIps: match[4],
      country: match[5] ? match[5].trim() : null
    };
  }
  return null;
}
