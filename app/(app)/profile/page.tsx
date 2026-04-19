"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Compass,
  Globe,
  Heart,
  Mail,
  MapPin,
  Sparkles,
  Pencil,
  Check,
  X,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";

const allActivities = [
  "Wildlife",
  "Road trips",
  "Photography",
  "Hiking",
  "Culture",
  "Food & Wine",
  "Relaxation",
  "Adventure",
];

const travelStyles = [
  "Global Citizen",
  "Luxury Traveler",
  "Backpacker",
  "Family Explorer",
  "Digital Nomad",
  "Weekend Warrior",
];

export default function ProfilePage() {
  const viewer = useQuery(api.users.getViewerProfile);
  const updatePreferences = useMutation(api.users.updateViewerPreferences);

  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // Form State
  const [draftHomeCountry, setDraftHomeCountry] = useState<string | null>(null);
  const [draftTravelStyle, setDraftTravelStyle] = useState<string | null>(null);
  const [draftActivities, setDraftActivities] = useState<string[]>([]);

  if (viewer === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-[#9a9f97]" />
      </div>
    );
  }

  if (viewer === null) {
    return null; // Not authenticated
  }

  const profile = viewer;
  const activities = profile.preferredActivities.length
    ? profile.preferredActivities
    : ["Wildlife", "Road trips", "Photography"];

  const initials =
    profile.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "T";

  function handleEdit() {
    setDraftHomeCountry(profile.homeCountry);
    setDraftTravelStyle(profile.travelStyle);
    setDraftActivities(activities);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  async function handleSave() {
    setBusy(true);
    try {
      await updatePreferences({
        homeCountry: draftHomeCountry?.trim() || null,
        travelStyle: draftTravelStyle || null,
        preferredActivities: draftActivities,
      });
      setIsEditing(false);
    } finally {
      setBusy(false);
    }
  }

  function toggleActivity(activity: string) {
    if (draftActivities.includes(activity)) {
      setDraftActivities((prev) => prev.filter((a) => a !== activity));
    } else {
      setDraftActivities((prev) => [...prev, activity]);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#17181a] text-lg font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[#17181a]">
              {profile.name}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#71776e]">
              <Mail className="size-3.5" />
              {profile.email}
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleEdit}
            className="pill-button flex h-10 items-center gap-2 rounded-xl bg-[#ededeb] px-4 text-xs font-semibold text-[#17181a] hover:bg-[#e4e4e2]"
          >
            <Pencil className="size-3.5" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="pill-button flex h-10 items-center justify-center rounded-xl border border-[#e5e5e3] bg-white px-3 text-[#5d635a] hover:bg-[#fafaf8]"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="pill-button flex h-10 items-center gap-2 rounded-xl bg-[#9fe870] px-4 text-xs font-bold text-[#163300] shadow-sm disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {/* ── Info rows ── */}
      <div className="divide-y divide-[#f0f0ee]">
        {/* Travel style */}
        <div className="flex flex-col py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f2f0]">
              <Compass className="size-4 text-[#71776e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#17181a]">
                Travel style
              </p>
              <p className="text-xs text-[#9a9f97]">How you like to explore</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            {isEditing ? (
              <select
                value={draftTravelStyle ?? ""}
                onChange={(e) => setDraftTravelStyle(e.target.value)}
                className="w-full rounded-xl border border-[#e5e5e3] bg-white px-3 py-2 text-sm font-medium text-[#17181a] outline-none focus:border-[#17181a] sm:w-auto"
              >
                <option value="" disabled>
                  Select a style
                </option>
                {travelStyles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-[#3a3f38]">
                {profile.travelStyle ?? "Not set"}
              </p>
            )}
          </div>
        </div>

        {/* Home country */}
        <div className="flex flex-col py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f2f0]">
              <Globe className="size-4 text-[#71776e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#17181a]">
                Home country
              </p>
              <p className="text-xs text-[#9a9f97]">Where you&apos;re from</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            {isEditing ? (
              <input
                type="text"
                placeholder="e.g. United Kingdom"
                value={draftHomeCountry ?? ""}
                onChange={(e) => setDraftHomeCountry(e.target.value)}
                className="w-full rounded-xl border border-[#e5e5e3] bg-white px-3 py-2 text-sm font-medium text-[#17181a] outline-none placeholder:text-[#b5b9b2] focus:border-[#17181a] sm:w-auto sm:text-right"
              />
            ) : (
              <p className="text-sm font-medium text-[#3a3f38]">
                {profile.homeCountry ?? "Not set"}
              </p>
            )}
          </div>
        </div>

        {/* Onboarding */}
        {!isEditing && (
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f2f0]">
                <Sparkles className="size-4 text-[#71776e]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#17181a]">
                  Onboarding
                </p>
                <p className="text-xs text-[#9a9f97]">Profile setup progress</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                profile.onboardingCompleted
                  ? "bg-[#e8f5e0] text-[#2d5a1b]"
                  : "bg-[#f5f0e0] text-[#6b5a2d]"
              }`}
            >
              {profile.onboardingCompleted ? "Complete" : "Pending"}
            </span>
          </div>
        )}
      </div>

      {/* ── Interests ── */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <Heart className="size-4 text-[#9a9f97]" />
          <h2 className="text-sm font-semibold text-[#17181a]">Interests</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {isEditing
            ? allActivities.map((activity) => {
                const isSelected = draftActivities.includes(activity);
                return (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => toggleActivity(activity)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-[#17181a] text-white"
                        : "bg-[#ededeb] text-[#5d635a] hover:bg-[#e4e4e2]"
                    }`}
                  >
                    {activity}
                  </button>
                );
              })
            : activities.map((activity) => (
                <span
                  key={activity}
                  className="rounded-full bg-[#ededeb] px-3 py-1.5 text-xs font-medium text-[#3a3f38]"
                >
                  {activity}
                </span>
              ))}
        </div>
      </div>

      {/* ── Account section ── */}
      {!isEditing && (
        <div className="rounded-xl border border-[#e8e8e6] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#f2f2f0]">
              <MapPin className="size-4 text-[#71776e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#17181a]">Account</p>
              <p className="text-xs text-[#9a9f97]">
                Your account is currently active and authenticated.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
