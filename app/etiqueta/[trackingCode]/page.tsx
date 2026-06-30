"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface LabelData {
  trackingCode: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string | null;
  pickupPostalCode: string | null;
  pickupCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string | null;
  recipientPostalCode: string | null;
  recipientCountry: string;
  destinationCountry: string;
  packageType: string;
  estimatedWeight: number | null;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions: string | null;
}

export default function EtiquetaPage() {
  const params = useParams();
  const code = params.trackingCode as string;
  const [data, setData] = useState<LabelData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/label/${code}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [code]);

  useEffect(() => {
    if (data) {
      document.title = `Label ${data.trackingCode}`;
      // Auto-print after a brief render delay
      const timer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-slate-500">Tracking code not found: {code}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  const preferredDate = new Date(data.preferredDate).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  return (
    <>
      <style>{`
        @page {
          size: 4in 6in;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        @media screen {
          body { background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .label-root { box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
        }
        @media print {
          body { background: white; display: block; }
          .no-print { display: none !important; }
          .label-root { box-shadow: none; }
        }
      `}</style>

      {/* Print button — screen only */}
      <div className="no-print fixed top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
        >
          🖨️ Print label
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* 4×6 label */}
      <div
        className="label-root"
        style={{
          width: "4in",
          minHeight: "6in",
          background: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10pt",
          color: "#000",
          border: "1px solid #000",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ background: "#1e1b4b", color: "white", padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "13pt", letterSpacing: "0.02em" }}>O&apos;GLOBO CARGO</div>
            <div style={{ fontSize: "8pt", opacity: 0.8 }}>International Logistics</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "7pt", opacity: 0.7 }}>TRACKING CODE</div>
            <div style={{ fontWeight: "bold", fontSize: "11pt", fontFamily: "monospace", letterSpacing: "0.05em" }}>
              {data.trackingCode}
            </div>
          </div>
        </div>

        {/* Barcode placeholder — tracking code in large mono */}
        <div style={{ background: "#f8f8f8", borderBottom: "1px solid #ddd", padding: "6px 10px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: "26pt", letterSpacing: "0.1em", lineHeight: 1 }}>
            |||||||||||||||||||||||||||||||
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "9pt", letterSpacing: "0.15em", marginTop: "2px" }}>
            {data.trackingCode}
          </div>
        </div>

        {/* FROM / TO */}
        <div style={{ display: "flex", flex: 1, borderBottom: "1px solid #000" }}>
          {/* FROM */}
          <div style={{ flex: 1, borderRight: "1px solid #ccc", padding: "8px 10px" }}>
            <div style={{ fontSize: "7pt", fontWeight: "bold", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>FROM</div>
            <div style={{ fontWeight: "bold", fontSize: "10pt" }}>{data.contactName}</div>
            <div style={{ fontSize: "9pt" }}>{data.pickupAddress}</div>
            <div style={{ fontSize: "9pt" }}>
              {data.pickupCity}{data.pickupState ? `, ${data.pickupState}` : ""}{data.pickupPostalCode ? ` ${data.pickupPostalCode}` : ""}
            </div>
            <div style={{ fontSize: "9pt" }}>{data.pickupCountry}</div>
            <div style={{ fontSize: "9pt", marginTop: "3px" }}>📞 {data.contactPhone}</div>
          </div>
          {/* TO */}
          <div style={{ flex: 1, padding: "8px 10px" }}>
            <div style={{ fontSize: "7pt", fontWeight: "bold", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>TO</div>
            <div style={{ fontWeight: "bold", fontSize: "10pt" }}>{data.recipientName}</div>
            <div style={{ fontSize: "9pt" }}>{data.recipientAddress}</div>
            <div style={{ fontSize: "9pt" }}>
              {data.recipientCity}{data.recipientState ? `, ${data.recipientState}` : ""}{data.recipientPostalCode ? ` ${data.recipientPostalCode}` : ""}
            </div>
            <div style={{ fontSize: "9pt" }}>{data.destinationCountry || data.recipientCountry}</div>
            <div style={{ fontSize: "9pt", marginTop: "3px" }}>📞 {data.recipientPhone}</div>
          </div>
        </div>

        {/* Package details row */}
        <div style={{ display: "flex", borderBottom: "1px solid #ccc", background: "#fafafa" }}>
          {[
            { label: "Service", value: "International" },
            { label: "Type", value: data.packageType },
            { label: "Weight", value: data.estimatedWeight ? `${data.estimatedWeight} lbs` : "—" },
            { label: "Dest.", value: data.destinationCountry || data.recipientCountry },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, padding: "5px 8px", borderRight: "1px solid #eee", textAlign: "center" }}>
              <div style={{ fontSize: "7pt", color: "#666", textTransform: "uppercase" }}>{item.label}</div>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Pickup date / time */}
        <div style={{ display: "flex", borderBottom: "1px solid #ccc", padding: "5px 10px", background: "#fff" }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "7pt", color: "#666", textTransform: "uppercase" }}>Pickup date: </span>
            <span style={{ fontSize: "9pt", fontWeight: "bold" }}>{preferredDate}</span>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <span style={{ fontSize: "7pt", color: "#666", textTransform: "uppercase" }}>Time window: </span>
            <span style={{ fontSize: "9pt", fontWeight: "bold" }}>{data.preferredTimeWindow}</span>
          </div>
        </div>

        {/* Special instructions */}
        {data.specialInstructions && (
          <div style={{ padding: "5px 10px", background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
            <span style={{ fontSize: "7pt", fontWeight: "bold", textTransform: "uppercase", color: "#92400e" }}>Special Instructions: </span>
            <span style={{ fontSize: "9pt" }}>{data.specialInstructions}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "4px 10px", background: "#f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <div style={{ fontSize: "7pt", color: "#666" }}>
            Track at: oglobocargo.com/rastreo/{data.trackingCode}
          </div>
          <div style={{ fontSize: "7pt", color: "#666" }}>
            {new Date().toLocaleDateString("en-US")}
          </div>
        </div>
      </div>
    </>
  );
}
