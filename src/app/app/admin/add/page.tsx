"use client";

import { Button } from "@/components/ui/button";
import { ResearchDocumentForm } from "@/features/admin/research-documents/form";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function AddDocument() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/app/admin">
            <Button variant="ghost" size="icon" className="mr-4">
              <FiArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Add New Document</h1>
        </div>
      </div>

      <ResearchDocumentForm />
    </div>
  );
}
