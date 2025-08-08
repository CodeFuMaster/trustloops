import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerWithRangeProps {
  from?: Date;
  to?: Date;
  onSelect?: (range: { from?: Date; to?: Date } | undefined) => void;
}

export function DatePickerWithRange({ from, to, onSelect }: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date?: Date) => {
    return date ? date.toLocaleDateString() : '';
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    onSelect?.({ from: newDate, to });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    onSelect?.({ from, to: newDate });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Calendar className="h-4 w-4" />
        <span>
          {from && to 
            ? `${formatDate(from)} - ${formatDate(to)}`
            : 'Select date range'
          }
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[300px]">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="date"
                value={from ? from.toISOString().split('T')[0] : ''}
                onChange={handleFromChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="date"
                value={to ? to.toISOString().split('T')[0] : ''}
                onChange={handleToChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
