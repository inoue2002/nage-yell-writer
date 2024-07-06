import { ChangeEvent, FC, useEffect, useState } from 'react';
import './App.css';

const App: FC = () => {
  /**
   * 対応しているかの確認
   * @returns
   */
  // eslint-disable-next-line react-refresh/only-export-components
  const isNFCSupported = () => {
    if ('NDEFReader' in window) {
      // NFC読み取り機能がサポートされている（Chromeの場合）
      return true;
    } else {
      // NFC読み取り機能がサポートされていない
      return false;
    }
  };
  const [isSupported] = useState<boolean>(isNFCSupported());
  const [message, setMessage] = useState<string>('');
  const [point, setPoint] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [errors, setErrors] = useState<{ message?: string; point?: string }>({});

  const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.currentTarget.value);
  };

  const handlePointChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPoint(Number(e.currentTarget.value));
  };

  const validateForm = () => {
    const newErrors: { message?: string; point?: string } = {};
    if (!message.trim()) {
      newErrors.message = 'メッセージは必須です';
    }
    if (point < 1 || point > 1000) {
      newErrors.point = 'ポイントは1から1000の間でなければなりません';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const writeToNFC = async () => {
    if (!validateForm()) return;

    const jsonData = `{message:"${message.trim()}",point:${point}}`;

    try {
      if (isSupported) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ndef = new (window as any).NDEFReader();
        await ndef.write({
          records: [
            {
              recordType: 'text',
              data: jsonData,
            },
          ],
        });
        setStatus('NFCタグに正常に書き込みました！');
      } else {
        setStatus('お使いのブラウザはWebNFCをサポートしていません。');
      }
    } catch (error) {
      setStatus(`エラーが発生しました: ${error}`);
    }
  };

  useEffect(() => {
    writeToNFC();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, point]);

  return (
    <div className="p-4">
      <div className={`h-2 ${isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <h1 className={`text-2xl font-bold mb-4 ${isSupported ? 'text-green-500' : 'text-red-500'}`}>
        WebNFC JSON Writer
      </h1>
      <p className="text-gray-500">バージョン: 1.0.6</p>
      <form className="space-y-4">
        <div>
          <label htmlFor="message" className="block mb-1">
            メッセージ:
          </label>
          <input id="message" value={message} onChange={handleMessageChange} className="w-full p-2 border rounded" />
          {errors.message && <p className="text-red-500">{errors.message}</p>}
        </div>
        <div>
          <label htmlFor="point" className="block mb-1">
            ポイント:
          </label>
          <input
            id="point"
            type="number"
            value={point}
            onChange={handlePointChange}
            className="w-full p-2 border rounded"
          />
          {errors.point && <p className="text-red-500">{errors.point}</p>}
        </div>
      </form>
      {status && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
};

export default App;
