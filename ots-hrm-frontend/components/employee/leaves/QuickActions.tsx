import Button from "@/components/common/Button";
import { Plus } from "lucide-react";
import { IoSettingsOutline } from "react-icons/io5";
import { PiReceiptBold } from "react-icons/pi";

const QuickActions: React.FC<{
  onApplyLeave: () => void;
  onViewCalendar: () => void;
  ondashboard?: boolean;
}> = ({ onApplyLeave, onViewCalendar, ondashboard }) => {
  return (
    <div className="bg-g-background-100 p-4 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card">
      <h2 className="text-heading-20 text-g-gray-900">
        Quick Actions
      </h2>
      <div className="flex flex-col items-center gap-3 py-4">
        <Button
          label="Apply for Leaves"
          variant="outline"
          icon={Plus}
          onClick={onApplyLeave}
        />
        {ondashboard === true && (
          <Button
            label="View Pay slip"
            variant="outline"
            icon={PiReceiptBold}
          />
        )}
        {ondashboard === false && (
          <Button
            label="View Calendar"
            variant="outline"
            icon={IoSettingsOutline}
            onClick={onViewCalendar}
          />
        )}
      </div>
    </div>
  );
};
export default QuickActions;