import { useState } from 'react';
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import FileUpload from './FileUpload';
import '@szhsin/react-menu/dist/core.css';
import './Menu.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

const UnrealLogViewer: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [linesArray, setLinesArray] = useState<string[]>([]);

  return (
    <div className="unreallogviewer-container">
      <div className="menu-container">
        <Menu
          menuButton={<MenuButton>File</MenuButton>}
          menuClassName="memreport-menu"
          transition
        >
          <MenuItem className="menu-item">
            <FileUpload setLinesArray={setLinesArray} setFileName={setFileName} />
          </MenuItem>
        </Menu>

        <div className="file-name">
          {fileName || 'No file loaded'}
        </div>
      </div>

      <div className="log-content">
        {linesArray.length === 0 ? (
          <div className="log-empty">Open an Unreal log file to begin</div>
        ) : (
          <div className="log-raw">
            {linesArray.join('\n')}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnrealLogViewer;
