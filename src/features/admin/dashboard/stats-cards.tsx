"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import {
  Building2,
  CreditCard,
  Files,
  MessageCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

export function StatsCards() {
  const { data: stats, isLoading } = api.admin.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load stats</div>;
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.userCount.toLocaleString(),
      description: "Registered users in the system",
      icon: Users,
      href: "/app/admin/users",
      isExternal: false,
    },
    {
      title: "Organizations",
      value: stats.organizationCount.toLocaleString(),
      description: "Active organizations",
      icon: Building2,
      href: "/app/admin/organizations",
      isExternal: false,
    },
    {
      title: "Documents",
      value: stats.documentCount.toLocaleString(),
      description: "Research documents in the system",
      icon: Files,
      href: "/app/admin/documents",
      isExternal: false,
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptionCount.toLocaleString(),
      description: "Currently active subscriptions",
      icon: CreditCard,
      href: "https://dashboard.stripe.com/subscriptions",
      isExternal: true,
    },
    {
      title: "Total Chats",
      value: stats.chatCount.toLocaleString(),
      description: "Total number of chat conversations",
      icon: MessageCircle,
      href: null, // No dedicated chats page
      isExternal: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {statCards.map((stat) => {
        const CardComponent = (
          <Card
            key={stat.title}
            className={`h-32 ${
              stat.href
                ? "cursor-pointer transition-colors hover:bg-muted/50"
                : ""
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );

        if (stat.href) {
          // Handle external links
          if (stat.isExternal) {
            return (
              <a
                key={stat.title}
                href={stat.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CardComponent}
              </a>
            );
          }

          // Handle internal links
          return (
            <Link key={stat.title} href={stat.href}>
              {CardComponent}
            </Link>
          );
        }

        return CardComponent;
      })}
    </div>
  );
}
