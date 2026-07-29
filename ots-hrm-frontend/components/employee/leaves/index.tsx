import React from "react";
import LeavesOverviews from "./LeavesOverviews";
import RecentRequests from "./RecentRequests";

import VocationTable from "./VocationTbale";

const index = () => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <LeavesOverviews />
        <RecentRequests />
      </div>
      <VocationTable />
    </>
  );
};

export default index;
