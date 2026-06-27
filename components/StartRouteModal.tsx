"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n-context";

interface Props {
  onConfirm: (origin: { address: string; coords: [number, number] | null }) => void;
  onClose: () => void;
}

export default function StartRouteModal({ onConfirm, onClose }: Props) {
  const { t } = useT();
  const [mode, setMode] = useState<"gps" | "text">("gps");
  const [address, setAddress] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<[number, number] | null>(null);
  const [gpsLabel, setGpsLabel] = useState("");
  const [geoError, setGeoError] = useState("");

  const detectGPS = () => {
    if (!navigator.geolocation) { setGeoError(t("map.noGeo")); return; }
    setDetecting(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords([pos.coords.latitude, pos.coords.longitude]);
        setGpsLabel(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setDetecting(false);
      },
      () => {
        setGeoError(t("map.geoError"));
        setDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  const canConfirm =
    (mode === "gps" && gpsCoords !== null) ||
    (mode === "text" && address.trim().length > 3);

  const handleConfirm = () => {
    if (mode === "gps" && gpsCoords) {
      onConfirm({ address: gpsLabel, coords: gpsCoords });
    } else if (mode === "text" && address.trim()) {
      onConfirm({ address: address.trim(), coords: null });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h2 className="text-lg font-black">{t("map.modalTitle")}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white/70 text-sm">{t("map.modalDesc")}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setMode("gps")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "gps" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                GPS
              </span>
            </button>
            <button
              onClick={() => setMode("text")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "text" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("common.search")}
              </span>
            </button>
          </div>

          {/* GPS mode */}
          {mode === "gps" && (
            <div className="space-y-3">
              <button
                onClick={detectGPS}
                disabled={detecting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {detecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("map.detecting")}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t("map.useGPS")}
                  </>
                )}
              </button>
              {gpsCoords && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-800 font-semibold text-sm">{t("map.locationSet")}</p>
                    <p className="text-emerald-600 text-xs font-mono">{gpsLabel}</p>
                  </div>
                </div>
              )}
              {geoError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{geoError}</p>
              )}
            </div>
          )}

          {/* Text mode */}
          {mode === "text" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t("map.typeAddress")}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("map.startingAddressPlaceholder")}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                autoFocus
              />
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {t("map.startRoute")}
          </button>
        </div>
      </div>
    </div>
  );
}
