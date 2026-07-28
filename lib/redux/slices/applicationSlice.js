// src/lib/redux/slices/applicationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "APP_CONTEXT_V1";

const safeParse = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const normalizeNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pick = (...vals) => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return null;
};

const initialState = {
  // full last application object (your JSON)
  application: null,

  // extracted quick-access fields
  APPID: null,
  CIFID: null,
  FINANCIERID: null,
  FINANCIERNAME: null,
  CUSTOMERFULLNAME: null,

  // when you have APPCIFID somewhere else, store it too (optional)
  APPCIFID: null,

  // metadata
  lastUpdatedAt: null,
};

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    setApplicationInfo: (state, action) => {
      const obj = action.payload || null;

      state.application = obj;

      // extract common fields
      state.APPID = normalizeNumber(pick(obj?.APPID, obj?.Appid, obj?.appId));
      state.CIFID = normalizeNumber(pick(obj?.CIFID, obj?.Cifid, obj?.cifId));
      state.APPCIFID = normalizeNumber(
        pick(obj?.APPCIFID, obj?.Appcifid, obj?.appCifId),
      );

      state.FINANCIERID = normalizeNumber(
        pick(obj?.FINANCIERID, obj?.Financierid, obj?.financierId),
      );
      state.FINANCIERNAME = pick(
        obj?.FINANCIERNAME,
        obj?.Financiername,
        obj?.financierName,
      );
      state.CUSTOMERFULLNAME = pick(
        obj?.CUSTOMERFULLNAME,
        obj?.Customerfullname,
        obj?.customerFullName,
      );

      state.lastUpdatedAt = new Date().toISOString();

      // persist to localStorage (client only)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            application: state.application,
            APPID: state.APPID,
            CIFID: state.CIFID,
            APPCIFID: state.APPCIFID,
            FINANCIERID: state.FINANCIERID,
            FINANCIERNAME: state.FINANCIERNAME,
            CUSTOMERFULLNAME: state.CUSTOMERFULLNAME,
            lastUpdatedAt: state.lastUpdatedAt,
          }),
        );
      }
    },

    // your API returns array: [ { ... } ]
    setFromArray: (state, action) => {
      const arr = action.payload;
      const first = Array.isArray(arr) ? arr[0] : null;
      if (!first) return;
      applicationSlice.caseReducers.setApplicationInfo(state, {
        payload: first,
      });
    },

    // hydrate once on app start / tab load
    hydrateFromStorage: (state) => {
      if (typeof window === "undefined") return;

      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = safeParse(raw);
      if (!saved) return;

      state.application = saved.application ?? null;
      state.APPID = saved.APPID ?? null;
      state.CIFID = saved.CIFID ?? null;
      state.APPCIFID = saved.APPCIFID ?? null;
      state.FINANCIERID = saved.FINANCIERID ?? null;
      state.FINANCIERNAME = saved.FINANCIERNAME ?? null;
      state.CUSTOMERFULLNAME = saved.CUSTOMERFULLNAME ?? null;
      state.lastUpdatedAt = saved.lastUpdatedAt ?? null;
    },

    // optional: set only APPCIFID later (from dropdown / customer details)
    setAppCifId: (state, action) => {
      const id = normalizeNumber(action.payload);
      state.APPCIFID = id;

      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const saved = safeParse(raw) || {};
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...saved, APPCIFID: id }),
        );
      }
    },

    clearApplication: (state) => {
      Object.assign(state, initialState);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
  },
});

export const {
  setApplicationInfo,
  setFromArray,
  hydrateFromStorage,
  setAppCifId,
  clearApplication,
} = applicationSlice.actions;

export default applicationSlice.reducer;

/* ---------------- selectors ---------------- */
export const selectApplication = (s) => s.application?.application;
export const selectAppId = (s) => s.application?.APPID;
export const selectCifId = (s) => s.application?.CIFID;
export const selectAppCifId = (s) => s.application?.APPCIFID;

// handy fallback for deletes: use APPCIFID if exists else CIFID (depends on your backend)
export const selectAppCifIdFallback = (s) =>
  s.application?.APPCIFID ?? s.application?.CIFID ?? null;

/* ---------------- helper to inject missing params ---------------- */
export const withAppContext = (params, state) => {
  const APPID = selectAppId(state);
  const CIFID = selectCifId(state);
  const APPCIFID = selectAppCifId(state);

  return {
    ...params,
    APPID: params?.APPID ?? APPID,
    Appid: params?.Appid ?? APPID,
    CIFID: params?.CIFID ?? CIFID,
    APPCIFID: params?.APPCIFID ?? APPCIFID,
    Appcifid: params?.Appcifid ?? APPCIFID,
  };
};
