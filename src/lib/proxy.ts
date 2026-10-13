import { ProxyAgent, setGlobalDispatcher } from "undici";

const clashProxy = "http://127.0.0.1:7897";
const v2rayProxy = "http://127.0.0.1:10808";

let isProxyConfigured = false;

export const runProxy = () => {
  if (isProxyConfigured) return;

  const proxyUrl =
    process.env.HTTPS_PROXY || process.env.HTTP_PROXY || clashProxy;

  if (proxyUrl) {
    try {
      setGlobalDispatcher(new ProxyAgent(proxyUrl));
      isProxyConfigured = true;
      console.log(
        `[Proxy] Global dispatcher configured with proxy: ${proxyUrl}`,
      );
    } catch (err) {
      console.warn(`[Proxy] Failed to configure proxy:`, err);
    }
  }
};
