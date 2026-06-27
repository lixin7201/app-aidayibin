"use client";

import { useEffect, useState } from "react";

import { apiPath } from "@/lib/routes";

type TestStatus = "checking" | "success" | "missing" | "failed" | "partial";

type QFH5UserInfo = {
  uid?: string | number;
  username?: string;
  face?: string;
  deviceid?: string;
  [key: string]: unknown;
};

type QFH5Location = {
  latitude?: number;
  longitude?: number;
  address?: string;
  error?: string;
  [key: string]: unknown;
};

type QFH5SystemInfo = {
  brand?: string;
  model?: string;
  pixelRatio?: number;
  screenWidth?: number;
  screenHeight?: number;
  version?: string;
  inneVersion?: string;
  systemVersion?: string;
  system?: string;
  platform?: string | number;
  webStyle?: number;
  webModel?: number;
  appModel?: number;
  error?: string;
  [key: string]: unknown;
};

type QFH5Bridge = {
  getUserInfo?: (
    callback: (state: number | string, data?: QFH5UserInfo) => void,
  ) => void;
  getLocation?: (
    callback: (state: number | string, data?: QFH5Location) => void,
  ) => void;
  getDeviceId?: (
    callback: (
      state: number | string,
      data?: { deviceid?: string; error?: string },
    ) => void,
  ) => void;
  getNotificationStatus?: (
    callback: (
      state: number | string,
      data?: { isopen?: number; error?: string },
    ) => void,
  ) => void;
  getSystemInfo?: (
    callback: (state: number | string, data?: QFH5SystemInfo) => void,
  ) => void;
};

declare global {
  interface Window {
    QFH5?: QFH5Bridge;
  }
}

type BridgeResult = {
  name: string;
  label: string;
  required: boolean;
  status: TestStatus;
  message: string;
  data?: unknown;
};

