import Link from "next/link";
import { Fragment } from "react";
import * as Breadcrumb from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export default function PageContainer({
  children,
  breadcrumbs,
  className,
  maxWidth = "7xl",
}: {
  children: React.ReactNode;
  breadcrumbs?: { name: string; href?: string }[];
  className?: string;
  maxWidth?: "full" | "7xl" | "6xl" | "5xl";
}) {
  const maxWidthClass = 
    maxWidth === "full" ? "max-w-full" :
    maxWidth === "7xl" ? "max-w-7xl" :
    maxWidth === "6xl" ? "max-w-6xl" :
    "max-w-5xl";
  
  return (
    <div className={`h-full ${maxWidthClass} flex-col px-4 pt-4`}>
      {breadcrumbs && breadcrumbs?.length > 1 && (
        <Breadcrumb.Breadcrumb
          className="text-xl"
          separator={<Breadcrumb.BreadcrumbSeparator />}
        >
          <Breadcrumb.BreadcrumbList>
            {breadcrumbs?.map((link, index) => (
              <Fragment key={index}>
                <Breadcrumb.BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <Breadcrumb.BreadcrumbPage>
                      {link.name}
                    </Breadcrumb.BreadcrumbPage>
                  ) : (
                    <Breadcrumb.BreadcrumbLink asChild>
                      <Link href={link.href!}>
                        <Button
                          className="p-1"
                          variant={"link"}
                          effect="hoverUnderline"
                        >
                          {link.name}
                        </Button>
                      </Link>
                    </Breadcrumb.BreadcrumbLink>
                  )}
                </Breadcrumb.BreadcrumbItem>
                {index !== breadcrumbs.length - 1 && (
                  <Breadcrumb.BreadcrumbSeparator />
                )}
              </Fragment>
            ))}
          </Breadcrumb.BreadcrumbList>
        </Breadcrumb.Breadcrumb>
      )}

      <div className={className}>{children}</div>
    </div>
  );
}