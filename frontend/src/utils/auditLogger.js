export const addAuditLog = (action, user, status) => {
  const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
  
  const now = new Date();
  // Format as YYYY-MM-DD HH:mm:ss
  const pad = (n) => n.toString().padStart(2, '0');
  const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  // Create a mock IP address based on user to make it look realistic
  let ip = '192.168.1.1';
  if (user === 'admin') ip = '10.0.0.5';
  else if (user === 'rsm') ip = '172.16.0.12';
  else if (user === 'dealer') ip = '203.0.113.45';
  else if (user === 'unknown') ip = '198.51.100.22';

  const newLog = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    action,
    user,
    ip,
    time,
    status
  };
  
  logs.unshift(newLog);
  // Keep only the latest 100 logs
  if (logs.length > 100) logs.pop();
  
  localStorage.setItem('auditLogs', JSON.stringify(logs));
};

export const getAuditLogs = () => {
  return JSON.parse(localStorage.getItem('auditLogs') || '[]');
};
