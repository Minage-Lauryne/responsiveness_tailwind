"use client";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { UpcomingWorkshops } from "@/features/brand/upcoming-workshops";

export function BetaBanner() {
  const pathname = usePathname();
  const isComparativeAnalysisPage = pathname?.includes("/app/comparative");

  const bannerStyle = isComparativeAnalysisPage
  ? { background: "linear-gradient(to right, #92baa9, #639c83, #92baa9)" }
    : {};

  return (
    <div
      className="fixed z-50 w-full border-b border-border bg-white"
      style={bannerStyle}
    >
      <div className="flex items-center justify-center py-3">
        <div className="text-center text-[18px] font-normal leading-[102%] text-granite">
          {isComparativeAnalysisPage ? (
            <span className="text-white font-medium">
              Welcome to Comparative Analysis Beta - explore and support continued development by sharing valuable insights!
            </span>
          ) : (
            <span>
              Welcome to Complēre!{" "}
              <Drawer>
                <DrawerTrigger asChild>
                  <button className="font-semibold underline transition-colors hover:opacity-80">
                    Sign up for a live demo
                  </button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh] overflow-auto">
                  <DrawerHeader>
                    <DrawerTitle>Upcoming Onboarding Sessions</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-4">
                    <UpcomingWorkshops />
                  </div>
                </DrawerContent>
              </Drawer>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
