"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Eye, EyeOff, Hotel, Landmark, Send, Sparkles } from "lucide-react";
import { useState } from "react";

type ListingType = "landmark" | "activity" | "stay";
type BookingStatus = "draft" | "requested" | "confirmed" | "declined" | "cancelled";

type AdminListing = {
  _id: Id<"places">;
  title: string;
  region: string;
  category: string;
  listingType: ListingType;
  isVisibleOnMap: boolean;
  offers: Array<{
    _id: Id<"bookableOffers">;
    title: string;
    listingType: "activity" | "stay";
    status: "active" | "paused";
    priceEstimate: number;
    currency: string;
  }>;
};

type AdminBooking = {
  _id: Id<"bookingRequests">;
  status: BookingStatus;
  guestCount: number;
  estimatedTotal: number;
  currency: string;
  travelerName: string;
  offerTitle: string;
  placeTitle: string;
  updatedAt: number;
};

const listingTypeIcons = {
  landmark: Landmark,
  activity: Sparkles,
  stay: Hotel,
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminPanel() {
  const state = useQuery(api.admins.getAdminPanelState) as
    | { listings: AdminListing[]; bookingRequests: AdminBooking[] }
    | undefined;
  const updateListingVisibility = useMutation(api.admins.updateListingVisibility);
  const updateListingType = useMutation(api.admins.updateListingType);
  const updateOfferStatus = useMutation(api.admins.updateOfferStatus);
  const updateBookingStatus = useMutation(api.admins.updateBookingStatus);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!state) {
    return (
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-[#e5e8e2] bg-white p-5 text-sm font-bold text-[#66705f]">
          Loading admin panel...
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#7a8374]">Admin</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#17181a]">Listings and bookings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66705f]">
          Control what appears on Explore and handle activity or stay requests.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="space-y-3">
          {state.listings.map((listing) => {
            const Icon = listingTypeIcons[listing.listingType];
            return (
              <article key={listing._id} className="rounded-2xl border border-[#e5e8e2] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-[#8bd65b]" />
                      <p className="truncate text-base font-black text-[#17181a]">{listing.title}</p>
                    </div>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#7a8374]">
                      {listing.region} / {listing.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === listing._id}
                    onClick={() => {
                      setPendingId(listing._id);
                      void updateListingVisibility({
                        placeId: listing._id,
                        isVisibleOnMap: !listing.isVisibleOnMap,
                      }).finally(() => setPendingId(null));
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
                      listing.isVisibleOnMap ? "bg-[#eef6e7] text-[#315117]" : "bg-[#f3f4ef] text-[#737a70]"
                    }`}
                  >
                    {listing.isVisibleOnMap ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    {listing.isVisibleOnMap ? "Showing" : "Hidden"}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[12rem_1fr]">
                  <select
                    value={listing.listingType}
                    onChange={(event) => {
                      setPendingId(listing._id);
                      void updateListingType({
                        placeId: listing._id,
                        listingType: event.target.value as ListingType,
                      }).finally(() => setPendingId(null));
                    }}
                    className="rounded-xl border border-[#e5e8e2] bg-[#fbfcf8] px-3 py-2 text-sm font-bold text-[#17181a] outline-none"
                  >
                    <option value="landmark">Landmark</option>
                    <option value="activity">Activity</option>
                    <option value="stay">Stay</option>
                  </select>

                  <div className="flex flex-wrap gap-2">
                    {listing.offers.length === 0 ? (
                      <span className="rounded-full bg-[#f3f4ef] px-3 py-2 text-xs font-bold text-[#737a70]">
                        No booking offer
                      </span>
                    ) : null}
                    {listing.offers.map((offer) => (
                      <button
                        key={offer._id}
                        type="button"
                        disabled={pendingId === offer._id}
                        onClick={() => {
                          setPendingId(offer._id);
                          void updateOfferStatus({
                            offerId: offer._id,
                            status: offer.status === "active" ? "paused" : "active",
                          }).finally(() => setPendingId(null));
                        }}
                        className="rounded-full border border-[#e5e8e2] bg-[#fbfcf8] px-3 py-2 text-xs font-bold text-[#394038]"
                      >
                        {offer.status === "active" ? "Active" : "Paused"}: {offer.title} / {money(offer.priceEstimate, offer.currency)}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-3">
          {state.bookingRequests.map((request) => (
            <article key={request._id} className="rounded-2xl border border-[#e5e8e2] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#17181a]">{request.offerTitle}</p>
                  <p className="mt-1 text-xs font-bold text-[#70786b]">
                    {request.travelerName} / {request.placeTitle}
                  </p>
                </div>
                <span className="rounded-full bg-[#f2f3ee] px-2.5 py-1 text-[0.68rem] font-black uppercase text-[#4c5549]">
                  {request.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-black text-[#17181a]">
                {money(request.estimatedTotal, request.currency)} / {request.guestCount} traveler{request.guestCount === 1 ? "" : "s"}
              </p>
              <select
                value={request.status}
                onChange={(event) => {
                  setPendingId(request._id);
                  void updateBookingStatus({
                    requestId: request._id,
                    status: event.target.value as BookingStatus,
                  }).finally(() => setPendingId(null));
                }}
                className="mt-3 w-full rounded-xl border border-[#e5e8e2] bg-[#fbfcf8] px-3 py-2 text-sm font-bold text-[#17181a] outline-none"
              >
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </article>
          ))}
          {state.bookingRequests.length === 0 ? (
            <div className="rounded-2xl border border-[#e5e8e2] bg-white p-5 text-center text-sm font-bold text-[#66705f]">
              <Send className="mx-auto mb-2 size-5 text-[#9fe870]" />
              No booking requests yet.
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}