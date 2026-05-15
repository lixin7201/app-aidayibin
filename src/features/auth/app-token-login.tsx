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
    callback: (state: number, data: QFH5UserInfo) => void,
  ) => void;
  getDeviceId?: (
    callback: (state: number, data: { deviceid?: string; error?: string }) => void,
  ) => void;
};

type WindowWithQFH5 = Window & {
  QFH5?: QFH5Bridge;
};

export function AppTokenLogin() {
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    let isCancelled = false;
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

    function readIdentityFromQFH5() {
      return new Promise<AppIdentityPayload | null>((resolve) => {
        const bridge = windowWithQFH5.QFH5;

        if (!bridge?.getUserInfo) {
          if (nextDebugEnabled) {
            setDebugMessage("未检测到 QFH5.getUserInfo");
          }
          resolve(null);
          return;
        }

        try {
          if (nextDebugEnabled) {
            setDebugMessage("已检测到 QFH5，正在获取用户信息");
          }

          bridge.getUserInfo((state, data) => {
            if (state !== 1 || !data) {
              if (nextDebugEnabled) {
                setDebugMessage("QFH5 已返回，但用户未登录");
              }
              resolve(null);
              return;
            }

            const nextPayload: AppIdentityPayload = {
              uid: data.uid,
              username: data.username,
              face: data.face,
              deviceid: data.deviceid,
            };

            if (nextPayload.deviceid || !bridge.getDeviceId) {
              resolve(nextPayload);
              return;
            }

            bridge.getDeviceId((deviceState, deviceData) => {
              if (deviceState === 1 && deviceData?.deviceid) {
                resolve({ ...nextPayload, deviceid: deviceData.deviceid });
                return;
              }

              resolve(nextPayload);
            });
          });
        } catch {
          resolve(null);
        }
      });
    }

    async function exchangeToken() {
      const identityFromUrl = readIdentityFromUrl();
      const mockIdentity = readMockIdentity();
      installMockQFH5Bridge(mockIdentity);
      const identity = identityFromUrl ?? (await readIdentityFromQFH5());

      if (!identity) {
        return;
      }

      try {
        const response = await fetch(apiPath("/auth/exchange"), {
          method: "POST",
          headers: { "content-type": "application/json" },
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
      }
    }

    void exchangeToken();

    return () => {
      isCancelled = true;
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
