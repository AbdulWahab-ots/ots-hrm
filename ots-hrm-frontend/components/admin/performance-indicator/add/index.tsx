import React from "react";
import { designations, technicalOptions, status } from "@/utils/constants";
import Dropdown from "@/components/common/form/DropDown";
import Button from "@/components/common/Button";

const AddPerformanceIndicator: React.FC = () => {
  return (
    <div className="rounded-[var(--g-radius-md)] p-6 bg-g-background-100 space-y-6 shadow-geist-card">
      <div>
        <h1 className="text-heading-24 text-g-gray-1000">Add New Indicator</h1>
        <div className="border-b border-g-gray-alpha-400 w-full my-3"></div>
      </div>

      <Dropdown
        name="designation"
        id="designation"
        label="Designation"
        options={designations.map((d) => ({ value: d.id, label: d.name }))}
      />

      <div>
        <div>
          <h2 className="text-heading-20 text-g-gray-1000 mb-4">Technical</h2>
          <div className="border-b border-g-gray-alpha-400 w-full my-3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <Dropdown
            name="customerExperience"
            id="customer-experience"
            label="Customer Experience"
            options={technicalOptions}
          />

          <Dropdown
            name="administration"
            id="administration"
            label="Administration"
            options={technicalOptions}
          />
          <Dropdown
            name="presentationSkills"
            id="presentation-skills"
            label="Presentation Skills"
            options={technicalOptions}
          />

          <Dropdown
            name="qualityOfWork"
            id="quality-of-work"
            label="Quality of Work"
            options={technicalOptions}
          />

          <Dropdown
            name="efficiency"
            id="efficiency"
            label="Efficiency"
            options={technicalOptions}
          />
        </div>
      </div>

      <div>
        <h2 className="text-heading-20 text-g-gray-1000 mb-4">
          Organizational
        </h2>
        <div className="border-b border-g-gray-alpha-400 w-full my-3"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <Dropdown
            name="integrity"
            id="integrity"
            label="Integrity"
            options={technicalOptions}
          />

          <Dropdown
            name="professionalism"
            id="professionalism"
            label="Professionalism"
            options={technicalOptions}
          />

          <Dropdown
            name="teamWork"
            id="team-work"
            label="Team Work"
            options={technicalOptions}
          />

          <Dropdown
            name="criticalThinking"
            id="critical-thinking"
            label="Critical Thinking"
            options={technicalOptions}
          />
          <Dropdown
            name="conflictManagement"
            id="conflict-management"
            label="Conflict Management"
            options={technicalOptions}
          />

          <Dropdown
            name="attendance"
            id="attendance"
            label="Attendance"
            options={technicalOptions}
          />

          <Dropdown
            name="abilityToMeetDeadline"
            id="ability-to-meet-deadline"
            label="Ability To Meet Deadline"
            options={technicalOptions}
          />
        </div>
      </div>

      <Dropdown
        name="status"
        id="status"
        label="Status"
        options={status.map((d) => ({ value: d.id, label: d.name }))}
      />

      <div className="flex flex-col justify-center md:flex-row md:justify-end gap-4">
        <button
          type="button"
          className="cursor-pointer px-6 py-2 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] text-button-14 text-g-gray-900 bg-g-background-100 hover:bg-g-gray-100 focus-ring-geist transition-colors"
        >
          Cancel
        </button>
        <Button
          label="Add Indicator"
          className="md:max-w-36"
        ></Button>
      </div>
    </div>
  );
};

export default AddPerformanceIndicator;
