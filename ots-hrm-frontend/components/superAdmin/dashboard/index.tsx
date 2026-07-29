"use client";
import React from "react";
import CompanyTimelineChart from "./CompanyTimelineChart";
import RecentActivities from "./RecentActivities";
import CompanyStatusChart from "./CompanyStatusChart";
import Overviews from "../components/Overviews";
// import { StatusDonut } from "./StatusDonut";
// import { RecentActivities } from "./RecentActivities";
// import { QuickActions } from "./QuickActions";

const SuperAdminDashboard: React.FC = () => {
  return (
    <>
      <Overviews />
      <div className="grid gap-6 md:grid-cols-6">
        <CompanyTimelineChart />
        <CompanyStatusChart />
      </div>
      <RecentActivities />
    </>
  );
};

export default SuperAdminDashboard;
