import { toDataURL } from "qrcode"

async function generateQRCode(id: string): Promise<void> {
  try {
    const url = new URL("?id=" + id, window.location.href);
    const qrCodeDataURL = await toDataURL(url.href, { errorCorrectionLevel: 'H' });
    const qrCodeImage = document.createElement('img');
    qrCodeImage.id = 'qr-code';
    qrCodeImage.src = qrCodeDataURL;
    document.body.appendChild(qrCodeImage);
  } catch (error) {
    console.error('QRコードの生成に失敗しました:', error);
  }
}

// URLのクエリパラメータを取得する関数
function getQueryParam(param: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

async function main() {
  const id = getQueryParam('id')
  const peerConnection = new RTCPeerConnection();
  if (!id) {
    const newID = Math.random().toString(36).substr(2, 9);
    await generateQRCode(newID);
    const qrCodeContainer = document.getElementById('qr-code')!;
    const dataChannel = peerConnection.createDataChannel('camera-share' + newID);
    dataChannel.onopen = () => {
      console.log('Data channel is open');
      qrCodeContainer.style.display = 'none';
    };

    dataChannel.onmessage = (event) => {
      console.log('Received message:', event.data);
      const receivedDataContainer = document.createElement('div');
      receivedDataContainer.textContent = `Received data: ${event.data}`;
      document.body.appendChild(receivedDataContainer);
    };
  } else {
    const dataChannel = peerConnection.createDataChannel('camera-share'+id);

    dataChannel.onopen = () => {
      console.log('Data channel is open');
    };

    dataChannel.onmessage = (event) => {
      console.log('Received message:', event.data);
    };

    // カメラのストリームを取得して共有
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        const videoTrack = stream.getVideoTracks()[0];
        peerConnection.addTrack(videoTrack, stream);
      })
      .catch((error) => {
        console.error('カメラのストリーム取得に失敗しました:', error);
      });

    // オファーを作成して送信
    peerConnection.createOffer()
      .then((offer) => {
        return peerConnection.setLocalDescription(offer);
      })
      .then(() => {
        console.log('Offer created and set as local description');
        // ここでオファーを共有するためのコードを追加
        const offer = peerConnection.localDescription;
        if (offer) {
          console.log('Offer SDP:', offer.sdp);
          // ここでオファーを共有するための方法を実装します
          // 例えば、WebSocketやHTTPリクエストを使用してオファーを送信することができます
        }
      })
      .catch((error) => {
        console.error('オファーの作成に失敗しました:', error);
      });
  }
}
main()