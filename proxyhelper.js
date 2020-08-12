const removeSecure = cookie => cookie.replace(/;\s*Secure/i, '');
const removeSameSiteNone = cookie => cookie.replace(/;\s*SameSite=None/i, '');

module.exports = (target = process.env.REACT_APP_PROXY_HOST) => ({
  target,
  secure: true,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  onProxyReq: proxyReq => {
    // Browsers may send Origin headers even with same-origin
    // requests. To prevent CORS issues, we have to change
    // the Origin to match the target URL.
    if (proxyReq.getHeader('origin')) {
      proxyReq.setHeader('origin', target);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    const setCookie = proxyRes.headers['set-cookie'];
    if (setCookie && req.protocol === 'http') {
      proxyRes.headers['set-cookie'] = Array.isArray(setCookie)
        ? setCookie.map(removeSecure).map(removeSameSiteNone)
        : removeSameSiteNone(removeSecure(setCookie));
    }
  },
});