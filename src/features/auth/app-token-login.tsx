"use client";

import { useEffect, useState } from "react";

import { apiPath } from "@/lib/routes";

type AppIdentityPayload = {
  app_token?: string;
  app_user_id?: string;
  uid?: string | number;
  nickname?: string;
  username?: string;
  avatar_url?: string;
  face?: string;
  device_id?: string;
  deviceid?: string;
};

type QFH5UserInfo = {
  uid?: string | number;
  username?: string;
  face?: string;
  deviceid?: string;
  phone?: string;
  error?: string;
};

type QFH5Bridge = {
  getUserInfo?: (
    callback: (state: number | string, data: QFH5UserInfo) => void,
  ) => void;
  getDeviceId?: (
    callback: (
      state: number | string,
      data: { deviceid?: string; error?: string },
    ) => void,
  ) => void;
};

type WindowWithQFH5 = Window & {
  QFH5?: QFH5Bridge;
};

const appVisibleEventName = "aidayibin:app-visible";
const minRefreshIntervalMs = 1000;
const qfh5BridgeWaitTimeoutMs = 3000;
const qfh5BridgePollIntervalMs = 150;
const qfh5CallbackTimeoutMs = 5000;
const maxNoIdentityRetries = 6;

function isWechatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function isBridgeSuccess(state: number | string) {
  return String(state) === "1";
}

