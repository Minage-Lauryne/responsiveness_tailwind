import React from "react";
import { formatTimeline } from "@/lib/analyze";
import { FaRegCircleCheck } from "react-icons/fa6";
import { RxCrossCircled } from "react-icons/rx";
import type { Proposal } from "../analysis/types";

function MatrixRow({ proposal, collapsed }: { proposal: Proposal; collapsed: boolean }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Recommended":
        return {
          bgColor: "bg-ocean",
          textColor: "text-white",
          label: "Recommended"
        };
      case "Consider":
        return {
          bgColor: "bg-tangerine",
          textColor: "text-gray-800",
          label: "Consider"
        };
      case "Not Recommended":
        return {
          bgColor: "bg-sunset",
          textColor: "text-white",
          label: "Not Recommended"
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(proposal.recommendation);

  const getCheckboxState = (aligned: boolean | undefined) => {
    if (aligned === undefined) return "none";
    return aligned ? "full" : "none";
  };

  const whatState = getCheckboxState(proposal.alignment.what_aligned);
  const howState = getCheckboxState(proposal.alignment.how_aligned);
  const whoState = getCheckboxState(proposal.alignment.who_aligned);

  const Checkbox = ({ state }: { state: string }) => {
    if (state === "full") {
      return (
        <div className="flex items-center justify-center">
          <FaRegCircleCheck className="w-5 h-5 md:w-4 md:h-4 text-ocean cursor-pointer hover:txt-blue-600 transition-colors" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center">
          <RxCrossCircled className="w-5 h-5 md:w-4 md:h-4 text-sunset cursor-pointer hover:txt-orange-600 transition-colors" />
        </div>
      );
    }
  };

  const formatBudget = (budget: string) => {
    if (budget === "Not described" || !budget) return "-";
    if (budget.length > 15) return `${budget.substring(0, 15)}...`;
    return budget;
  };

  const formatOrganizationName = (name: string) => {
    if (name.length > 20) return `${name.substring(0, 20)}...`;
    return name;
  };

  const displayTimelineObj = (proposal.timeline === "Not specified" || !proposal.timeline)
    ? { short: "-", full: "" }
    : formatTimeline(proposal.timeline);

  return (
    <div
      className="grid grid-cols-12 gap-2 md:gap-3 items-center py-3 px-2 rounded-lg transition-colors text-xs
        hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
    >
      <div className="col-span-4 md:col-span-3 font-medium text-gray-900 truncate"
        title={proposal.organization_name}>
        {formatOrganizationName(proposal.organization_name)}
      </div>

      <div className="col-span-1 flex justify-center">
        <Checkbox state={whatState} />
      </div>
      <div className="col-span-1 flex justify-center">
        <Checkbox state={howState} />
      </div>
      <div className="col-span-1 flex justify-center">
        <Checkbox state={whoState} />
      </div>

      <div className="col-span-2 text-center text-gray-600 truncate px-1"
        title={proposal.budget && proposal.budget !== "Not described" ? proposal.budget : ""}>
        {formatBudget(proposal.budget)}
      </div>

      <div className="col-span-2 text-center text-gray-600 truncate px-1">
        <span title={displayTimelineObj.full}>
          {displayTimelineObj.short}
        </span>
      </div>

      <div className="col-span-2 text-center">
        <span
          className={`
    inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold justify-center
    ${statusConfig.bgColor} ${statusConfig.textColor} border border-gray-200
    ${!collapsed ? 'truncate max-w-[60px] md:max-w-[70px] lg:max-w-[100px]' : 'whitespace-nowrap'}
  `}
          title={!collapsed ? statusConfig.label : undefined}
        >
          {!collapsed
            ? (statusConfig.label === "Not Recommended" ? "Not Rec..." :
              statusConfig.label === "Recommended" ? "Rec..." :
                statusConfig.label)
            : statusConfig.label
          }
        </span>
      </div>
    </div>
  );
}

export function Matrix({ proposals, collapsed }: { proposals: Proposal[]; collapsed: boolean }) {
  return (
    <div className="mb-6">
      <div className="rounded-lg border border-gray-200 p-4 md:p-6 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Proposal Evaluation Matrix</h2>
        </div>

        <div className="hidden md:grid grid-cols-12 gap-3 mb-4 pb-3 border-b border-gray-200 text-xs font-semibold text-gray-700">
          <div className="col-span-3">Organisation</div>
          <div className="col-span-1 text-center">
            <div>WHY</div>
            <div className="text-xs font-normal text-gray-500 mt-1 leading-tight truncate">Purpose</div>
          </div>
          <div className="col-span-1 text-center">
            <div>HOW</div>
            <div className="text-xs font-normal text-gray-500 mt-1 leading-tight truncate">Plan</div>
          </div>
          <div className="col-span-1 text-center">
            <div>WHAT</div>
            <div className="text-xs font-normal text-gray-500 mt-1 leading-tight truncate">Qualification</div>
          </div>
          <div className="col-span-2 text-center">Budget</div>
          <div className="col-span-2 text-center">Timeline</div>
          <div className="col-span-2 text-center">Status</div>
        </div>

        <div className="md:hidden grid grid-cols-12 gap-2 mb-3 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-700">
          <div className="col-span-4">Organisation</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">H</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-2 text-center">Budget</div>
          <div className="col-span-2 text-center">Time</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        <div className="space-y-2">
          {proposals.map((proposal) => (
            <MatrixRow key={proposal.filename} proposal={proposal} collapsed={collapsed} />))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-3">Evaluation Criteria</h3>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-6 text-xs md:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaRegCircleCheck className="w-5 h-5 md:w-4 md:h-4 text-ocean" />
              <span>Meets all requirements</span>
            </div>
            <div className="flex items-center gap-2">
              <RxCrossCircled className="w-5 h-5 md:w-4 md:h-4 text-sunset flex-shrink-0" />
              <span>Does not meet requirements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}