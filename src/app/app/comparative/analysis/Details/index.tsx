import React from "react";
import { MdCheck } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import type { Proposal } from "../types";

export function Details({ proposals }: { proposals: Proposal[] }) {
  return (
    <div className="mb-6 space-y-6">
      <h3 className="text-lg md:text-xl font-semibold">Detailed Analysis</h3>
      {proposals.length > 0 ? (
        proposals.map((proposal) => {
          const rawReasoning = proposal.alignment.why_text || "No additional reasoning provided.";
          const segments = rawReasoning
            .split(/\. +/)
            .map((segment) => segment.trim())
            .filter(Boolean);

          return (
            <div
              key={proposal.filename}
              className="rounded-lg border border-gray-200 p-4 sm:p-6 bg-white shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <h4 className="text-base sm:text-lg font-semibold truncate">
                      {proposal.organization_name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        proposal.recommendation === "Recommended"
                          ? "bg-ocean text-white"
                          : proposal.recommendation === "Consider"
                          ? "bg-tangerine text-gray-800"
                          : "bg-sunset text-white"
                      }`}
                    >
                      {proposal.recommendation}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1 break-all">
                    {proposal.filename}
                  </div>
                </div>
                <div className="text-right text-xs sm:text-sm text-gray-500 w-full sm:w-auto mt-3 sm:mt-0">
                  <div>Budget: {proposal.budget === "Not described" ? "-" : proposal.budget}</div>
                  <div className="mt-1">
                    Timeline: {proposal.timeline === "Not specified" ? "-" : proposal.timeline}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:justify-between mb-4 gap-3">
                  <h5 className="font-medium text-sm sm:text-base">Organization Verification</h5>
                  <div className="flex flex-wrap items-center gap-2">
                    {proposal.verification.verified ? (
                      <div className="text-xs px-2 py-1 flex items-center gap-1 rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                        <MdCheck className="mt-0.5 flex-shrink-0" /> <span>Verified</span>
                      </div>
                    ) : (
                      <div className="text-xs px-2 py-1 flex items-center gap-1 rounded-full bg-red-100 text-red-800 whitespace-nowrap">
                        <RxCross2 className="mt-0.5 flex-shrink-0" /> <span>Not Verified</span>
                      </div>
                    )}
                    {proposal.verification.risk_level === "LOW" ? (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                        <div className="w-3.5 h-3.5 bg-green-800 rounded-full flex items-center justify-center"></div>
                        <span>Low Risk</span>
                      </div>
                    ) : proposal.verification.risk_level === "MEDIUM" ? (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">
                        <div className="w-3.5 h-3.5 bg-tangerine rounded-full flex items-center justify-center"></div>
                        <span>Medium Risk</span>
                      </div>
                    ) : proposal.verification.risk_level === "HIGH" ? (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-sunset whitespace-nowrap">
                        <div className="w-3.5 h-3.5 bg-sunset rounded-full flex items-center justify-center"></div>
                        <span>High Risk</span>
                      </div>
                    ) : proposal.verification.risk_level === "CRITICAL" ? (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 whitespace-nowrap">
                        <div className="w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center"></div>
                        <span>Critical Risk</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-200 text-slate-800 whitespace-nowrap">
                        <div className="w-3.5 h-3.5 bg-gray-300 rounded-full flex items-center justify-center"></div>
                        <span>Unknown Risk</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <div className="text-xs text-gray-600">Legal Name</div>
                    <div className="text-xs sm:text-sm font-medium break-words">
                      {proposal.verification.legal_name || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">EIN</div>
                    <div className="text-xs sm:text-sm font-medium break-words">
                      {proposal.verification.ein || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Annual Revenue</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {proposal.verification.revenue != null && proposal.verification.revenue !== undefined
                        ? `$${Number(proposal.verification.revenue).toLocaleString()}`
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Total Assets</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {proposal.verification.assets != null && proposal.verification.assets !== undefined
                        ? `$${Number(proposal.verification.assets).toLocaleString()}`
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Tax Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {proposal.verification.tax_status || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Filing Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {proposal.verification.filing_status || "N/A"}
                    </div>
                  </div>
                  {proposal.verification.sanction_checked && (
                    <div className="col-span-1 sm:col-span-2">
                      <div className="text-xs text-gray-600">Sanction Screening</div>
                      {proposal.verification.sanction_clear ? (
                        <div className="text-xs sm:text-sm font-medium text-green-600">
                          Clear - No sanctions found
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm font-medium text-red-600">
                          Sanctions Found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="pl-2 sm:pl-4 border-l-4 border-blue-300">
                  <h5 className="font-medium text-sm mb-2">Alignment</h5>
                  <div className="text-xs sm:text-sm text-gray-700 break-words whitespace-pre-wrap">
                    {segments.length > 0 ? (
                      segments.map((segment, index) => (
                        <p key={index} className="mb-2">
                          {segment.endsWith(".") ? segment : `${segment}.`}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-500">No alignment reasoning provided.</p>
                    )}
                  </div>
                </div>

                <div className="pl-2 sm:pl-4 border-l-4 border-blue-300">
                  <h5 className="font-medium text-sm mb-2">Implementation</h5>
                  {proposal.evidence.how?.length ? (
                    <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                      {proposal.evidence.how.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 break-words whitespace-pre-wrap">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="mt-0.5 flex-shrink-0 text-green-500"
                          >
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500">
                      No explicit implementation detail.
                    </p>
                  )}
                </div>

                <div className="pl-2 sm:pl-4 border-l-4 border-blue-300">
                  <h5 className="font-medium text-sm mb-2">Qualifications</h5>
                  {proposal.evidence.who?.length ? (
                    <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                      {proposal.evidence.who.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 break-words whitespace-pre-wrap">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="mt-0.5 flex-shrink-0 text-green-500"
                          >
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500">
                      Vendor qualifications not described.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-slate-50">
                <h5 className="font-medium text-sm mb-2">Reasoning</h5>
                <div className="text-xs sm:text-sm text-gray-700 break-words whitespace-pre-wrap">
                  {segments.length > 0 ? (
                    segments.map((segment, index) => (
                      <p key={`reason-${index}`} className="mb-2">
                        {segment.endsWith(".") ? segment : `${segment}.`}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500">No reasoning provided.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-gray-500">No proposals analyzed yet.</div>
      )}
    </div>
  );
}