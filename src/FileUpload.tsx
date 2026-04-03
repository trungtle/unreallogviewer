import { ChangeEvent, useRef } from 'react';

function FileUpload({ setLinesArray, setFileName }: { setLinesArray: (lines: string[]) => void; setFileName: (name: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      readFileInChunks(e.target.files[0]);
    }
  };

  const readFileInChunks = async (f: File) => {
    const CHUNK_SIZE = 2048 * 1024 * 2; // 4MB chunk size
    const fileReader = new FileReader();
    let offset = 0;
    let newLinesArray: string[] = [];

    fileReader.onload = async (e) => {
      const text = e.target!.result as string;
      newLinesArray = newLinesArray.concat(text.split('\n'));
      setLinesArray(newLinesArray);

      offset += CHUNK_SIZE;
      if (offset < f.size) {
        readNextChunk();
      }
    };

    const readNextChunk = () => {
      const blob = f.slice(offset, offset + CHUNK_SIZE);
      fileReader.readAsText(blob);
    };

    readNextChunk();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <button onClick={handleButtonClick}>Open Log File</button>
      <input
        type="file"
        accept=".log, .txt"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default FileUpload;
