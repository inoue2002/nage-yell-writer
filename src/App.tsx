import { ChangeEvent, FC, useEffect, useState } from 'react';

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
  const [point, setPoint] = useState<number>(1);
  const [status, setStatus] = useState<string>('');

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
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
    return Object.keys(newErrors).length === 0;
  };

  const writeToNFC = async () => {
    if (!validateForm()) return;

    const jsonData = `{
    "point": ${point},
    "message": "${message.trim()}"
  }`;

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
        setTimeout(() => {
          setStatus('');
        }, 3000);
      } else {
        setStatus('お使いのブラウザはWebNFCをサポートしていません。');
      }
    } catch (error) {
      setStatus(`エラーが発生しました: ${error}`);
      setTimeout(() => {
        setStatus('');
      }, 3000);
    }
  };

  useEffect(() => {
    writeToNFC();
    console.log('message:', message);
    console.log('point:', point);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, point]);

  return (
    <div className="p-16 bg-gradient-to-r from-green-100 to-green-200 rounded-lg shadow-2xl">
      <div className={`h-8 ${isSupported ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
      <p className="text-gray-700 text-2xl font-bold mt-4">
        投げエール
        <span className="text-sm">(v1.1.1)</span>
      </p>
      <form className="space-y-12 mt-8">
        <div>
          <label htmlFor="message" className="block mb-4 text-2xl font-semibold text-green-700">
            メッセージ:
          </label>
          <textarea
            id="message"
            value={message}
            onChange={handleMessageChange}
            className="w-full p-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="ここにメッセージを入力"
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="point" className="block mb-4 text-2xl font-semibold text-green-700">
            応援:
          </label>
          <div className="relative">
            <input
              id="point"
              type="range"
              min="1"
              max="1000"
              value={point}
              onChange={handlePointChange}
              className="w-full appearance-none h-8 bg-gradient-to-r from-blue-200 to-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: `linear-gradient(to right, #ff69b4 ${((point - 1) / 999) * 100}%, transparent ${((point - 1) / 999) * 100}%)` }}
            />
            <div
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{
                background: `linear-gradient(to right, #ff69b4 ${((point - 1) / 999) * 100}%, transparent ${
                  ((point - 1) / 999) * 100
                }%)`,
              }}
            >
              <span
                className="absolute text-4xl"
                style={{
                  left: `${((point - 1) / 999) * 100}%`,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                }}
                role="img"
                aria-label="thumbs up"
              >
                👍
              </span>
            </div>
          </div>
        </div>
      </form>
      {status && (
        <div className="mt-12 p-12 border-4 border-gray-300 rounded-lg bg-gray-200 shadow-inner">
          <p className="text-2xl font-semibold text-gray-800">{status}</p>
        </div>
      )}
    </div>
  );
};

export default App;
