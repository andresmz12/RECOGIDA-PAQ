"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";

interface Courier {
  id: string;
  name: string;
}

interface PickupDetail {
  id: string;
  trackingCode: string;
  createdAt: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string | null;
  pickupPostalCode: string | null;
  pickupCountry: string;
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
  packageType: string;
  estimatedWeight: number | null;
  dimensions: string | null;
  packageContents: string | null;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions: string | null;
  notes: string | null;
  status: string;
  assignedCourier?: { id: string; name: string } | null;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
    notes: string | null;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  SCHEDULED: "Scheduled",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-900 font-medium">{value || <span className="text-slate-300">—</span>}</p>
    </div>
  );
}

export default function SolicitudDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [newCourierId, setNewCourierId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTimeWindow, setNewTimeWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    const load = async () => {
      const [pickupRes, couriersRes] = await Promise.all([
        fetch(`/api/pickup-requests/${id}`),
        ["ADMIN", "DISPATCHER"].includes(role)
          ? fetch("/api/couriers")
          : Promise.resolve(null),
      ]);
      if (!pickupRes.ok) { router.push("/dashboard/solicitudes"); return; }
      const data = await pickupRes.json();
      setPickup(data);
      setNewStatus(data.status);
      setNewCourierId(data.assignedCourier?.id ?? "");
      setNewDate(data.preferredDate ? new Date(data.preferredDate).toISOString().split("T")[0] : "");
      setNewTimeWindow(data.preferredTimeWindow ?? "");

      if (couriersRes) {
        const ud = await couriersRes.json();
        setCouriers(ud.couriers ?? []);
      }
      setLoading(false);
    };
    load();
  }, [status, id, role, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup) return;
    setUpdating(true);
    try {
      const body: any = { status: newStatus };
      if (notes) body.notes = notes;
      if (newCourierId) body.assignedCourierId = newCourierId;
      if (newDate) body.preferredDate = newDate;
      if (newTimeWindow) body.preferredTimeWindow = newTimeWindow;
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setPickup(updated);
        setNotes("");
        setToast("Request updated");
        setTimeout(() => setToast(""), 3000);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCourierAction = async (newStatusValue: string) => {
    if (!pickup) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatusValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPickup(updated);
        setNewStatus(updated.status);
        const msg = newStatusValue === "SCHEDULED"
          ? "Customer notified. On my way!"
          : "Pickup confirmed! Customer notified.";
        setToast(msg);
        setTimeout(() => setToast(""), 3500);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pickup) return null;

  const isCompleted = pickup.status === "PICKED_UP" || pickup.status === "CANCELLED";

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2">
            <Alert
              type="success"
              title="Success"
              message={toast}
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/solicitudes" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 mb-4 w-fit">
            ← Back to requests
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-slate-900 font-mono">{pickup.trackingCode}</h1>
                <StatusBadge status={pickup.status} />
              </div>
              <p className="text-slate-600">
                Created on {new Date(pickup.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">👤</span>
                Sender Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label="Name" value={pickup.contactName} />
                <InfoRow label="Phone" value={pickup.contactPhone} />
                <InfoRow label="Email" value={pickup.contactEmail} />
                {pickup.assignedCourier && (
                  <InfoRow label="Assigned courier" value={pickup.assignedCourier.name} />
                )}
              </div>
            </Card>

            {/* Recipient */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">🏠</span>
                Recipient Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label="Name" value={pickup.recipientName} />
                <InfoRow label="Phone" value={pickup.recipientPhone} />
                {pickup.recipientPhoneSecondary && (
                  <InfoRow label="Secondary phone" value={pickup.recipientPhoneSecondary} />
                )}
                {pickup.recipientEmail && (
                  <InfoRow label="Email" value={pickup.recipientEmail} />
                )}
                <div className="sm:col-span-2">
                  <InfoRow label="Destination address" value={pickup.recipientAddress} />
                </div>
                <InfoRow label="City" value={pickup.recipientCity} />
                {pickup.recipientState && (
                  <InfoRow label="State/Province" value={pickup.recipientState} />
                )}
                {pickup.recipientPostalCode && (
                  <InfoRow label="Postal code" value={pickup.recipientPostalCode} />
                )}
                <InfoRow label="Country" value={pickup.recipientCountry} />
              </div>
            </Card>

            {/* Address */}
            <Card variant="default" padding="lg">
              <div className="flex items-start justify-between gap-4 mb-5">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  Pickup Address
                </h2>
                {/* Navigation buttons */}
                {pickup.pickupAddress && (
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${pickup.pickupAddress}, ${pickup.pickupCity}${pickup.pickupState ? ", " + pickup.pickupState : ""}`)}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(`${pickup.pickupAddress}, ${pickup.pickupCity}${pickup.pickupState ? ", " + pickup.pickupState : ""}`)}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.54 6.55C19.18 4.38 16.96 3 14.5 3c-3.7 0-6.8 2.77-7.42 6.35C4.73 10.15 3 12.13 3 14.5 3 17.54 5.46 20 8.5 20c.96 0 1.86-.27 2.63-.73.59.45 1.32.73 2.12.73 1.65 0 3.06-1.14 3.43-2.68.18.02.37.03.57.03 2.62 0 4.75-2.13 4.75-4.75 0-2.37-1.71-4.37-4-.98zM9 14.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25S10.25 12.31 10.25 13 9.69 14.25 9 14.25zm6 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                      </svg>
                      Waze
                    </a>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <InfoRow label="Address" value={pickup.pickupAddress} />
                </div>
                <InfoRow label="City" value={pickup.pickupCity} />
                {pickup.pickupState && (
                  <InfoRow label="State" value={pickup.pickupState} />
                )}
                {pickup.pickupPostalCode && (
                  <InfoRow label="Postal code" value={pickup.pickupPostalCode} />
                )}
                <InfoRow label="Origin country" value={pickup.pickupCountry} />
                <InfoRow label="Destination country" value={pickup.destinationCountry} />
              </div>
            </Card>

            {/* Package */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">📦</span>
                Package Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label="Type" value={pickup.packageType} />
                <InfoRow label="Estimated weight" value={pickup.estimatedWeight ? `${pickup.estimatedWeight} kg` : null} />
                <InfoRow label="Dimensions" value={pickup.dimensions} />
                <InfoRow label="Preferred date" value={new Date(pickup.preferredDate).toLocaleDateString("en-US")} />
                <InfoRow label="Time window" value={pickup.preferredTimeWindow} />
              </div>
              {pickup.packageContents && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <InfoRow label="Package contents" value={pickup.packageContents} />
                </div>
              )}
              {pickup.specialInstructions && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <InfoRow label="Special instructions" value={pickup.specialInstructions} />
                </div>
              )}
            </Card>

            {/* Status history */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-xl">📋</span>
                Status History
              </h2>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-6">
                  {[...pickup.statusHistory].reverse().map((entry, i) => (
                    <div key={entry.id} className="flex gap-4 pl-10 relative">
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
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-slate-700 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar: actions */}
          <div>
            {["ADMIN", "DISPATCHER"].includes(role) && (
              <Card variant="default" padding="lg" className="sticky top-8">
                <h2 className="font-bold text-slate-900 mb-6">Update request</h2>
                <form onSubmit={handleUpdate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="PICKED_UP">Picked up</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  {couriers.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Assign courier</label>
                      <select
                        value={newCourierId}
                        onChange={(e) => setNewCourierId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                      >
                        <option value="">Unassigned</option>
                        {couriers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pickup date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Time window</label>
                    <select
                      value={newTimeWindow}
                      onChange={(e) => setNewTimeWindow(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    >
                      <option value="">No change</option>
                      <option value="Morning (8am - 12pm)">Morning (8am - 12pm)</option>
                      <option value="Afternoon (12pm - 5pm)">Afternoon (12pm - 5pm)</option>
                      <option value="Evening (5pm - 9pm)">Evening (5pm - 9pm)</option>
                      <option value="All day (8am - 9pm)">All day (8am - 9pm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Optional notes..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={updating}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </Card>
            )}

            {role === "COURIER" && !isCompleted && (
              <Card variant="default" padding="lg" className="sticky top-8">
                <h2 className="font-bold text-slate-900 mb-6">Actions</h2>

                {pickup.status === "ASSIGNED" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">Confirm you are on your way to the pickup address.</p>
                    <button
                      onClick={() => handleCourierAction("SCHEDULED")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 text-sm"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "🚗 On my way — Notify customer"}
                    </button>
                  </div>
                )}

                {pickup.status === "SCHEDULED" && (
                  <div className="space-y-3">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-bold text-indigo-700 mb-1">ON THE WAY</p>
                      <p className="text-sm text-indigo-600">The customer was notified you are on your way.</p>
                    </div>
                    <p className="text-sm text-slate-600">Confirm once you have the package in hand.</p>
                    <button
                      onClick={() => handleCourierAction("PICKED_UP")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-200 text-sm"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "✅ Confirm pickup"}
                    </button>
                  </div>
                )}

                {pickup.status === "PENDING" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-amber-800 font-medium">This request has not been formally assigned to you yet. Contact the administrator.</p>
                  </div>
                )}
              </Card>
            )}

            {role === "COURIER" && isCompleted && (
              <Card variant="default" padding="lg" className="sticky top-8">
                {pickup.status === "PICKED_UP" ? (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">Pickup completed</p>
                      <p className="text-emerald-700 text-xs">Customer was notified by email</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <p className="font-bold text-slate-700 text-sm">Request cancelled</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
