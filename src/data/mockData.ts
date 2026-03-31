export interface MeterRecord {
  id: string;
  model: string;
  brand: string;
  date: string;
  feeder: string;
  serialNumber: string;
  registerCode: string;
  mode: string;
  yesterdayPower: number;
  todayPower: number;
  powerMade: number;
  photoBase64?: string;
}

export const initialRecords: MeterRecord[] = [
  { id: '1', model: 'Model A', brand: 'Brand X', date: '2025-11-29', feeder: 'Feeder 1', serialNumber: '253626605', registerCode: '1.8.0', mode: 'Discharge', yesterdayPower: 555555, todayPower: 888888, powerMade: 333333 },
  { id: '2', model: 'Model A', brand: 'Brand X', date: '2025-11-29', feeder: 'Feeder 1', serialNumber: '253626605', registerCode: '2.8.0', mode: 'Charge', yesterdayPower: 455555, todayPower: 777777, powerMade: 322222 },
];

export interface ChartDataPoint {
  date: string;
  kampongChhnang: number;
  pursat: number;
}

// Generate some mock chart data for Jan/Feb 2026 to match the screenshot
export const generateChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  for (let i = 1; i <= 31; i++) {
    data.push({
      date: `Jan ${i}`,
      kampongChhnang: 600 + Math.random() * 80 - 20,
      pursat: 400 + Math.random() * 60 - 15,
    });
  }
  for (let i = 1; i <= 28; i++) {
    data.push({
      date: `Feb ${i}`,
      kampongChhnang: 600 + Math.random() * 80 - 20,
      pursat: 400 + Math.random() * 60 - 15,
    });
  }
  return data;
};

export const chartData = generateChartData();

export const pieChartData = [
  { name: 'Feeder F1', value: 400 },
  { name: 'Feeder F2', value: 300 },
  { name: 'Feeder F5', value: 300 },
  { name: 'Feeder F6', value: 200 },
];

export const scatterData = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];
