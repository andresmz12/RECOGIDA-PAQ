"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatPickupDate } from "@/lib/utils";
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
  const { data: session } = useSession();
  const { t, lang } = useT();

  // "Back" should return the user to where they came from: customers to
  // their account, staff to the dashboard, guests to the landing page.
  const role = (session?.user as { role?: string } | undefined)?.role;
  const backHref = !role ? "/" : role === "CUSTOMER" ? "/mi-cuenta" : "/dashboard";
  const backLabel = !role
    ? "rastreo.backHome"
    : role === "CUSTOMER"
    ? "rastreo.backToAccount"
    : "rastreo.backToPanel";
  const locale = lang === "en" ? "en-US" : "es-CO";
  const trackingCode = params.trackingCode as string;
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `Tracking ${trackingCode}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

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
            <svg className="w-14 h-14 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V7a2 2 0 00-1-1.73l-6-3.46a2 2 0 00-2 0l-6 3.46A2 2 0 004 7v6a2 2 0 001 1.73l6 3.46a2 2 0 002 0l6-3.46A2 2 0 0020 13z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.27 6.96L12 12.01l7.73-5.05M12 22.08V12" />
            </svg>
            <h1 className="text-2xl font-black text-slate-900 mb-3">{t("rastreo.notFound")}</h1>
            <p className="text-slate-600 mb-8">{error}</p>
            <div className="flex gap-3 justify-center">
              <Link href={backHref}>
                <Button variant="outline">{t(backLabel)}</Button>
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
  const formattedDate = formatPickupDate(tracking.estimatedPickupDate, locale, {
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
        {/* Back link + share + lang switcher */}
        <div className="flex items-center justify-between mb-8">
          <Link href={backHref} className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5">
            {t(backLabel)}
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-600">{t("rastreo.linkCopied")}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {t("rastreo.share")}
                </>
              )}
            </button>
            <LanguageSwitcher />
          </div>
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
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t("rastreo.estimatedDate")}
              </h3>
              <p className="text-2xl font-bold text-slate-900">{formattedDate}</p>
              <p className="text-xs text-slate-500 mt-2">{t("rastreo.scheduledDate")}</p>
            </Card>

            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("rastreo.timeWindow")}
              </h3>
              <p className="text-2xl font-bold text-slate-900">{tracking.preferredTimeWindow}</p>
              <p className="text-xs text-slate-500 mt-2">{t("rastreo.timeWindowDesc")}</p>
            </Card>
          </div>
        )}

        {/* Status History Timeline */}
        {tracking.statusHistory.length > 0 && (
          <Card variant="default" padding="lg" className="mb-8">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {t("rastreo.updateHistory")}
            </h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-6">
                {[...tracking.statusHistory].reverse().map((entry, i) => {
                  // A case-opened event doesn't change the shipment status
                  // (fromStatus === toStatus) — flag it visually as an
                  // incident note instead of a routine status transition.
                  const isCaseEvent = !!entry.notes && entry.fromStatus === entry.toStatus;
                  return (
                    <div key={i} className="flex gap-4 pl-10 relative">
                      <div className={`absolute left-0 w-6 h-6 bg-white border-2 rounded-full flex items-center justify-center shrink-0 ${isCaseEvent ? "border-amber-500" : "border-indigo-500"}`}>
                        <div className={`w-2 h-2 rounded-full ${isCaseEvent ? "bg-amber-500" : "bg-indigo-500"}`} />
                      </div>
                      <div className="flex-1">
                        {isCaseEvent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500" />
                            {entry.notes}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.fromStatus && (
                              <>
                                <StatusBadge status={entry.fromStatus} />
                                <span className="text-slate-300 text-sm">→</span>
                              </>
                            )}
                            <StatusBadge status={entry.toStatus} />
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString(locale, {
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {entry.notes && !isCaseEvent && (
                          <p className="text-sm mt-2 px-3 py-2 rounded-lg border text-slate-700 bg-slate-50 border-slate-100">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
            <Link href={backHref}>
              <Button variant="outline">{t(backLabel)}</Button>
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
