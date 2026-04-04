import { useState, useEffect, useRef } from 'react';
import { List } from 'react-window';
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import FileUpload from './FileUpload';
import '@szhsin/react-menu/dist/core.css';
import './Menu.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

const LINE_HEIGHT = 16;

interface MonitorInfo {
  device: string;
  resolution: string;
  workArea: string;
  isPrimary: boolean;
}

interface SummaryInfo {
  executableName: string;
  build: string;
  platform: string;
  engineVersion: string;
  os: string;
  cpu: string;
  cpuCores: string;
  ram: string;
  buildConfiguration: string;
  branchName: string;
  commandLine: string;
  gpuName: string;
  gpuVram: string;
  driverVersion: string;
  driverDate: string;
  monitors: MonitorInfo[];
}

const emptySummary: SummaryInfo = {
  executableName: '',
  build: '',
  platform: '',
  engineVersion: '',
  os: '',
  cpu: '',
  cpuCores: '',
  ram: '',
  buildConfiguration: '',
  branchName: '',
  commandLine: '',
  gpuName: '',
  gpuVram: '',
  driverVersion: '',
  driverDate: '',
  monitors: [],
};

const parseSummary = (lines: string[]): SummaryInfo => {
  const info = { ...emptySummary, monitors: [] as MonitorInfo[] };
  const scalarFields: (keyof Omit<SummaryInfo, 'monitors'>)[] = [
    'executableName', 'build', 'platform', 'engineVersion', 'os', 'cpu', 'cpuCores', 'ram',
    'buildConfiguration', 'branchName', 'commandLine', 'gpuName', 'gpuVram',
    'driverVersion', 'driverDate',
  ];

  for (const line of lines) {
    if (!info.executableName) {
      const m = line.match(/LogInit: ExecutableName: (.+)/);
      if (m) info.executableName = m[1].trim();
    }
    if (!info.build) {
      const m = line.match(/LogInit: Build: (.+)/);
      if (m) info.build = m[1].trim();
    }
    if (!info.platform) {
      const m = line.match(/LogInit: Platform=(.+)/);
      if (m) info.platform = m[1].trim();
    }
    if (!info.engineVersion) {
      const m = line.match(/LogInit: Engine Version: (.+)/);
      if (m) info.engineVersion = m[1].trim();
    }
    if (!info.os) {
      const m = line.match(/LogInit: OS: (.+?)(?:,\s*CPU:|$)/);
      if (m) info.os = m[1].trim();
    }
    if (!info.cpu) {
      const m = line.match(/Metadata set : cpu="([^"]+)"/);
      if (m) info.cpu = m[1].trim();
    }
    if (!info.cpuCores) {
      const m = line.match(/LogInit: CPU Page size=\d+, Cores=(\d+)/);
      if (m) info.cpuCores = m[1].trim();
    }
    if (!info.ram) {
      const m = line.match(/LogMemory: Memory total: Physical=(\S+)/);
      if (m) info.ram = m[1].trim();
    }
    if (!info.buildConfiguration) {
      const m = line.match(/LogInit: Build Configuration: (.+)/);
      if (m) info.buildConfiguration = m[1].trim();
    }
    if (!info.branchName) {
      const m = line.match(/LogInit: Branch Name: (.+)/);
      if (m) info.branchName = m[1].trim();
    }
    if (!info.commandLine) {
      const m = line.match(/LogInit: Command Line: (.+)/);
      if (m) info.commandLine = m[1].trim();
    }
    if (!info.gpuName) {
      const m = line.match(/LogRHI:\s+Name: (.+)/);
      if (m) info.gpuName = m[1].trim();
    }
    if (!info.gpuVram) {
      const m = line.match(/LogD3D12RHI:.*Adapter has (\d+)MB of dedicated video memory.*UMA:false/);
      if (m && parseInt(m[1]) > 0) {
        const mb = parseInt(m[1]);
        info.gpuVram = `${(mb / 1024).toFixed(1)} GB`;
      }
    }
    if (!info.driverVersion) {
      const m = line.match(/LogRHI:\s+Driver Version: (.+)/);
      if (m) info.driverVersion = m[1].trim();
    }
    if (!info.driverDate) {
      const m = line.match(/LogRHI:\s+Driver Date: (.+)/);
      if (m) info.driverDate = m[1].trim();
    }
    const monitorMatch = line.match(/LogWindows:\s+resolution: (\S+), work area: (.+?), device: '([^']+)'(\s+\[PRIMARY\])?/);
    if (monitorMatch) {
      const device = monitorMatch[3];
      if (!info.monitors.some(m => m.device === device)) {
        info.monitors.push({
          resolution: monitorMatch[1],
          workArea: monitorMatch[2],
          device,
          isPrimary: !!monitorMatch[4],
        });
      }
    }

    // Early exit once all scalar fields and at least one monitor found
    const allScalarsDone = scalarFields.every(f => !!info[f]);
    if (allScalarsDone && info.monitors.length > 0 && info.driverDate) break;
  }
  return info;
};

