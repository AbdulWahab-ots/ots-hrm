"use client"

import { useState } from "react";
import EmployeeCards from "./EmployeeCards";

const EmployeePage = () => {
    const [sortOption, setSortOption] = useState<string>("");
    return (
       <EmployeeCards/>
    )
};

export default EmployeePage;