export default function WebviewTestPage() {
  const [status, setStatus] = useState<TestStatus>("checking");
  const [message, setMessage] = useState("正在检测 App WebView 桥接能力...");
  const [results, setResults] = useState<BridgeResult[]>([]);
  const [sessionResult, setSessionResult] = useState<unknown>(null);

  useEffect(() => {
    let isCancelled = false;

    async function runCheck() {
      await wait(500);

      if (isCancelled) {
        return;
      }

      installMockBridge();
      const bridge = window.QFH5;
      const nextResults = await Promise.all([
        callBridge<QFH5UserInfo>({
          bridge,
          name: "getUserInfo",
          label: "用户信息",
          required: true,
          invoke: (nextBridge, callback) => nextBridge.getUserInfo?.(callback),
        }),
        callBridge<QFH5Location>({
          bridge,
          name: "getLocation",
          label: "当前位置",
          required: false,
          invoke: (nextBridge, callback) => nextBridge.getLocation?.(callback),
        }),
        callBridge<{ deviceid?: string; error?: string }>({
          bridge,
          name: "getDeviceId",
          label: "设备号",
          required: false,
          invoke: (nextBridge, callback) => nextBridge.getDeviceId?.(callback),
        }),
        callBridge<{ isopen?: number; error?: string }>({
          bridge,
          name: "getNotificationStatus",
          label: "推送状态",
          required: false,
          invoke: (nextBridge, callback) =>
            nextBridge.getNotificationStatus?.(callback),
        }),
        callBridge<QFH5SystemInfo>({
          bridge,
          name: "getSystemInfo",
          label: "系统信息",
          required: false,
          invoke: (nextBridge, callback) => nextBridge.getSystemInfo?.(callback),
        }),
      ]);

      if (isCancelled) {
        return;
      }

      setResults(nextResults);

      const userInfo = nextResults.find((item) => item.name === "getUserInfo");
      const userInfoData = extractBridgeData<QFH5UserInfo>(userInfo?.data);

      if (userInfo?.status === "success" && userInfoData) {
        await verifyServerSession(userInfoData);
      }

      const requiredFailed = nextResults.some(
        (item) => item.required && item.status !== "success",
      );
      const optionalFailed = nextResults.some(
        (item) => !item.required && item.status !== "success",
      );

      if (requiredFailed) {
        setStatus(userInfo?.status === "missing" ? "missing" : "failed");
        setMessage("用户信息桥接未通过，H5 无法建立 App 登录态。");
        return;
      }

      setStatus(optionalFailed ? "partial" : "success");
      setMessage(
        optionalFailed
          ? "用户信息可用，部分可选桥接未注入或返回失败。"
          : "全部桥接检测通过，用户信息可正常建立 H5 登录态。",
      );
    }

    async function verifyServerSession(userInfo: QFH5UserInfo) {
      try {
        const response = await fetch(apiPath("/auth/exchange"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uid: userInfo.uid,
            username: userInfo.username,
            face: userInfo.face,
            deviceid: userInfo.deviceid,
          }),
        });
        const data = (await response.json()) as unknown;
        setSessionResult({
          ok: response.ok,
          status: response.status,
          data,
        });
      } catch (error) {
        setSessionResult({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    void runCheck();

    return () => {
      isCancelled = true;
    };
  }, []);

  const statusText = {
    checking: "检测中",
    success: "成功",
    partial: "部分通过",
    missing: "未检测到",
    failed: "失败",
  }[status];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)]">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-3xl flex-col justify-center">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[0_18px_50px_rgba(102,76,160,0.12)]">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            App WebView 测试页
          </p>
          <h1 className="mt-3 text-3xl font-black">QFH5.getUserInfo 检测</h1>
          <div className="mt-5 rounded-2xl bg-[#f5f0ff] p-4">
            <p className="text-sm font-black text-[var(--primary)]">当前状态：{statusText}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>
          </div>

          <div className="mt-5 grid gap-3">
            {results.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">
                    {item.label} · {item.name}
                  </p>
                  <span className="rounded-full bg-[#f5f0ff] px-3 py-1 text-xs font-black text-[var(--primary)]">
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {item.message}
                </p>
                <pre className="mt-3 max-h-[180px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--muted)]">
                  {JSON.stringify(item.data ?? null, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-sm font-black">登录态交换结果</p>
            <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--muted)]">
              {JSON.stringify(sessionResult, null, 2)}
            </pre>
          </div>

          <div className="mt-5 rounded-2xl bg-[#fbfaff] p-4 text-sm leading-6 text-[var(--muted)]">
            <p className="font-black text-[var(--foreground)]">怎么看结果：</p>
            <p className="mt-2">用户信息是必需项，通过后 H5 会自动建立登录态。</p>
            <p>定位、设备号、推送状态、系统信息是可选项，用于 App 侧联调排查。</p>
            <p>如果用户信息显示未检测到，说明页面不是在 App WebView 里打开，或 App 还没有注入 QFH5。</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function installMockBridge() {
  const url = new URL(window.location.href);

  if (url.searchParams.get("mock_qfh5") !== "1") {
    return;
  }

  window.QFH5 = {
    getUserInfo(callback) {
      callback(1, {
        uid: url.searchParams.get("mock_uid") ?? "987654",
        username: url.searchParams.get("mock_username") ?? "上线前测试用户",
        face:
          url.searchParams.get("mock_face") ??
          "https://dummyimage.com/128x128/eee/333.png&text=test",
        deviceid:
          url.searchParams.get("mock_deviceid") ?? "device-md5-preflight",
        phone: url.searchParams.get("mock_phone") ?? "13800000000",
      });
    },
    getLocation(callback) {
      callback(1, {
        latitude: 28.7513,
        longitude: 104.6417,
        address: "四川省宜宾市",
      });
    },
    getDeviceId(callback) {
      callback(1, {
        deviceid: url.searchParams.get("mock_deviceid") ?? "device-md5-preflight",
      });
    },
    getNotificationStatus(callback) {
      callback(1, { isopen: 1 });
    },
    getSystemInfo(callback) {
      callback(1, {
        brand: "iOS",
        model: "iPhone",
        pixelRatio: 3,
        screenWidth: 390,
        screenHeight: 844,
        version: "8.0.0",
        inneVersion: "800",
        systemVersion: "17.0",
        platform: "1",
        webStyle: 1,
        webModel: 0,
        appModel: 0,
      });
    },
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function statusLabel(status: TestStatus) {
  return {
    checking: "检测中",
    success: "通过",
    partial: "部分通过",
    missing: "未注入",
    failed: "失败",
  }[status];
}

function callBridge<T>(input: {
  bridge: QFH5Bridge | undefined;
  name: keyof QFH5Bridge & string;
  label: string;
  required: boolean;
  invoke: (
    bridge: QFH5Bridge,
    callback: (state: number | string, data?: T) => void,
  ) => void;
}): Promise<BridgeResult> {
  return new Promise((resolve) => {
    const method = input.bridge?.[input.name];

    if (typeof method !== "function" || !input.bridge) {
      resolve({
        name: input.name,
        label: input.label,
        required: input.required,
        status: "missing",
        message: "App 未注入该桥接方法。",
      });
      return;
    }

    const timer = window.setTimeout(() => {
      resolve({
        name: input.name,
        label: input.label,
        required: input.required,
        status: "failed",
        message: "调用超时，App 未在 5 秒内返回。",
      });
    }, 5000);

    try {
      input.invoke(input.bridge, (state, data) => {
        window.clearTimeout(timer);
        const success = String(state) === "1";
        resolve({
          name: input.name,
          label: input.label,
          required: input.required,
          status: success ? "success" : "failed",
          message: success
            ? "App 已返回有效数据。"
            : getBridgeError(data) ?? "App 返回失败状态。",
          data: {
            state,
            data,
          },
        });
      });
    } catch (error) {
      window.clearTimeout(timer);
      resolve({
        name: input.name,
        label: input.label,
        required: input.required,
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

function getBridgeError(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return null;
}

function extractBridgeData<T>(value: unknown): T | null {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    value.data &&
    typeof value.data === "object"
  ) {
    return value.data as T;
  }

  return null;
}