export function AppTokenLogin() {
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    let isCancelled = false;
    let isExchanging = false;
    let lastRefreshAt = 0;
    let retryTimer: number | null = null;
    let noIdentityRetryCount = 0;
    const nextDebugEnabled =
      url.searchParams.get("qfh5_debug") === "1" ||
      url.searchParams.get("mock_qfh5") === "1";

    const windowWithQFH5 = window as WindowWithQFH5;

    if (nextDebugEnabled) {
      window.setTimeout(() => setDebugEnabled(true), 0);
    }

    function readIdentityFromUrl() {
      const payload: AppIdentityPayload = {
        app_token: url.searchParams.get("app_token") ?? undefined,
        app_user_id: url.searchParams.get("app_user_id") ?? undefined,
        uid: url.searchParams.get("uid") ?? undefined,
        nickname: url.searchParams.get("nickname") ?? undefined,
        username: url.searchParams.get("username") ?? undefined,
        avatar_url: url.searchParams.get("avatar_url") ?? undefined,
        face: url.searchParams.get("face") ?? undefined,
        device_id: url.searchParams.get("device_id") ?? undefined,
        deviceid: url.searchParams.get("deviceid") ?? undefined,
      };

      return Object.values(payload).some((value) => value !== undefined)
        ? payload
        : null;
    }

    function readMockIdentity() {
      if (url.searchParams.get("mock_qfh5") !== "1") {
        return null;
      }

      return {
        uid: url.searchParams.get("mock_uid") ?? "10001",
        username: url.searchParams.get("mock_username") ?? "本地测试用户",
        face:
          url.searchParams.get("mock_face") ??
          "https://dummyimage.com/256x256/f5f0ff/7a5cff&text=dayibin",
        deviceid: url.searchParams.get("mock_deviceid") ?? "mock-device-001",
      } satisfies AppIdentityPayload;
    }

    function installMockQFH5Bridge(payload: AppIdentityPayload | null) {
      if (!payload || windowWithQFH5.QFH5) {
        return;
      }

      windowWithQFH5.QFH5 = {
        getUserInfo(callback) {
          callback(1, {
            uid: payload.uid,
            username: payload.username,
            face: payload.face,
            deviceid: payload.deviceid,
          });
        },
        getDeviceId(callback) {
          callback(1, {
            deviceid: payload.deviceid,
          });
        },
      };
    }

    function waitForQFH5Bridge() {
      return new Promise<QFH5Bridge | null>((resolve) => {
        const startedAt = Date.now();

        function checkBridge() {
          const bridge = windowWithQFH5.QFH5;

          if (bridge?.getUserInfo) {
            resolve(bridge);
            return;
          }

          if (Date.now() - startedAt >= qfh5BridgeWaitTimeoutMs) {
            resolve(null);
            return;
          }

          window.setTimeout(checkBridge, qfh5BridgePollIntervalMs);
        }

        checkBridge();
      });
    }

    function scheduleNoIdentityRetry() {
      if (isCancelled || retryTimer !== null) {
        return;
      }

      if (noIdentityRetryCount >= maxNoIdentityRetries) {
        return;
      }

      noIdentityRetryCount += 1;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void exchangeToken({ force: true });
      }, 1000);
    }

    function clearNoIdentityRetry() {
      noIdentityRetryCount = 0;

      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    async function readIdentityFromQFH5() {
      return new Promise<AppIdentityPayload | null>((resolve) => {
        void waitForQFH5Bridge().then((bridge) => {
          if (!bridge?.getUserInfo) {
            if (nextDebugEnabled) {
              setDebugMessage("未检测到 QFH5.getUserInfo");
            }
            resolve(null);
            return;
          }

          if (nextDebugEnabled) {
            setDebugMessage("已检测到 QFH5，正在获取用户信息");
          }

          let resolved = false;
          const finish = (payload: AppIdentityPayload | null) => {
            if (resolved) {
              return;
            }

            resolved = true;
            window.clearTimeout(timer);
            resolve(payload);
          };
          const timer = window.setTimeout(() => {
            if (nextDebugEnabled) {
              setDebugMessage("QFH5 获取用户信息超时");
            }
            finish(null);
          }, qfh5CallbackTimeoutMs);

          try {
            bridge.getUserInfo((state, data) => {
              if (!isBridgeSuccess(state) || !data) {
                if (nextDebugEnabled) {
                  setDebugMessage("QFH5 已返回，但用户未登录");
                }
                finish(null);
                return;
              }

              const nextPayload: AppIdentityPayload = {
                uid: data.uid,
                username: data.username,
                face: data.face,
                deviceid: data.deviceid,
              };

              if (nextPayload.deviceid || !bridge.getDeviceId) {
                finish(nextPayload);
                return;
              }

              bridge.getDeviceId((deviceState, deviceData) => {
                if (isBridgeSuccess(deviceState) && deviceData?.deviceid) {
                  finish({ ...nextPayload, deviceid: deviceData.deviceid });
                  return;
                }

                finish(nextPayload);
              });
            });
          } catch {
            finish(null);
          }
        });
      });
    }

    async function checkSession(): Promise<boolean> {
      try {
        const response = await fetch(apiPath("/auth/check"), {
          credentials: "include",
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    function redirectToWechatOAuth() {
      const returnTo = window.location.pathname + window.location.search;
      const oauthUrl = apiPath(
        `/auth/wechat/start?return_to=${encodeURIComponent(returnTo)}`,
      );
      window.location.href = oauthUrl;
    }

    function isPublicSharePage() {
      return (
        window.location.pathname.includes("/share/gaokao/") ||
        window.location.pathname.includes("/share/photo/") ||
        window.location.pathname.includes("/share/fortune/")
      );
    }

    function dispatchAppVisible() {
      window.dispatchEvent(new CustomEvent(appVisibleEventName));
    }

    async function exchangeToken(options: { force?: boolean } = {}) {
      const now = Date.now();

      if (!options.force && now - lastRefreshAt < minRefreshIntervalMs) {
        return;
      }

      if (isExchanging) {
        return;
      }

      lastRefreshAt = now;
      isExchanging = true;
      const identityFromUrl = readIdentityFromUrl();
      const mockIdentity = readMockIdentity();
      installMockQFH5Bridge(mockIdentity);

      if (!identityFromUrl && !mockIdentity && isPublicSharePage()) {
        clearNoIdentityRetry();
        return;
      }

      try {
        const identity = identityFromUrl ?? (await readIdentityFromQFH5());

        if (!identity) {
          // 无 App 身份时，检测微信环境并自动跳转 OAuth
          const hasSession = await checkSession();

          if (!hasSession && isWechatBrowser() && !isPublicSharePage()) {
            redirectToWechatOAuth();
            return;
          }

          if (hasSession) {
            clearNoIdentityRetry();
            dispatchAppVisible();
            return;
          }

          scheduleNoIdentityRetry();
          return;
        }

        const response = await fetch(apiPath("/auth/exchange"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(identity),
        });

        if (isCancelled) {
          return;
        }

        if (response.ok) {
          const payload = (await response.json()) as {
            user?: {
              nickname?: string;
              avatar_url?: string | null;
            };
          };

          if (nextDebugEnabled) {
            setDebugMessage("登录成功，H5 已建立会话");
          }

          clearNoIdentityRetry();
          dispatchAppVisible();
          window.dispatchEvent(
            new CustomEvent("aidayibin:auth-ready", {
              detail: {
                nickname: payload.user?.nickname ?? "大宜宾用户",
                avatarUrl: payload.user?.avatar_url ?? null,
              },
            }),
          );

          const hadIdentityInUrl = identityFromUrl !== null;
          if (hadIdentityInUrl) {
            url.searchParams.delete("app_token");
            url.searchParams.delete("app_user_id");
            url.searchParams.delete("uid");
            url.searchParams.delete("nickname");
            url.searchParams.delete("username");
            url.searchParams.delete("avatar_url");
            url.searchParams.delete("face");
            url.searchParams.delete("device_id");
            url.searchParams.delete("deviceid");
            const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
            window.location.replace(cleanUrl);
          }
          return;
        }

        if (identityFromUrl) {
          url.searchParams.delete("app_token");
          url.searchParams.delete("app_user_id");
          url.searchParams.delete("uid");
          url.searchParams.delete("nickname");
          url.searchParams.delete("username");
          url.searchParams.delete("avatar_url");
          url.searchParams.delete("face");
          url.searchParams.delete("device_id");
          url.searchParams.delete("deviceid");
          window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        }

        if (nextDebugEnabled) {
          setDebugMessage("登录交换失败，请查看接口返回");
        }
      } catch {
        if (identityFromUrl) {
          url.searchParams.delete("app_token");
          url.searchParams.delete("app_user_id");
          url.searchParams.delete("uid");
          url.searchParams.delete("nickname");
          url.searchParams.delete("username");
          url.searchParams.delete("avatar_url");
          url.searchParams.delete("face");
          url.searchParams.delete("device_id");
          url.searchParams.delete("deviceid");
          window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        }

        if (nextDebugEnabled) {
          setDebugMessage("登录交换异常，请查看控制台");
        }
      } finally {
        isExchanging = false;
      }
    }

    function handleAppVisible() {
      if (document.visibilityState && document.visibilityState !== "visible") {
        return;
      }

      void exchangeToken();
    }

    void exchangeToken({ force: true });
    window.addEventListener("pageshow", handleAppVisible);
    window.addEventListener("focus", handleAppVisible);
    document.addEventListener("visibilitychange", handleAppVisible);

    return () => {
      isCancelled = true;
      clearNoIdentityRetry();
      window.removeEventListener("pageshow", handleAppVisible);
      window.removeEventListener("focus", handleAppVisible);
      document.removeEventListener("visibilitychange", handleAppVisible);
    };
  }, []);

  if (!debugEnabled) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[9999] rounded-2xl border border-[#d8c59a] bg-[#fffaf0]/95 px-3 py-2 text-xs font-bold text-[#27362f] shadow-lg shadow-black/10 backdrop-blur">
      {debugMessage ?? "QFH5 调试中"}
    </div>
  );
}