const SummaryPanel: React.FC<{ info: SummaryInfo }> = ({ info }) => {
  const buildFields: [string, string][] = [
    ['Platform', info.platform],
    ['Build', info.build],
    ['Build Config', info.buildConfiguration],
    ['Executable', info.executableName],
    ['Command Line', info.commandLine],
    ['Engine Version', info.engineVersion],
  ];

  const systemFields: [string, string][] = [
    ['OS', info.os],
    ['CPU', info.cpu],
    ['CPU Cores', info.cpuCores],
    ['RAM', info.ram],
  ];

  const gpuFields: [string, string][] = [
    ['GPU', info.gpuName],
    ['VRAM', info.gpuVram],
    ['Driver Version', info.driverVersion],
    ['Driver Date', info.driverDate],
  ];


  const renderRows = (fields: [string, string][]) => fields.map(([label, value]) => (
    <div key={label} className="summary-row">
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value || '—'}</span>
    </div>
  ));

  return (
    <div className="summary-panel">
      <div className="summary-column">
        {renderRows(buildFields)}
      </div>
      <div className="summary-column-divider" />
      <div className="summary-column">
        {renderRows(systemFields)}
      </div>
      <div className="summary-column-divider" />
      <div className="summary-column">
        {renderRows(gpuFields)}
        {info.monitors.length > 0 && <div className="summary-divider" />}
        {info.monitors.map((mon) => (
          <div key={mon.device} className="summary-row">
            <span className="summary-label">
              {mon.device}{mon.isPrimary ? ' [PRIMARY]' : ''}
            </span>
            <span className="summary-value">{mon.resolution} · {mon.workArea}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

type LogRowExtraProps = { lines: string[] };
const LogRow = ({ index, style, lines }: { ariaAttributes: object; index: number; style: React.CSSProperties } & LogRowExtraProps) => (
  <div style={style} className="log-line">{lines[index]}</div>
);

const UnrealLogViewer: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [linesArray, setLinesArray] = useState<string[]>([]);
  const [summary, setSummary] = useState<SummaryInfo>(emptySummary);
  const [logHeight, setLogHeight] = useState(400);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setLogHeight(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSetLinesArray = (lines: string[]) => {
    setLinesArray(lines);
    setSummary(parseSummary(lines));
  };

  const rowProps: LogRowExtraProps = { lines: linesArray };

  return (
    <div className="unreallogviewer-container">
      <div className="menu-container">
        <Menu
          menuButton={<MenuButton>File</MenuButton>}
          menuClassName="memreport-menu"
          transition
        >
          <MenuItem className="menu-item">
            <FileUpload setLinesArray={handleSetLinesArray} setFileName={setFileName} />
          </MenuItem>
        </Menu>
        <div className="file-name">
          {fileName || 'No file loaded'}
        </div>
      </div>

      {linesArray.length > 0 && <SummaryPanel info={summary} />}

      <div className="log-content" ref={logContainerRef}>
        {linesArray.length === 0 ? (
          <div className="log-empty">Open an Unreal log file to begin</div>
        ) : (
          <List<LogRowExtraProps>
            rowCount={linesArray.length}
            rowHeight={LINE_HEIGHT}
            rowComponent={LogRow}
            rowProps={rowProps}
            style={{ height: logHeight }}
          />
        )}
      </div>
    </div>
  );
};

export default UnrealLogViewer;
