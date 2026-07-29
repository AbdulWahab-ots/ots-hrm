import React from 'react';

const WorkingHoursTimeline: React.FC = () => {
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', 
    '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', 
    '08:00', '09:00', '10:00', '11:00'
  ];

  return (
    <div className="bg-g-background-100 p-4 lg:p-6 rounded-[var(--g-radius-md)] shadow-geist-card">
      <div className="flex flex-wrap gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-600 text-sm">Total Working hours</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">12h 36m</div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 text-sm">Productive Hours</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">08h 36m</div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-600 text-sm">Break hours</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">22m 15s</div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 text-sm">Overtime</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">02h 15m</div>
        </div>
      </div>

      <div className="relative">
        <div className="flex h-5 mb-2 gap-1">
          <div className="bg-green-500 rounded" style={{ width: '16.67%' }}></div>
          <div className="bg-yellow-400 rounded" style={{ width: '5.56%' }}></div>
          <div className="bg-green-500 rounded" style={{ width: '33.33%' }}></div>
          <div className="bg-yellow-400 rounded" style={{ width: '11.11%' }}></div>
          <div className="bg-green-500 rounded" style={{ width: '22.22%' }}></div>
          <div className="bg-yellow-400 rounded" style={{ width: '5.56%' }}></div>
          <div className="bg-blue-500 rounded" style={{ width: '2.78%' }}></div>
          <div className="bg-blue-500 rounded ml-1" style={{ width: '2.78%' }}></div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          {timeSlots.map((time, index) => (
            <div key={index} className="text-center" style={{ width: '5.56%' }}>
              {time}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursTimeline;