"use client";

import { api } from "@/trpc/react";
import { ChevronDown, ChevronUp, FileText, MessageSquareText, Paperclip, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import AddFilesButton from "@/components/ui/add-files-button";
import { SubjectWithChat } from "../types";

export function HeaderDetails({ evaluation }: { evaluation: SubjectWithChat }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { data } = api.subject.createTitle.useQuery(evaluation?.id || "", {
    enabled: !!evaluation?.id,
  });

  const title = useMemo(() => {
    if (data) return data;
    if (evaluation?.title) return evaluation.title;
    const dateString = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `Analysis ${dateString}`;
  }, [data, evaluation?.title]);

  if (!evaluation) {
    return null;
  }

  return (
    <div className="space-y-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/icons/title.svg"
            alt="Analysis"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-1 hover:bg-white/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded ? (
        <>
          <div className="space-y-3">
            <div className="text-base font-medium text-gray-900">Files:</div>

            <div className="space-y-2">
              {evaluation.documents.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg p-3">
                  <FileText className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      No files attached
                    </div>
                  </div>
                </div>
              ) : (
                evaluation.documents.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-lg bg-transparent p-3"
                  >
                    <FileText className="h-5 w-5 flex-shrink-0 text-gray-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">
                        {file.name}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {evaluation.context && (
            <div className="space-y-2">
              <div className="text-base font-medium text-gray-900">
                Prompts:
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-transparent p-3">
                <MessageSquareText className="h-5 w-5 flex-shrink-0 text-gray-500 mt-0.5" />
                <p className="flex-1 text-sm leading-relaxed text-gray-700">
                  &quot;{evaluation.context}&quot;
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <AddFilesButton />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-sm font-medium text-gray-700 hover:bg-white/50"
              >
                <Image
                  src="/icons/add-files.svg"
                  alt="Add files"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                Add files
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-gradient-to-br from-blue-50 to-cyan-50 border-gray-200"
              side="top"
              align="start"
            >
              <DropdownMenuItem className="cursor-pointer hover:bg-white/50">
                <Paperclip className="mr-2 h-4 w-4" />
                Upload New Files
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/50">
                <Search className="mr-2 h-4 w-4" />
                Search Workspace Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <FileText className="h-4 w-4 text-gray-500" />
            <span>{evaluation.documents.length} {evaluation.documents.length === 1 ? 'File' : 'Files'}</span>
          </div>

          {evaluation.context && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MessageSquareText className="h-4 w-4 text-gray-500" />
              <span>1 Prompt</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
