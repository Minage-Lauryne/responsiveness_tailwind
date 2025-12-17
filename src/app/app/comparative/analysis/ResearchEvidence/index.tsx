import React from "react";
import type { Proposal } from "../types";

export function ResearchEvidence({ proposals }: { proposals: Proposal[] }) {
  return (
    <>
      <h3 className="text-lg md:text-xl font-semibold mb-4">Initial Analysis</h3>
      {proposals.length > 0 ? (
        proposals.map((proposal) => {
          const evidenceAlignment = proposal.evidence_alignment;
          const hasEvidenceAlignment = evidenceAlignment !== undefined;

          return (
            <div
              key={proposal.filename}
              className="rounded-lg border border-gray-200 p-4 md:p-6 bg-white shadow-sm mb-4"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                    <h4 className="text-base md:text-lg font-semibold break-words">
                      {proposal.organization_name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
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
                  <div className="text-xs md:text-sm text-gray-500 break-all">
                    {proposal.filename}
                  </div>
                </div>
                {hasEvidenceAlignment && (
                  <div className="text-xs md:text-sm text-gray-500 mt-2 md:mt-0">
                    Evidence Alignment Score: {evidenceAlignment.evidence_alignment_score}%
                  </div>
                )}
              </div>

              {hasEvidenceAlignment && (
                <div className="mt-6 space-y-6">
                  {evidenceAlignment.summary && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <h5 className="font-semibold text-sm md:text-base mb-2 text-gray-900">
                        Evidence Alignment Summary
                      </h5>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                        {evidenceAlignment.summary}
                      </p>
                    </div>
                  )}

                  {evidenceAlignment.what_alignment && (
                    <div className="pl-3 md:pl-4 border-l-4 border-blue-500">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h5 className="font-semibold text-sm md:text-base">Program Model Alignment</h5>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium w-fit">
                          {evidenceAlignment.what_alignment.score}%
                        </span>
                      </div>
                      {evidenceAlignment.what_alignment.summary && (
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap break-words">
                          {evidenceAlignment.what_alignment.summary}
                        </p>
                      )}
                      {evidenceAlignment.what_alignment.evidence_sources &&
                        evidenceAlignment.what_alignment.evidence_sources.length > 0 && (
                          <div className="space-y-3">
                            {evidenceAlignment.what_alignment.evidence_sources.map((source, i) => (
                              <div
                                key={i}
                                className="text-sm bg-gray-50 rounded p-3 break-words whitespace-pre-wrap"
                              >
                                <div className="font-medium text-gray-800 mb-2">
                                  {source.filename !== "N/A" ? source.filename : "Research Study"}
                                </div>
                                {source.quote && (
                                  <div className="text-gray-700 italic mb-2 pl-3 border-l-2 border-gray-300">
                                    "{source.quote}"
                                  </div>
                                )}
                                {source.relevance && (
                                  <div className="text-gray-600 text-xs">{source.relevance}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {evidenceAlignment.how_alignment && (
                    <div className="pl-3 md:pl-4 border-l-4 border-green-500">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h5 className="font-semibold text-sm md:text-base">Implementation Approach Alignment</h5>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium w-fit">
                          {evidenceAlignment.how_alignment.score}%
                        </span>
                      </div>
                      {evidenceAlignment.how_alignment.summary && (
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap break-words">
                          {evidenceAlignment.how_alignment.summary}
                        </p>
                      )}
                      {evidenceAlignment.how_alignment.evidence_sources &&
                        evidenceAlignment.how_alignment.evidence_sources.length > 0 && (
                          <div className="space-y-3">
                            {evidenceAlignment.how_alignment.evidence_sources.map((source, i) => (
                              <div
                                key={i}
                                className="text-sm bg-gray-50 rounded p-3 break-words whitespace-pre-wrap"
                              >
                                <div className="font-medium text-gray-800 mb-2">
                                  {source.filename !== "N/A" ? source.filename : "Research Study"}
                                </div>
                                {source.quote && (
                                  <div className="text-gray-700 italic mb-2 pl-3 border-l-2 border-gray-300">
                                    "{source.quote}"
                                  </div>
                                )}
                                {source.relevance && (
                                  <div className="text-gray-600 text-xs">{source.relevance}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {evidenceAlignment.who_alignment && (
                    <div className="pl-3 md:pl-4 border-l-4 border-purple-500">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h5 className="font-semibold text-sm md:text-base">Target Population Alignment</h5>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-medium w-fit">
                          {evidenceAlignment.who_alignment.score}%
                        </span>
                      </div>
                      {evidenceAlignment.who_alignment.summary && (
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap break-words">
                          {evidenceAlignment.who_alignment.summary}
                        </p>
                      )}
                      {evidenceAlignment.who_alignment.evidence_sources &&
                        evidenceAlignment.who_alignment.evidence_sources.length > 0 && (
                          <div className="space-y-3">
                            {evidenceAlignment.who_alignment.evidence_sources.map((source, i) => (
                              <div
                                key={i}
                                className="text-sm bg-gray-50 rounded p-3 break-words whitespace-pre-wrap"
                              >
                                <div className="font-medium text-gray-800 mb-2">
                                  {source.filename !== "N/A" ? source.filename : "Research Study"}
                                </div>
                                {source.quote && (
                                  <div className="text-gray-700 italic mb-2 pl-3 border-l-2 border-gray-300">
                                    "{source.quote}"
                                  </div>
                                )}
                                {source.relevance && (
                                  <div className="text-gray-600 text-xs">{source.relevance}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-gray-500">No proposals analyzed yet.</div>
      )}
    </>
  );
}