"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface StatusHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  createdAt: string;
}

interface TrackingData {
  trackingCode: string;
  status: string;
  estimatedPickupDate: string;
  preferredTimeWindow: string;
  lastUpdated: string;
  statusHistory: StatusHistoryEntry[];
}

const STEPS = ["PENDING", "ASSIGNED", "SCHEDULED", "PICKED_UP"];
const STATUS_MSG_KEY: Record<string, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  SCHEDULED: "Scheduled",
  PICKED_UP: "PickedUp",
  CANCELLED: "Cancelled",
};

function stepIndex(status: string) {
  return STEPS.indexOf(status);
}

export default function RastreoPage() {
  const params = useParams();
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "es-CO";
  const trackingCode = params.trackingCode as string;
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trackingCode) return;

    const fetchTracking = async () => {
      try {
        const res = await fetch(`/api/track/${trackingCode}`);
        if (!res.ok) {
          setError(t("rastreo.trackingNotFound"));
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTracking(data);
      } catch {
        setError(t("rastreo.errorLoad"));
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [trackingCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-slate-600 font-medium">{t("rastreo.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4">
        <Container size="md">
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">{t("rastreo.notFound")}</h1>
            <p className="text-slate-600 mb-8">{error}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">{t("rastreo.backHome")}</Button>
              </Link>
              <Link href="/recoger">
                <Button variant="primary">{t("rastreo.createNew")}</Button>
              </Link>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!tracking) return null;

  const isCancelled = tracking.status === "CANCELLED";
  const currentStep = stepIndex(tracking.status);
  const formattedDate = new Date(tracking.estimatedPickupDate).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const lastUpdateDate = new Date(tracking.lastUpdated).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12">
      <Container size="md">
        {/* Back link + lang switcher */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5">
            {t("rastreo.backHome")}
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">{t("rastreo.pageTitle")}</h1>
          <p className="text-slate-600">{t("rastreo.pageSubtitle")}</p>
        </div>

        {/* Tracking Code */}
        <Card variant="elevated" padding="lg" className="mb-8 border-indigo-100">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">{t("rastreo.trackingCodeLabel")}</p>
            <p className="text-4xl font-black text-indigo-600 font-mono">{tracking.trackingCode}</p>
            <p className="text-xs text-slate-500 mt-3">{t("rastreo.saveCode")}</p>
          </div>
        </Card>

        {/* Status Section */}
        <Card variant="default" padding="lg" className="mb-8">
          <div className="text-center mb-6">
            <div className="mb-4">
              <StatusBadge status={tracking.status} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {t(`rastreo.status${STATUS_MSG_KEY[tracking.status] ?? tracking.status}`)}
            </h2>
            <p className="text-slate-600">
              {t(`rastreo.desc${STATUS_MSG_KEY[tracking.status] ?? tracking.status}`)}
            </p>
          </div>

          {/* Progress indicator */}
          {!isCancelled && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                {[t("rastreo.stepRequested"), t("rastreo.stepAssigned"), t("rastreo.stepOnWay"), t("rastreo.stepPickedUp")].map((label, i) => (
                  <div key={label} className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div className={`flex-1 h-1 ${i <= currentStep ? "bg-indigo-600" : "bg-slate-200"}`} />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                        i <= currentStep ? "bg-indigo-600" : "bg-slate-200 text-slate-400"
                      }`}>
                        {i < currentStep ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      {i < 3 && (
                        <div className={`flex-1 h-1 ${i < currentStep ? "bg-indigo-600" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-2 text-center">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Details Grid */}
        {!isCancelled && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">📅 {t("rastreo.estimatedDate")}</h3>
              <p className="text-2xl font-bold text-slate-900">{formattedDate}</p>
              <p className="text-xs text-slate-500 mt-2">{t("rastreo.scheduledDate")}</p>
            </Card>

            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">⏰ {t("rastreo.timeWindow")}</h3>
              <p className="text-2xl font-bold text-slate-900">{tracking.preferredTimeWindow}</p>
              <p className="text-xs text-slate-500 mt-2">{t("rastreo.timeWindowDesc")}</p>
            </Card>
          </div>
        )}

        {/* Status History Timeline */}
        {tracking.statusHistory.length > 0 && (
          <Card variant="default" padding="lg" className="mb-8">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>📋</span> {t("rastreo.updateHistory")}
            </h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-6">
                {[...tracking.statusHistory].reverse().map((entry, i) => (
                  <div key={i} className="flex gap-4 pl-10 relative">
                    <div className="absolute left-0 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.fromStatus && (
                          <>
                            <StatusBadge status={entry.fromStatus} />
                            <span className="text-slate-300 text-sm">→</span>
                          </>
                        )}
                        <StatusBadge status={entry.toStatus} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 font-medium">
                        {new Date(entry.createdAt).toLocaleDateString(locale, {
                          year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-slate-700 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Last Update */}
        <Card variant="filled" padding="lg" className="mb-8 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <p className="text-sm font-semibold text-slate-600">{t("rastreo.lastUpdated")}</p>
              <p className="text-slate-700 font-medium">{lastUpdateDate}</p>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="text-center space-y-4">
          <p className="text-slate-600 font-medium">{t("rastreo.needHelp")}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/">
              <Button variant="outline">{t("rastreo.backHome")}</Button>
            </Link>
            <Link href="/recoger">
              <Button variant="primary">{t("rastreo.createNew")} →</Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
