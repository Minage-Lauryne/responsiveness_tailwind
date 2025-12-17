"use client";

import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { Request } from "@/app/features/research-request/request";

export default function RequestPage() {
  const { id } = useParams<{ id: string }>();
  const { data: subject } = api.subject.get.useQuery(id);

  if (!subject) {
    return null;
  }

  return <Request subject={subject} />;
}
