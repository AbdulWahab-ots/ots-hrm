"use client";

import React, { useState } from "react";

import Overviews from "../components/Overviews";
import CompaniesTable from "./CompaniesTable";

export default function CompaniesPage() {
  return (
    <>
      <Overviews />
      <CompaniesTable />
    </>
  );
}
