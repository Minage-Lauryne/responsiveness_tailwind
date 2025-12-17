"use client";

import { api } from "@/trpc/react";
import { SubjectWithChat } from "../../app/subject/[id]/request/types";
import { RequestForm } from "./request-form";

export function Request({ subject }: { subject?: SubjectWithChat }) {
  const { data: me } = api.me.get.useQuery();

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-medium leading-tight text-gray-900">
            Expanded Research Request
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
            Submit your research question with supporting information to receive
            comprehensive analysis and expert insights integrated directly into
            your platform.
          </p>
        </div>
      </div>
      {/* Service Features */}
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">
              Expanded Analysis
            </h3>
            <p className="leading-relaxed text-gray-600">
              Comprehensive research utilizing advanced AI with multi-source
              analysis, bias detection, and counterpoint exploration.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Expert Review</h3>
            <p className="leading-relaxed text-gray-600">
              Subject matter experts with relevant field experience review,
              critique, and offer additional insights on all research outputs.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">
              Platform Integration
            </h3>
            <p className="leading-relaxed text-gray-600">
              Results integrated into your platform for ongoing comparison,
              follow-up questions, and project management.
            </p>
          </div>
        </div>

        <div className="leading-relaxed text-gray-600">
          Useful for landscape analyses, major funding decisions, strategy
          development, and comprehensive analysis of complex information.
        </div>
      </div>

      {/* Request Form */}
      {me && <RequestForm me={me} subject={subject} />}

      {/* Service Overview */}
      <div className="rounded-lg border bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-xl font-medium text-gray-900">
            Service Overview
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-base font-medium text-gray-700">
                Traditional Research
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Cost Range</span>
                  <span>$15,000 - $100,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeline</span>
                  <span>4-12 weeks</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-base font-medium text-gray-900">
                Our Research Service
              </h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Cost Range</span>
                  <span>$1,200 - $2,500</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeline</span>
                  <span>3 days to 2 weeks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="rounded-lg border bg-white p-8 shadow-sm">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-medium text-gray-900">
            What Happens Next?
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <span className="text-lg font-semibold text-slate-600">1</span>
              </div>
              <h3 className="mb-2 font-medium text-gray-900">Request Review</h3>
              <p className="text-sm text-gray-600">
                Our team reviews your request and contacts you to confirm scope
                and timeline.
              </p>
              <p className="mt-1 text-xs text-gray-500">(24 hours)</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <span className="text-lg font-semibold text-slate-600">2</span>
              </div>
              <h3 className="mb-2 font-medium text-gray-900">
                Expanded Research Processing
              </h3>
              <p className="text-sm text-gray-600">
                AI-powered comprehensive analysis with bias detection and
                counterpoint exploration.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <span className="text-lg font-semibold text-slate-600">3</span>
              </div>
              <h3 className="mb-2 font-medium text-gray-900">Expert Review</h3>
              <p className="text-sm text-gray-600">
                Subject matter experts validate findings and provide additional
                insights.
              </p>
              <p className="mt-1 text-xs text-gray-500">(if selected)</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <span className="text-lg font-semibold text-slate-600">4</span>
              </div>
              <h3 className="mb-2 font-medium text-gray-900">Delivery</h3>
              <p className="text-sm text-gray-600">
                Final report delivered and integrated into your platform for
                ongoing use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
