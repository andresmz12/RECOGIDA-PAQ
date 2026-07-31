"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LocationPicker from "@/components/Form/LocationPicker";
import AddressAutocomplete from "@/components/Form/AddressAutocomplete";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getShippingConfig, AIR_ITEM_TYPES, AIR_PER_LB_KEY, type ShippingMode } from "@/lib/shipping-modes";
import { calcMaritimePrice, calcAirPerLbPrice, calcAirFixedItemPrice, type PricingRule } from "@/lib/pricing";

const AIR_PER_LB_LABEL = "Envío Aéreo (por libra)";

const BOX_SIZES = [
  { value: "Caja 18x18x18", dimensions: "18x18x18 in", descKey: "boxSmall" },
  { value: "Caja 20x20x20", dimensions: "20x20x20 in", descKey: "boxMedium" },
  { value: "Caja 22x22x22", dimensions: "22x22x22 in", descKey: "boxLarge" },
  { value: "Caja 24x24x24", dimensions: "24x24x24 in", descKey: "boxXL" },
  { value: "Documento",     dimensions: "",             descKey: "boxDoc" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const TIME_WINDOWS = [
  { value: "08:00-12:00", labelKey: "twMorning" },
  { value: "12:00-17:00", labelKey: "twAfternoon" },
  { value: "17:00-20:00", labelKey: "twEvening" },
];

type BoxItem = { packageType: string; estimatedWeight: string };
const DEFAULT_ITEM: BoxItem = { packageType: "Caja 20x20x20", estimatedWeight: "" };

interface SavedRecipient {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary: string | null;
  recipientEmail: string | null;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string | null;
  recipientPostalCode: string | null;
  recipientCountry: string;
  destinationCountry: string;
}

interface SavedPickupAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
}

const EMPTY = {
  // Sender
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  // Pickup address
  pickupAddress: "",
  pickupCity: "",
  pickupState: "FL",
  pickupPostalCode: "",
  pickupCountry: "US",
  // Recipient
  recipientName: "",
  recipientPhone: "",
  recipientPhoneSecondary: "",
  recipientEmail: "",
  recipientAddress: "",
  recipientCity: "",
  recipientCountry: "HN",
  recipientState: "",
  // Package (shared across boxes)
  packageContents: "",
  declaredValue: "",
  // Schedule
  preferredDate: "",
  preferredTimeWindow: "08:00-12:00",
  specialInstructions: "",
};

function Field({
  label, required, children, hint,
}: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all";

export default function RecogerPage() {
  const { t, lang } = useT();
  const { data: session } = useSession();
  const [form, setForm] = useState(EMPTY);
  const [items, setItems] = useState<BoxItem[]>([{ ...DEFAULT_ITEM }]);
  const [shippingMode, setShippingMode] = useState<ShippingMode>("MARITIME");
  const [airWeight, setAirWeight] = useState(""); // total shipment weight for AIR/PER_LB
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  // Declared/insured value is mandatory on every shipment now — no opt-in.
  const [insuranceValue, setInsuranceValue] = useState("");
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [saveRecipientLabel, setSaveRecipientLabel] = useState("");
  const [savedPickupAddresses, setSavedPickupAddresses] = useState<SavedPickupAddress[]>([]);
  const [selectedPickupAddressId, setSelectedPickupAddressId] = useState("");
  const [savePickupAddress, setSavePickupAddress] = useState(false);
  const [savePickupAddressLabel, setSavePickupAddressLabel] = useState("");
  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Editing a field after picking a saved recipient means the data no
  // longer matches exactly what's saved — clear the selection so the
  // "save this recipient" option comes back if they want to save the edit.
  const setRecipientField = (field: string, value: string) => {
    set(field, value);
    setSelectedRecipientId(prev => (prev ? "" : prev));
  };

  // Same idea for the pickup address.
  const setPickupField = (field: string, value: string) => {
    set(field, value);
    setSelectedPickupAddressId(prev => (prev ? "" : prev));
  };

  const addItem = useCallback(() =>
    setItems(prev => [
      ...prev,
      shippingMode === "AIR" && getShippingConfig(form.recipientCountry).air === "FIXED_ITEM"
        ? { packageType: AIR_ITEM_TYPES[0], estimatedWeight: "" }
        : { ...DEFAULT_ITEM },
    ]), [shippingMode, form.recipientCountry]);
  const removeItem = useCallback((i: number) =>
    setItems(prev => prev.filter((_, idx) => idx !== i)), []);
  const updateItem = useCallback((i: number, field: keyof BoxItem, value: string) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item)), []);

  useEffect(() => {
    fetch("/api/pricing")
      .then(r => r.json())
      .then(d => { if (d.pricing) setPricingRules(d.pricing); })
      .catch(() => {});
  }, []);

  // Pre-fill contact info from session when user is logged in
  useEffect(() => {
    if (!session?.user) return;
    setForm(prev => ({
      ...prev,
      contactName: prev.contactName || (session.user as any).name || "",
      contactEmail: prev.contactEmail || session.user.email || "",
    }));
    // Try to fetch phone from user profile
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.phone) setForm(prev => ({ ...prev, contactPhone: prev.contactPhone || d.phone }));
      })
      .catch(() => {});
  }, [session]);

  // Recurring shippers: load saved recipients so recipient info can be
  // auto-filled instead of re-typed on every request.
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/saved-recipients")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data) setSavedRecipients(d.data); })
      .catch(() => {});
  }, [session]);

  // Same idea for the sender's pickup address, for shippers who always
  // ship from the same place.
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/saved-pickup-addresses")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data) setSavedPickupAddresses(d.data); })
      .catch(() => {});
  }, [session]);

  const applySavedRecipient = (id: string) => {
    setSelectedRecipientId(id);
    const r = savedRecipients.find(sr => sr.id === id);
    if (!r) return;
    setForm(prev => ({
      ...prev,
      recipientName: r.recipientName,
      recipientPhone: r.recipientPhone,
      recipientPhoneSecondary: r.recipientPhoneSecondary || "",
      recipientEmail: r.recipientEmail || "",
      recipientAddress: r.recipientAddress,
      recipientCity: r.recipientCity,
      recipientState: r.recipientState || "",
      recipientCountry: r.recipientCountry,
    }));
    // Already saved — no need to offer saving it again.
    setSaveRecipient(false);
    setSaveRecipientLabel("");
  };

  const applySavedPickupAddress = (id: string) => {
    setSelectedPickupAddressId(id);
    const a = savedPickupAddresses.find(sa => sa.id === id);
    if (!a) return;
    setForm(prev => ({
      ...prev,
      pickupAddress: a.address,
      pickupCity: a.city,
      pickupState: a.state || prev.pickupState,
      pickupPostalCode: a.postalCode || "",
      pickupCountry: a.country,
    }));
    // Already saved — no need to offer saving it again.
    setSavePickupAddress(false);
    setSavePickupAddressLabel("");
  };

  const isLoggedIn = !!session;

  // Which shipping modalities exist for the chosen destination country, and
  // which pricing mechanic "AIR" uses there (per-lb vs fixed fee per item).
  const shippingConfig = getShippingConfig(form.recipientCountry);
  const airKind = shippingConfig.air;

  // When the destination changes, snap the selected mode back to something
  // that's actually valid for that country, and reset the package section
  // to a sensible default for the new mode.
  useEffect(() => {
    setShippingMode(prev => {
      if (prev === "MARITIME" && shippingConfig.maritime) return prev;
      if (prev === "AIR" && shippingConfig.air) return prev;
      return shippingConfig.maritime ? "MARITIME" : "AIR";
    });
  }, [form.recipientCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shippingMode === "AIR" && airKind === "FIXED_ITEM") {
      setItems([{ packageType: AIR_ITEM_TYPES[0], estimatedWeight: "" }]);
    } else if (shippingMode === "MARITIME") {
      setItems(prev => (BOX_SIZES.some(b => b.value === prev[0]?.packageType) ? prev : [{ ...DEFAULT_ITEM }]));
    }
  }, [shippingMode, airKind]); // eslint-disable-line react-hooks/exhaustive-deps

  const ruleFor = (mode: ShippingMode, packageType: string) =>
    pricingRules.find(r => r.country === form.recipientCountry && r.shippingMode === mode && r.packageType === packageType);

  const airPerLbRule = ruleFor("AIR", AIR_PER_LB_KEY);
  const airMinWeight = airPerLbRule?.minWeight ?? shippingConfig.airWeightMin;
  const airMaxWeight = airPerLbRule?.maxWeight ?? shippingConfig.airWeightMax;
  const airWeightNum = parseFloat(airWeight) || 0;
  const airWeightOutOfRange =
    shippingMode === "AIR" && airKind === "PER_LB" && airWeightNum > 0 &&
    ((airMinWeight != null && airWeightNum < airMinWeight) || (airMaxWeight != null && airWeightNum > airMaxWeight));

  const priceOf = (item: BoxItem) => {
    if (shippingMode === "AIR" && airKind === "FIXED_ITEM") {
      return calcAirFixedItemPrice(ruleFor("AIR", item.packageType));
    }
    return calcMaritimePrice(item.packageType, parseFloat(item.estimatedWeight) || 0, ruleFor("MARITIME", item.packageType));
  };
  const totalPrice =
    shippingMode === "AIR" && airKind === "PER_LB"
      ? calcAirPerLbPrice(airWeightNum, airPerLbRule)
      : items.reduce((sum, item) => sum + priceOf(item), 0);
  // Clamp defensively — percent ultimately comes from the DB via a public
  // endpoint with no DB-level bound, so a bad value must never be able to
  // push the displayed price negative or apply more than a 100% discount.
  const discountPercent = discount ? Math.min(100, Math.max(0, discount.percent)) : 0;
  const discountAmount = discount ? (totalPrice * discountPercent) / 100 : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const applyDiscount = async () => {
    const code = discountInput.trim();
    setDiscountError("");
    if (!code) return;
    setCheckingDiscount(true);
    try {
      const res = await fetch(`/api/discounts?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.valid) {
        setDiscount({ code: data.code, percent: data.percent });
      } else {
        setDiscount(null);
        setDiscountError(t("recoger.discountInvalid"));
      }
    } catch {
      setDiscount(null);
      setDiscountError(t("recoger.discountInvalid"));
    } finally {
      setCheckingDiscount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.declaredValue || parseFloat(form.declaredValue) <= 0) {
      setError(t("recoger.declaredValueRequired"));
      return;
    }
    if (!insuranceValue || parseFloat(insuranceValue) <= 0) {
      setError(t("recoger.insuranceValueRequired"));
      return;
    }

    if (saveRecipient && !saveRecipientLabel.trim()) {
      setError(t("recoger.savedRecipientNameRequired"));
      return;
    }
    if (savePickupAddress && !savePickupAddressLabel.trim()) {
      setError(t("recoger.savedPickupAddressNameRequired"));
      return;
    }

    setLoading(true);

    const isAirPerLb = shippingMode === "AIR" && airKind === "PER_LB";

    let payload: Record<string, unknown>;
    if (isAirPerLb) {
      payload = {
        ...form,
        shippingMode,
        packageType: AIR_PER_LB_LABEL,
        estimatedWeight: airWeight ? parseFloat(airWeight) : null,
        dimensions: "",
        packageItems: null,
        destinationCountry: form.recipientCountry,
        recipientState: form.recipientState || null,
        discountCode: discount?.code || null,
        insuranceRequested: true,
        insuranceValue,
        lang,
      };
    } else {
      const firstItem = items[0];
      const isFixedItem = shippingMode === "AIR" && airKind === "FIXED_ITEM";
      const firstBox = BOX_SIZES.find((b) => b.value === firstItem.packageType);
      const packageItemsData = items.map(item => ({
        packageType: item.packageType,
        estimatedWeight: isFixedItem ? null : (item.estimatedWeight ? parseFloat(item.estimatedWeight) : null),
        dimensions: isFixedItem ? "" : (BOX_SIZES.find(b => b.value === item.packageType)?.dimensions || ""),
      }));
      payload = {
        ...form,
        shippingMode,
        packageType: firstItem.packageType,
        estimatedWeight: isFixedItem ? null : (firstItem.estimatedWeight ? parseFloat(firstItem.estimatedWeight) : null),
        dimensions: isFixedItem ? "" : (firstBox?.dimensions || ""),
        packageItems: JSON.stringify(packageItemsData),
        destinationCountry: form.recipientCountry,
        recipientState: form.recipientState || null,
        discountCode: discount?.code || null,
        insuranceRequested: true,
        insuranceValue,
        lang,
      };
    }

    try {
      const res = await fetch("/api/pickup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("recoger.errorCreate"));
        setLoading(false);
        return;
      }
      setTrackingCode(data.trackingCode);
      setSecurityCode(data.securityCode ?? "");
      setPaymentUrl(data.paymentUrl ?? "");

      // Save the recipient for next time — best-effort, doesn't block success
      if (saveRecipient && saveRecipientLabel.trim()) {
        fetch("/api/saved-recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: saveRecipientLabel.trim(),
            recipientName: form.recipientName,
            recipientPhone: form.recipientPhone,
            recipientPhoneSecondary: form.recipientPhoneSecondary || null,
            recipientEmail: form.recipientEmail || null,
            recipientAddress: form.recipientAddress,
            recipientCity: form.recipientCity,
            recipientState: form.recipientState || null,
            recipientCountry: form.recipientCountry,
            destinationCountry: form.recipientCountry,
          }),
        }).catch(() => {});
      }

      // Save the pickup address for next time — best-effort, doesn't block success
      if (savePickupAddress && savePickupAddressLabel.trim()) {
        fetch("/api/saved-pickup-addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: savePickupAddressLabel.trim(),
            address: form.pickupAddress,
            city: form.pickupCity,
            state: form.pickupState || null,
            postalCode: form.pickupPostalCode || null,
            country: form.pickupCountry,
          }),
        }).catch(() => {});
      }
    } catch {
      setError(t("recoger.connectionError"));
      setLoading(false);
    }
  };

  if (trackingCode) {
    const trackingUrl = `/rastreo/${trackingCode}`;
    const guiaUrl = `/guia/${trackingCode}`;
    const backUrl = isLoggedIn ? "/mi-cuenta" : "/";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{ background: "linear-gradient(135deg, #0b1f3a, #1d4f86, #123058)" }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/40">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{t("recoger.successTitle")}</h1>
          <p className="text-white/60 mb-8">{t("recoger.successDesc")}</p>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-6">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">{t("recoger.trackingCodeLabel")}</p>
            <p className="text-3xl font-mono font-black text-indigo-300">{trackingCode}</p>
            <p className="text-white/40 text-xs mt-3">{t("recoger.saveCode")}</p>
          </div>

          {paymentUrl && (
            <div className="bg-accent-500/15 backdrop-blur border-2 border-accent-400/50 rounded-2xl p-5 mb-6">
              <p className="text-accent-300 text-xs font-bold uppercase tracking-widest mb-3">
                {t("recoger.payNowLabel")}
              </p>
              <a
                href={paymentUrl}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all text-white bg-accent-500 hover:bg-accent-600"
              >
                {t("recoger.payNowButton")}
              </a>
              <p className="text-accent-200/70 text-xs mt-3">{t("recoger.payNowNote")}</p>
            </div>
          )}

          {securityCode && (
            <div className="bg-amber-500/15 backdrop-blur border-2 border-dashed border-amber-400/50 rounded-2xl p-5 mb-6">
              <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-2">
                {t("recoger.securityCodeLabel")}
              </p>
              <p className="text-3xl font-mono font-black text-amber-300 tracking-[0.25em]">{securityCode}</p>
              <p className="text-amber-200/70 text-xs mt-3">{t("recoger.securityCodeNote")}</p>
            </div>
          )}

          {/* Download guide button */}
          <a
            href={guiaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/20 text-emerald-300 font-semibold hover:bg-emerald-500/30 transition-all text-sm mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("recoger.downloadGuide")}
          </a>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={backUrl} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/10 transition-all text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {isLoggedIn ? t("recoger.goToAccount") : t("recoger.backHome")}
            </Link>
            <Link href={trackingUrl}
              className="flex-1 flex items-center justify-center py-3 rounded-xl font-semibold text-sm transition-all text-white"
              style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
              {t("recoger.trackPackage")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = "/"} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("recoger.back")}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-md"
              style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>OG</div>
            <span className="font-bold text-slate-900 text-sm">O&apos;Globo Cargo</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Link href="/mi-cuenta" className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {(session?.user?.name?.[0] ?? "U").toUpperCase()}
                </div>
                <span className="hidden sm:inline">{session?.user?.name?.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-indigo-600 font-semibold hover:text-indigo-700">
                {t("recoger.signIn")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-1">{t("recoger.title")}</h1>
          <p className="text-slate-500">{t("recoger.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Remitente ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">{t("recoger.senderSection")}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("recoger.fullName")} required>
                <input className={inputCls} value={form.contactName} onChange={e => set("contactName", e.target.value)} required />
              </Field>
              <Field label={t("recoger.phone")} required>
                <input className={inputCls} value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} required />
              </Field>
            </div>
            <Field label={t("recoger.email")} required>
              <input type="email" className={inputCls} value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} required />
            </Field>
          </section>

          {/* ── Dirección de recogida ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">{t("recoger.pickupSection")}</h2>
            </div>

            {savedPickupAddresses.length > 0 && (
              <Field label={t("recoger.useSavedPickupAddress")}>
                <select
                  className={inputCls + " bg-white"}
                  value={selectedPickupAddressId}
                  onChange={e => applySavedPickupAddress(e.target.value)}
                >
                  <option value="">{t("recoger.selectSavedPickupAddress")}</option>
                  {savedPickupAddresses.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={t("recoger.address")} required>
              <AddressAutocomplete
                value={form.pickupAddress}
                onChange={(v) => setPickupField("pickupAddress", v)}
                onSelect={(s) => {
                  setForm(prev => ({
                    ...prev,
                    pickupAddress: s.address || s.label,
                    pickupCity: s.city || prev.pickupCity,
                    // Only accept a valid 2-letter code — otherwise the select
                    // falls back to showing the wrong state
                    pickupState: US_STATES.includes(s.state) ? s.state : prev.pickupState,
                    pickupPostalCode: s.postcode || prev.pickupPostalCode,
                  }));
                  setSelectedPickupAddressId(prev => (prev ? "" : prev));
                }}
                countryCode="us"
                required
                className={inputCls + " pr-9"}
              />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label={t("recoger.city")} required>
                <input className={inputCls} value={form.pickupCity} onChange={e => setPickupField("pickupCity", e.target.value)} required />
              </Field>
              <Field label={t("recoger.state")} required>
                <select className={inputCls + " bg-white"} value={form.pickupState} onChange={e => setPickupField("pickupState", e.target.value)} required>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label={t("recoger.zip")} required>
                <input className={inputCls} value={form.pickupPostalCode} onChange={e => setPickupField("pickupPostalCode", e.target.value)} required />
              </Field>
            </div>

            {isLoggedIn && !selectedPickupAddressId && (
              <div className="rounded-xl border border-slate-200 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savePickupAddress}
                    onChange={e => setSavePickupAddress(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{t("recoger.savePickupAddressLabel")}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{t("recoger.savePickupAddressHint")}</span>
                  </span>
                </label>
                {savePickupAddress && (
                  <div className="mt-3 pl-7">
                    <Field label={t("recoger.savedPickupAddressName")} required>
                      <input
                        className={inputCls + " max-w-xs"}
                        value={savePickupAddressLabel}
                        onChange={e => setSavePickupAddressLabel(e.target.value)}
                        placeholder={t("recoger.savedPickupAddressNamePlaceholder")}
                        required={savePickupAddress}
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Destinatario ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">{t("recoger.recipientSection")}</h2>
            </div>

            {savedRecipients.length > 0 && (
              <Field label={t("recoger.useSavedRecipient")}>
                <select
                  className={inputCls + " bg-white"}
                  value={selectedRecipientId}
                  onChange={e => applySavedRecipient(e.target.value)}
                >
                  <option value="">{t("recoger.selectSavedRecipient")}</option>
                  {savedRecipients.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </Field>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("recoger.recipientName")} required>
                <input className={inputCls} value={form.recipientName} onChange={e => setRecipientField("recipientName", e.target.value)} required />
              </Field>
              <Field label={t("recoger.primaryPhone")} required>
                <input className={inputCls} value={form.recipientPhone} onChange={e => setRecipientField("recipientPhone", e.target.value)} required />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("recoger.secondaryPhone")} hint={t("recoger.secondaryPhoneHint")}>
                <input className={inputCls} value={form.recipientPhoneSecondary} onChange={e => setRecipientField("recipientPhoneSecondary", e.target.value)} />
              </Field>
              <Field label={t("recoger.recipientEmail")} hint={t("recoger.recipientEmailHint")}>
                <input type="email" className={inputCls} value={form.recipientEmail} onChange={e => setRecipientField("recipientEmail", e.target.value)} />
              </Field>
            </div>

            <Field label={t("recoger.deliveryAddress")} required>
              <input className={inputCls} value={form.recipientAddress} onChange={e => setRecipientField("recipientAddress", e.target.value)} required />
            </Field>

            <LocationPicker
              value={{
                country: form.recipientCountry,
                department: form.recipientState,
                city: form.recipientCity,
              }}
              onChange={({ country, department, city }) => {
                setForm(prev => ({
                  ...prev,
                  recipientCountry: country,
                  recipientState: department,
                  recipientCity: city,
                }));
                setSelectedRecipientId(prev => (prev ? "" : prev));
              }}
            />

            {isLoggedIn && !selectedRecipientId && (
              <div className="rounded-xl border border-slate-200 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveRecipient}
                    onChange={e => setSaveRecipient(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{t("recoger.saveRecipientLabel")}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{t("recoger.saveRecipientHint")}</span>
                  </span>
                </label>
                {saveRecipient && (
                  <div className="mt-3 pl-7">
                    <Field label={t("recoger.savedRecipientName")} required>
                      <input
                        className={inputCls + " max-w-xs"}
                        value={saveRecipientLabel}
                        onChange={e => setSaveRecipientLabel(e.target.value)}
                        placeholder={t("recoger.savedRecipientNamePlaceholder")}
                        required={saveRecipient}
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Paquete ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">{t("recoger.packageSection")}</h2>
            </div>

            {/* Shipping mode — only shown when the destination supports both */}
            {shippingConfig.maritime && shippingConfig.air && (
              <div className="flex gap-2">
                {(["MARITIME", "AIR"] as ShippingMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setShippingMode(mode)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      shippingMode === mode
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {mode === "MARITIME" ? t("recoger.modeMaritime") : t("recoger.modeAir")}
                  </button>
                ))}
              </div>
            )}

            {/* Air, per pound — single weight field for the whole shipment */}
            {shippingMode === "AIR" && airKind === "PER_LB" && (
              <div className="space-y-2">
                <Field label={t("recoger.totalWeight")} required>
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputCls + " pr-10"}
                      value={airWeight}
                      onChange={e => setAirWeight(e.target.value)}
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">lbs</span>
                  </div>
                </Field>
                {(airMinWeight != null || airMaxWeight != null) && (
                  <p className="text-xs text-slate-400">
                    {t("recoger.airWeightRange", { min: airMinWeight ?? "—", max: airMaxWeight ?? "—" })}
                  </p>
                )}
                {airWeightOutOfRange && (
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-xs text-red-700 leading-relaxed">{t("recoger.airWeightWarning")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Items list — box sizes (maritime) or fixed-fee item types (air) */}
            {!(shippingMode === "AIR" && airKind === "PER_LB") && (
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-slate-700">
                {shippingMode === "AIR" && airKind === "FIXED_ITEM" ? t("recoger.items") : t("recoger.boxes")} <span className="text-red-500">*</span>
              </p>
              {items.map((item, i) => (
                <div key={i} className="flex items-end gap-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  {/* Box icon */}
                  <div className="mb-0.5 shrink-0">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.packageType === "Documento"
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      }
                    </svg>
                  </div>
                  {/* Box / item type */}
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {shippingMode === "AIR" && airKind === "FIXED_ITEM"
                        ? (items.length > 1 ? `${t("recoger.item")} ${i + 1}` : t("recoger.itemType"))
                        : (items.length > 1 ? `${t("recoger.box")} ${i + 1}` : t("recoger.boxSize"))}
                    </label>
                    {shippingMode === "AIR" && airKind === "FIXED_ITEM" ? (
                      <select
                        value={item.packageType}
                        onChange={e => updateItem(i, "packageType", e.target.value)}
                        className={inputCls + " bg-white py-2"}
                        required
                      >
                        {AIR_ITEM_TYPES.map(it => (
                          <option key={it} value={it}>{it}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={item.packageType}
                        onChange={e => updateItem(i, "packageType", e.target.value)}
                        className={inputCls + " bg-white py-2"}
                        required
                      >
                        {BOX_SIZES.map(b => (
                          <option key={b.value} value={b.value}>
                            {b.value === "Documento" ? t("recoger.boxDoc") : b.value}
                            {b.dimensions ? ` (${b.dimensions})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {/* Weight — not used for fixed-fee air items, price doesn't depend on it */}
                  {!(shippingMode === "AIR" && airKind === "FIXED_ITEM") && (
                    <div className="w-32 shrink-0">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t("recoger.weightLabel")}</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          className={inputCls + " pr-10 py-2"}
                          value={item.estimatedWeight}
                          onChange={e => updateItem(i, "estimatedWeight", e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">lbs</span>
                      </div>
                    </div>
                  )}
                  {/* Remove */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title={t("recoger.removeBox")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* Add box button */}
              <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {shippingMode === "AIR" && airKind === "FIXED_ITEM" ? t("recoger.addItem") : t("recoger.addBox")}
              </button>
            </div>
            )}

            <Field label={t("recoger.contents")} required>
              <input
                className={inputCls}
                value={form.packageContents}
                onChange={e => set("packageContents", e.target.value)}

                required
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("recoger.declaredValue")} hint={t("recoger.declaredValueHint")} required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={inputCls + " pl-7"}
                    value={form.declaredValue}
                    onChange={e => set("declaredValue", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </Field>
              <Field label={t("recoger.insuranceValue")} hint={t("recoger.insuranceHint")} required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={inputCls + " pl-7"}
                    value={insuranceValue}
                    onChange={e => setInsuranceValue(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* ── Fecha y hora ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">{t("recoger.scheduleSection")}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("recoger.preferredDate")} required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.preferredDate}
                  onChange={e => set("preferredDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </Field>
              <Field label={t("recoger.timeWindow")} required>
                <select className={inputCls + " bg-white"} value={form.preferredTimeWindow} onChange={e => set("preferredTimeWindow", e.target.value)} required>
                  {TIME_WINDOWS.map(tw => <option key={tw.value} value={tw.value}>{t(`recoger.${tw.labelKey}`)}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">{t("recoger.dateNotice")}</p>
            </div>
            <Field label={t("recoger.specialInstructions")} hint={t("recoger.specialInstructionsHint")}>
              <textarea
                className={inputCls + " resize-none"}
                rows={3}
                value={form.specialInstructions}
                onChange={e => set("specialInstructions", e.target.value)}
                placeholder={t("recoger.specialInstructionsPlaceholder")}
              />
            </Field>
          </section>

          {/* Price estimate */}
          {items.length > 0 && (
            <section className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-0.5">{t("recoger.priceEstimate")}</p>
                  {discount ? (
                    <p className="text-3xl font-black text-slate-900">
                      ${finalPrice.toFixed(2)}{" "}
                      <span className="text-base font-semibold text-slate-400 line-through">${totalPrice.toFixed(2)}</span>
                    </p>
                  ) : (
                    <p className="text-3xl font-black text-slate-900">${totalPrice.toFixed(2)}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{t("recoger.priceNote")}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 space-y-1">
                    {shippingMode === "AIR" && airKind === "PER_LB" ? (
                      <div className="flex items-center justify-end gap-2">
                        <span>{t("recoger.airPriceRow", { weight: airWeightNum, rate: (airPerLbRule?.pricePerLb ?? 0).toFixed(2) })}:</span>
                        <span className="font-bold text-slate-700">${totalPrice.toFixed(2)}</span>
                      </div>
                    ) : items.map((item, i) => {
                      const p = priceOf(item);
                      return (
                        <div key={i} className="flex items-center justify-end gap-2">
                          <span>
                            {items.length > 1
                              ? `${t("recoger.box")} ${i + 1} (${item.packageType})`
                              : t("recoger.priceBase")}:
                          </span>
                          <span className="font-bold text-slate-700">${p.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    {discount && (
                      <div className="flex items-center justify-end gap-2 text-emerald-600">
                        <span>{t("recoger.discountRow", { code: discount.code })}:</span>
                        <span className="font-bold">−${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {(items.length > 1 || discount) && (
                      <div className="flex items-center justify-end gap-2 border-t border-indigo-200 pt-1 mt-1">
                        <span className="font-semibold text-slate-600">{t("recoger.total")}:</span>
                        <span className="font-black text-indigo-700">${finalPrice.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discount code */}
              <div className="mt-4 pt-4 border-t border-indigo-200/70">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1.5">
                  {t("recoger.discountLabel")}
                </label>
                <div className="flex gap-2 max-w-sm">
                  <input
                    className={inputCls + " bg-white"}
                    value={discountInput}
                    onChange={e => { setDiscountInput(e.target.value); setDiscountError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyDiscount(); } }}
                  />
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={checkingDiscount || !discountInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shrink-0"
                  >
                    {checkingDiscount ? "..." : t("recoger.discountApply")}
                  </button>
                </div>
                {discount && (
                  <p className="text-xs font-semibold text-emerald-600 mt-1.5">
                    ✓ {t("recoger.discountApplied", { code: discount.code, percent: discountPercent })}
                  </p>
                )}
                {discountError && (
                  <p className="text-xs font-semibold text-red-500 mt-1.5">{discountError}</p>
                )}
                {!discount && !discountError && (
                  <p className="text-xs text-slate-400 mt-1.5">{t("recoger.discountOptional")}</p>
                )}
              </div>
            </section>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            style={{ background: loading ? "#4d80b4" : "linear-gradient(135deg,#1d4f86,#2c629b)" }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("recoger.submitting")}
              </>
            ) : (
              <>
                {t("recoger.submit")}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 pb-4">
            {t("recoger.alreadyAccount")}{" "}
            <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">{t("recoger.signInLink")}</Link>
            {" "}{t("recoger.toSaveRequests")}
          </p>
        </form>
      </div>
    </div>
  );
}
