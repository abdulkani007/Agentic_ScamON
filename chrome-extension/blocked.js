// Extract parameters from warning URL query string
const params = new URLSearchParams(window.location.search);

const domain = params.get('domain') || 'unknown.com';
const reason = params.get('reason') || 'High Risk threat indicators detected';
const score = params.get('score') || '95';

// Populate details on DOM
document.getElementById('blocked-domain').textContent = domain;
document.getElementById('blocked-reason').textContent = reason;
document.getElementById('blocked-score').textContent = `${score}%`;

// Set Timestamp in UTC format
const now = new Date();
const formattedTime = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
document.getElementById('blocked-time').textContent = formattedTime;
