import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ViewDropdown from './ViewDropdown';
import { axiosPrivate } from '../../services/Axios';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { PathString } from 'react-hook-form';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TemperatureGraphProps {
  cattleId: number;
}

type ViewType = 'day' | 'week' | 'month';

interface SensorData {
  time: PathString;
  hour?: string; // For day
  date?: string; // For week/month
  avgTemperature: number | null;
  temperature: number | null;
}

const TemperatureGraph = ({ cattleId }: TemperatureGraphProps) => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>('day');

  // Fetch Data
  const fetchCattleData = async (date: string, view: ViewType) => {
    try {
      setLoading(true);
      setError(null);
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const response = await axiosPrivate.get(
        `/api/sensor/withCattle/${view}/${formattedDate}/${cattleId}`
      );
      setSensorData(response.data);
    } catch (err) {
      console.error('Error fetching temperature data:', err);
      setError('Failed to load temperature data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchCattleData(selectedDate.toISOString(), viewType);
    }
  }, [selectedDate, cattleId, viewType]);

  // Prepare chart labels & values
  let chartLabels: string[] = [];
  let chartValues: (number | null)[] = [];

  if (viewType === 'day') {
    chartLabels = sensorData.map((item) => dayjs(item.time).format('h:mm A'));
    chartValues = sensorData.map((item) => item.temperature);
  } else if (viewType === 'week') {
    chartLabels = Array.from({ length: 7 }, (_, i) =>
      dayjs(selectedDate).startOf('week').add(i, 'day').format('DD MMM')
    );
    chartValues = Array(7).fill(null);

    sensorData.forEach((item) => {
      if (item.date) {
        const index = chartLabels.findIndex(
          (label) => label === dayjs(item.date).format('DD MMM')
        );
        if (index !== -1) chartValues[index] = item.avgTemperature;
      }
    });
  } else if (viewType === 'month') {
    const daysInMonth = dayjs(selectedDate).daysInMonth();
    chartLabels = Array.from({ length: daysInMonth }, (_, i) =>
      dayjs(selectedDate).startOf('month').add(i, 'day').format('DD MMM')
    );
    chartValues = Array(daysInMonth).fill(null);

    sensorData.forEach((item) => {
      if (item.date) {
        const index = chartLabels.findIndex(
          (label) => label === dayjs(item.date).format('DD MMM')
        );
        if (index !== -1) chartValues[index] = item.avgTemperature;
      }
    });
  }

  const temperatureData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: chartValues,
        borderColor: '#e67e22',
        backgroundColor: '#e67e22',
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
        spanGaps: true,
      },
      {
        label: 'Max Threshold',
        data: Array(chartLabels.length).fill(40),
        borderColor: '#FFD2A6',
        borderDash: [5, 8],
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Min Threshold',
        data: Array(chartLabels.length).fill(36),
        borderColor: '#FFD2A6',
        borderDash: [5, 8],
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const chartOptionsTemperature = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          callback: (_value: string | number, index: number) => {
            if (viewType === 'day')
              return index % 2 === 0 ? chartLabels[index] : '';
            return chartLabels[index];
          },
        },
      },
      y: {
        min: 30,
        max: 45,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const isDateDisabled = (date: Date) =>
    date > new Date() || date < dayjs().subtract(60, 'days').toDate();

  return (
    <div className="bg-white rounded-sm shadow-xs p-6 border border-gray-100">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-start mb-6 gap-4">
        <ViewDropdown viewType={viewType} setViewType={setViewType} />
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => {
            if (date) {
              if (viewType === 'week')
                setSelectedDate(dayjs(date).startOf('week').toDate());
              else if (viewType === 'month')
                setSelectedDate(dayjs(date).startOf('month').toDate());
              else setSelectedDate(date);
            }
          }}
          dateFormat={
            viewType === 'day'
              ? 'dd MMM yyyy'
              : viewType === 'week'
              ? "'Week of' dd MMM"
              : 'MMMM yyyy'
          }
          showMonthYearPicker={viewType === 'month'}
          showWeekNumbers={viewType === 'week'}
          className="w-28 rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 border border-gray-100 shadow-xs"
          maxDate={new Date()}
          minDate={dayjs().subtract(60, 'days').toDate()}
          filterDate={(date) => !isDateDisabled(date)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-center h-80 text-red-500 text-sm border rounded-sm border-red-100 bg-red-50">
          {error}
        </div>
      )}

      {/* No Data */}
      {!loading && !error && sensorData.length === 0 && (
        <div className="flex h-80 items-center justify-center text-gray-500 text-sm">
          No temperature data available for this date.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-80">
          <div className="animate-pulse text-gray-400 text-sm">
            Loading temperature data...
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && sensorData.length > 0 && !error && (
        <>
          <div className="h-80">
            <Line data={temperatureData} options={chartOptionsTemperature} />
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#e67e22] rounded-full mr-2"></div>
              Measured Temperature
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#FFD2A6] rounded mr-2 border border-gray-400"></div>
              Normal Range (36-40°C)
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TemperatureGraph;
