import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule, SelectionChangedEvent, CellFocusedEvent } from 'ag-grid-community';
import { Download, Plus, Trash2, Calculator, ArrowUpRight, ArrowDownRight, Activity, FunctionSquare } from 'lucide-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { MeterRecord } from '../data/mockData';

ModuleRegistry.registerModules([AllCommunityModule]);

interface TableTabProps {
  records: MeterRecord[];
  setRecords: React.Dispatch<React.SetStateAction<MeterRecord[]>>;
}

export function TableTab({ records, setRecords }: TableTabProps) {
  const [gridApi, setGridApi] = useState<any>(null);
  const [selectedStats, setSelectedStats] = useState({ count: 0, sum: 0, avg: 0 });
  
  // Excel-like formula bar state
  const [activeCell, setActiveCell] = useState<{ rowIndex: number, colId: string, id: string } | null>(null);
  const [formulaValue, setFormulaValue] = useState('');
  const [activeCellRef, setActiveCellRef] = useState('A1');

  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  const getExcelColumnName = (colIndex: number) => {
    let dividend = colIndex + 1;
    let columnName = '';
    let modulo;

    while (dividend > 0) {
      modulo = (dividend - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      dividend = Math.floor((dividend - modulo) / 26);
    } 
    return columnName;
  };

  const onCellFocused = useCallback((params: CellFocusedEvent) => {
    if (params.rowIndex !== null && params.column) {
      const rowNode = params.api.getDisplayedRowAtIndex(params.rowIndex);
      if (rowNode) {
        const colId = typeof params.column === 'string' ? params.column : params.column.getColId();
        const value = rowNode.data[colId];
        
        // Calculate Excel-like cell reference (e.g., A1, B2)
        const allColumns = params.api.getColumns();
        const colIndex = allColumns ? allColumns.findIndex(c => c.getColId() === colId) : 0;
        const colName = getExcelColumnName(colIndex);
        const rowNum = params.rowIndex + 1;
        
        setActiveCellRef(`${colName}${rowNum}`);
        setActiveCell({
          rowIndex: params.rowIndex,
          colId: colId,
          id: rowNode.data.id
        });
        setFormulaValue(value !== null && value !== undefined ? String(value) : '');
      }
    } else {
      setActiveCell(null);
      setFormulaValue('');
      setActiveCellRef('');
    }
  }, []);

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFormulaValue(newValue);
    
    if (activeCell && gridApi) {
      const rowNode = gridApi.getDisplayedRowAtIndex(activeCell.rowIndex);
      if (rowNode) {
        // Update the grid visually
        rowNode.setDataValue(activeCell.colId, newValue);
        
        // Update the React state
        setRecords(prev => {
          const updated = [...prev];
          const index = updated.findIndex(r => r.id === activeCell.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], [activeCell.colId]: newValue };
          }
          return updated;
        });
      }
    }
  };

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length === 0) {
      setSelectedStats({ count: 0, sum: 0, avg: 0 });
      return;
    }

    let sum = 0;
    let validReadingsCount = 0;

    selectedRows.forEach(row => {
      const val = Number(row.reading);
      if (!isNaN(val)) {
        sum += val;
        validReadingsCount++;
      }
    });

    setSelectedStats({
      count: selectedRows.length,
      sum: sum,
      avg: validReadingsCount > 0 ? Math.round(sum / validReadingsCount) : 0
    });
  }, []);

  // Define columns with Excel-like features
  const columnDefs = useMemo<ColDef[]>(() => [
    { 
      field: 'feeder', 
      headerName: 'Feeder', 
      sortable: true, 
      filter: 'agTextColumnFilter', 
      editable: true, 
      resizable: true,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 200
    },
    { field: 'serialNumber', headerName: 'Serial Number', sortable: true, filter: 'agTextColumnFilter', editable: true, resizable: true },
    { field: 'registerCode', headerName: 'Code Number', sortable: true, filter: 'agTextColumnFilter', editable: true, resizable: true },
    { field: 'date', headerName: 'Date', sortable: true, filter: 'agDateColumnFilter', editable: true, resizable: true },
    { 
      field: 'reading', 
      headerName: 'Reading', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      editable: true, 
      resizable: true,
      valueFormatter: (params) => {
        if (params.value === undefined || params.value === null) return '-';
        return params.value.toString().padStart(7, '0');
      }
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    floatingFilter: true, // Adds Excel-like filter row below headers
  }), []);

  const exportToCsv = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({ fileName: 'meter_readings.csv' });
    }
  }, [gridApi]);

  const addRow = useCallback(() => {
    const newRecord: MeterRecord = {
      id: Math.random().toString(36).substring(2, 9),
      feeder: 'New Feeder',
      serialNumber: '000000',
      registerCode: '1.8.0',
      date: new Date().toISOString().split('T')[0],
      reading: 0
    };
    setRecords(prev => [newRecord, ...prev]);
  }, [setRecords]);

  const deleteSelected = useCallback(() => {
    if (!gridApi) return;
    const selectedNodes = gridApi.getSelectedNodes();
    const selectedIds = selectedNodes.map((node: any) => node.data.id);
    if (selectedIds.length > 0 && window.confirm(`Delete ${selectedIds.length} selected records?`)) {
      setRecords(prev => prev.filter(record => !selectedIds.includes(record.id)));
      gridApi.deselectAll();
    }
  }, [gridApi, setRecords]);

  // Data Analysis Calculations
  const analysis = useMemo(() => {
    if (records.length === 0) return { avg: 0, max: 0, min: 0, sum: 0 };
    const readings = records.map(r => Number(r.reading) || 0);
    const sum = readings.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / readings.length),
      max: Math.max(...readings),
      min: Math.min(...readings),
      sum
    };
  }, [records]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Data Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2a2a2a] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#f97316]/10 text-[#f97316] rounded-lg"><Calculator size={20} /></div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase">Total Records</p>
            <p className="text-xl font-bold text-neutral-100">{records.length}</p>
          </div>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2a2a2a] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><Activity size={20} /></div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase">Average Reading</p>
            <p className="text-xl font-bold text-neutral-100">{analysis.avg.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2a2a2a] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><ArrowUpRight size={20} /></div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase">Max Reading</p>
            <p className="text-xl font-bold text-neutral-100">{analysis.max.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2a2a2a] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><ArrowDownRight size={20} /></div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase">Min Reading</p>
            <p className="text-xl font-bold text-neutral-100">{analysis.min.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-[#141414] rounded-xl shadow-sm border border-[#2a2a2a] flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-[#2a2a2a] flex justify-between items-center bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] border border-[#2a2a2a] text-neutral-300 hover:bg-[#1a1a1a] hover:text-[#f97316] rounded-lg font-medium transition-colors text-sm shadow-sm"
            >
              <Plus size={16} /> Add Row
            </button>
            <button 
              onClick={deleteSelected}
              disabled={selectedStats.count === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] border border-[#2a2a2a] text-neutral-300 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 rounded-lg font-medium transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
          <button 
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f97316] text-white hover:bg-[#ea580c] rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Excel Formula Bar */}
        <div className="flex items-center border-b border-[#2a2a2a] bg-[#0a0a0a] shrink-0">
          <div className="w-16 border-r border-[#2a2a2a] px-3 py-2 text-xs font-mono text-neutral-400 bg-[#141414] flex items-center justify-center">
            {activeCellRef || '-'}
          </div>
          <div className="px-3 text-neutral-500 border-r border-[#2a2a2a] flex items-center justify-center bg-[#141414]">
            <FunctionSquare size={16} />
          </div>
          <input
            type="text"
            value={formulaValue}
            onChange={handleFormulaChange}
            disabled={!activeCell}
            placeholder={activeCell ? "Enter value..." : "Select a cell to edit"}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:bg-[#1a1a1a] disabled:opacity-50 font-mono transition-colors"
          />
        </div>
        
        {/* AG Grid */}
        <div className="flex-1 w-full ag-theme-alpine-dark" style={{ '--ag-background-color': '#141414', '--ag-header-background-color': '#0a0a0a', '--ag-border-color': '#2a2a2a', '--ag-row-border-color': '#2a2a2a', '--ag-odd-row-background-color': '#1a1a1a', '--ag-header-foreground-color': '#a3a3a3', '--ag-data-color': '#e5e5e5' } as React.CSSProperties}>
          <AgGridReact
            theme="legacy"
            rowData={records}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            rowSelection="multiple"
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            enableCellTextSelection={true}
            suppressRowClickSelection={true}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={20}
            stopEditingWhenCellsLoseFocus={true}
            onSelectionChanged={onSelectionChanged}
            onCellFocused={onCellFocused}
            onCellValueChanged={(params) => {
              // Update the main records state when a cell is edited
              const updatedRecords = [...records];
              const index = updatedRecords.findIndex(r => r.id === params.data.id);
              if (index !== -1) {
                updatedRecords[index] = params.data;
                setRecords(updatedRecords);
              }
              // Update formula bar if the edited cell is currently focused
              if (activeCell && activeCell.rowIndex === params.rowIndex && activeCell.colId === params.column.getColId()) {
                setFormulaValue(params.value !== null && params.value !== undefined ? String(params.value) : '');
              }
            }}
          />
        </div>

        {/* Excel-like Status Bar */}
        <div className="p-2 border-t border-[#2a2a2a] bg-[#0a0a0a] flex justify-end items-center gap-6 text-xs text-neutral-400 font-medium shrink-0">
          {selectedStats.count > 0 ? (
            <>
              <span>Average: {selectedStats.avg.toLocaleString()}</span>
              <span>Count: {selectedStats.count}</span>
              <span>Sum: {selectedStats.sum.toLocaleString()}</span>
            </>
          ) : (
            <span className="text-neutral-500">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
}
