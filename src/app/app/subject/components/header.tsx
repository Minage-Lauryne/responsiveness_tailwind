import { LogoSecondary } from "@/components/logo-secondary";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";
import { SubjectWithChat } from "../types";

export function EvalHeader({ evaluation }: { evaluation?: SubjectWithChat }) {
  return (
    <SidebarInset>
      <header className="flex shrink-0 items-start gap-1 overflow-hidden border-b px-0 pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/app" className="flex items-center gap-2">
                    <LogoSecondary /> Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/app/subject">Analysis</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {evaluation && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate">
                      {evaluation?.title ?? "New Analysis"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
    </SidebarInset>
  );
}
