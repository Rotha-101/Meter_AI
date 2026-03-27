export interface MeterRecord {
  id: string;
  date: string;
  feeder: string;
  serialNumber: string;
  registerCode: string;
  reading: number;
}

export const initialRecords: MeterRecord[] = [
  // Feeder F1
  { id: '1', date: '2025-11-29', feeder: 'Feeder F1', serialNumber: '253626605', registerCode: '1.8.0', reading: 231452 },
  { id: '2', date: '2025-11-30', feeder: 'Feeder F1', serialNumber: '253626605', registerCode: '1.8.0', reading: 270532 },
  { id: '3', date: '2025-11-29', feeder: 'Feeder F1', serialNumber: '253626605', registerCode: '2.8.0', reading: 244436 },
  { id: '4', date: '2025-11-30', feeder: 'Feeder F1', serialNumber: '253626605', registerCode: '2.8.0', reading: 288593 },
  // Feeder F2
  { id: '5', date: '2025-11-29', feeder: 'Feeder F2', serialNumber: '253626612', registerCode: '1.8.0', reading: 357127 },
  { id: '6', date: '2025-11-30', feeder: 'Feeder F2', serialNumber: '253626612', registerCode: '1.8.0', reading: 418596 },
  { id: '7', date: '2025-11-29', feeder: 'Feeder F2', serialNumber: '253626612', registerCode: '2.8.0', reading: 406688 },
  { id: '8', date: '2025-11-30', feeder: 'Feeder F2', serialNumber: '253626612', registerCode: '2.8.0', reading: 476551 },
  // Feeder F5
  { id: '9', date: '2025-11-29', feeder: 'Feeder F5', serialNumber: '253626597', registerCode: '1.8.0', reading: 270046 },
  { id: '10', date: '2025-11-30', feeder: 'Feeder F5', serialNumber: '253626597', registerCode: '1.8.0', reading: 315664 },
  { id: '11', date: '2025-11-29', feeder: 'Feeder F5', serialNumber: '253626597', registerCode: '2.8.0', reading: 304548 },
  { id: '12', date: '2025-11-30', feeder: 'Feeder F5', serialNumber: '253626597', registerCode: '2.8.0', reading: 356997 },
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
