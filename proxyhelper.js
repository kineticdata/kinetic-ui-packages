const removeSecure = cookie => cookie.replace(/;\s*Secure/i, '');
const removeSameSiteNone = cookie => cookie.replace(/;\s*SameSite=None/i, '');

const getProxyData = request => ({
  host: request.socket._host,
  scheme: request.agent.protocol.replace(':', ''),
  method: request.method,
  path: request.path,
});

const getRequestData = request => ({
  host: request.headers.host,
  scheme: request.headers['x-forwarded-proto'],
  method: request.method,
  path: request.url,
});

const getResponseData = response => ({
  statusCode: response.statusCode,
  message: response.message,
  host: response.socket.servername,
});

const defaultProxyLogger = ({
  proxyRequest,
  originalRequest,
  proxyResponse,
}) => {
  try {
    if (proxyRequest) {
      const proxyData = getProxyData(proxyRequest);
      const originalData = getRequestData(originalRequest);
      console.log(
        `[proxy] [original] -> ${originalData.method}\t${
          originalData.scheme
        }\t${originalData.host}\t${originalData.path}`,
      );
      console.log(
        `[proxy] [proxied]  -> ${proxyData.method}\t${proxyData.scheme}\t${
          proxyData.host
        }\t${proxyData.path}`,
      );
    } else if (proxyResponse) {
      const responseData = getResponseData(proxyResponse);
      const requestData = getRequestData(originalRequest);
      console.log(
        `[proxy] [original] <- ${responseData.statusCode}\t${
          requestData.method
        }\t${requestData.scheme}\t${requestData.host} (${responseData.host})\t${
          requestData.path
        }`,
      );
    }
  } catch (e) {
    console.warn(
      '[proxy] There was a problem logging proxy request/response information',
      e,
    );
  }
};

module.exports = (
  target = process.env.REACT_APP_PROXY_HOST,
  { proxyLogger } = {},
) => ({
  target,
  secure: true,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  onProxyReq: (proxyRequest, originalRequest) => {
    if (process.env.PROXY_DEBUGGING)
      (proxyLogger || defaultProxyLogger)({
        proxyRequest,
        originalRequest,
      });

    // Browsers may send Origin headers even with same-origin
    // requests. To prevent CORS issues, we have to change
    // the Origin to match the target URL.
    if (proxyRequest.getHeader('origin')) {
      proxyRequest.setHeader('origin', target);
    }
  },
  onProxyRes: (proxyResponse, originalRequest) => {
    if (process.env.PROXY_DEBUGGING)
      (proxyLogger || defaultProxyLogger)({
        proxyResponse,
        originalRequest,
      });

    const setCookie = proxyResponse.headers['set-cookie'];
    if (setCookie && originalRequest.protocol === 'http') {
      proxyResponse.headers['set-cookie'] = Array.isArray(setCookie)
        ? setCookie.map(removeSecure).map(removeSameSiteNone)
        : removeSameSiteNone(removeSecure(setCookie));
    }
  },
});
