"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { trackCommerceEvent } from "@/utils/commerceAnalytics";

export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        trackCommerceEvent("page_view", {
            title: document.title,
            referrer: document.referrer ? new URL(document.referrer).hostname : "",
        });
    }, [pathname]);

    useReportWebVitals((metric) => {
        trackCommerceEvent("web_vital", {
            metricName: metric.name,
            value: metric.value,
            rating: metric.rating,
            metricId: metric.id,
            navigationType: metric.navigationType,
        });
    });

    return null;
}
