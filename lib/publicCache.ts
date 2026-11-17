// Call after any write to jobs or late_uni_apps that changes what the public
// sees, so the cached public pages refresh straight away. Best effort, never
// awaited: keepalive lets it finish even if the screen navigates away.
export function refreshPublicPages() {
  fetch('/api/public-cache', { method: 'POST', keepalive: true }).catch(() => {});
}
