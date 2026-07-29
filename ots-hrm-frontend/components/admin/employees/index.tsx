import React from "react";
import EmployeesTable from "./EmployeesTable";
import Overviews from "./Overviews";

const EmployeesView = () => {
  return (
    <>
      <Overviews />
      <EmployeesTable />{" "}
    </>
  );
};

export default EmployeesView;
