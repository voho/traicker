import React from 'react';

interface MonthSelectorProps {
  month: number; // 1-12
  year: number;
  onMonthChanged: (month: number, year: number) => void;
}

const months = [...Array(12).keys()].map(i => new Date(2000, i, 1).toLocaleString(undefined, { month: 'short' }));

export function MonthSelector({ month, year, onMonthChanged }: MonthSelectorProps) {
  const handleMonthClick = (newMonth: number) => {
    onMonthChanged(newMonth, year);
  };

  const handleYearChange = (yearOffset: number) => {
    onMonthChanged(month, year + yearOffset);
  };

  const handleMonthChange = (monthOffset: number) => {
    let newMonth = month + monthOffset;
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    onMonthChanged(newMonth, newYear);
  };

  return (
    <div className="p-2 mb-4 bg-gray-800 rounded-lg shadow-md flex items-center">
      {/* Year Selector */}
      <div className="flex items-center mr-4">
        <button
          onClick={() => handleYearChange(-1)}
          className="px-3 py-1 text-gray-300 rounded-l-md hover:bg-gray-700"
        >
          &lt;
        </button>
        <span className="px-3 py-1 text-lg font-semibold text-white bg-gray-900">
          {year}
        </span>
        <button
          onClick={() => handleYearChange(1)}
          className="px-3 py-1 text-gray-300 rounded-r-md hover:bg-gray-700"
        >
          &gt;
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center space-x-1">
        <button
            onClick={() => handleMonthChange(-1)}
            className="px-3 py-1 text-gray-300 rounded-md hover:bg-gray-700"
        >
            &lt;
        </button>
        <div className="flex space-x-1">
            {months.map((monthName, index) => {
              const monthNumber = index + 1;
              const isSelected = month === monthNumber;
              return (
                <button
                  key={monthName}
                  onClick={() => handleMonthClick(monthNumber)}
                  className={`p-2 text-xs rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {monthName}
                </button>
              );
            })}
        </div>
        <button
            onClick={() => handleMonthChange(1)}
            className="px-3 py-1 text-gray-300 rounded-md hover:bg-gray-700"
        >
            &gt;
        </button>
      </div>
    </div>
  );
}