import jsQR from 'jsqr';
import { ChangeEvent, FC, useEffect, useRef, useState, useCallback } from 'react';

const App: FC = () => {
  const isNFCSupported = useCallback(() => {
    return 'NDEFReader' in window;
  }, []);

  const [isSupported] = useState<boolean>(isNFCSupported());
  const [apiKey, setApiKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [point, setPoint] = useState<number>(1);
  const [status, setStatus] = useState<string>('');
  const [qrStatus, setQrStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMessageChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.currentTarget.value);
  }, []);

  const handlePointChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPoint(Number(e.currentTarget.value));
  }, []);

  const toggleCamera = useCallback(() => {
    setFacingMode((prevMode) => (prevMode === 'environment' ? 'user' : 'environment'));
  }, []);

  const startQRCodeScan = useCallback(() => {
    const video = videoRef.current;
    const canvasElement = document.createElement('canvas');
    const canvas = canvasElement.getContext('2d');

    if (video) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode } }).then((stream) => {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.play();
        const tick = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas?.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas?.getImageData(0, 0, canvasElement.width, canvasElement.height);
            if (imageData) {
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code) {
                setApiKey(code.data);
                setQrStatus('QRコードが読み取られました。');
                video.srcObject = null;
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
              }
            }
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
  }, [facingMode]);

  const generateEssay = useCallback(async (point: number) => {
    if (!apiKey) {
      setStatus('APIキーが設定されていません。');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: `ライブパフォーマーを見たユーザーが、応援メッセージを送信します。簡潔な感想文を1~1000のスコアを指定するので、そのスコアを元に感想文を生成してください。生成文は10~80に収まるようにすること。点が低くてもマイナスな意見は言わずに、ポジティブな回答をお願いします。スコア: ${point}`,
            },
          ],
        }),
      });
      const data = await response.json();
      console.log(data);
      console.log(apiKey);
      if (data.choices && data.choices.length > 0) {
        setMessage(data.choices[0].message.content);
        setStatus('感想文が生成されました。');
      } else {
        setStatus('エラーが発生しました: 生成されたデータが不正です。');
      }
    } catch (error) {
      setStatus(`エラーが発生しました: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const validateForm = useCallback(() => {
    const newErrors: { message?: string; point?: string } = {};
    if (!message.trim()) {
      newErrors.message = 'メッセージは必須です';
    }
    if (point < 1 || point > 1000) {
      newErrors.point = 'ポイントは1から1000の間でなければなりません';
    }
    return Object.keys(newErrors).length === 0;
  }, [message, point]);

  const writeToNFC = useCallback(async () => {
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
  }, [isSupported, message, point, validateForm]);

  useEffect(() => {
    if (!message) {
      generateEssay(point);
    }
    startQRCodeScan();
    writeToNFC();
    console.log('message:', message);
    console.log('point:', point);
  }, [message, point, generateEssay, startQRCodeScan, writeToNFC]);

  const handleResetMessage = useCallback(() => {
    setMessage('');
  }, []);

  return (
    <div className="p-16 bg-gradient-to-r from-green-100 to-green-200 rounded-lg shadow-2xl">
      <div className={`h-8 ${isSupported ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
      <p className="text-gray-700 text-2xl font-bold mt-4">
        投げエール
        <span className="text-sm">(v1.1.4)</span>
      </p>
      <form className="space-y-12 mt-8">
        <div>
          <label htmlFor="apiKey" className="block mb-4 text-2xl font-semibold text-green-700">
            APIキー (QRコードをスキャン):
          </label>
          <video ref={videoRef} className="w-1/4 mt-4 rounded-lg shadow-lg" />
          {qrStatus && <p className="mt-2 text-green-700">{qrStatus}</p>}
          <button
            type="button"
            onClick={toggleCamera}
            className="mt-4 w-full p-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            カメラを切り替える
          </button>
        </div>
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
          <button
            type="button"
            onClick={handleResetMessage}
            className="mt-4 w-full p-4 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            メッセージをリセット
          </button>
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
              style={{
                background: `linear-gradient(to right, #ff69b4 ${((point - 1) / 999) * 100}%, transparent ${
                  ((point - 1) / 999) * 100
                }%)`,
              }}
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
      {loading && (
        <div className="mt-12 p-12 border-4 border-gray-300 rounded-lg bg-gray-200 shadow-inner">
          <p className="text-2xl font-semibold text-gray-800">メッセージを生成中...</p>
        </div>
      )}
      {status && !loading && (
        <div className="mt-12 p-12 border-4 border-gray-300 rounded-lg bg-gray-200 shadow-inner">
          <p className="text-2xl font-semibold text-gray-800">{status}</p>
        </div>
      )}
    </div>
  );
};

export default App;
