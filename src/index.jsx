require('@streamlayer/web-os/polyfills');
require('@streamlayer/web-os/style.css');

var React = require('react');
var ReactDOM = require('react-dom');
var StreamLayer = require('@streamlayer/web-os');

var searchParams = new URLSearchParams(window.location.search)

var PRODUCTION = searchParams.get('production') === null
var SDK_KEY = searchParams.get('sdk_key')
var EVENT_ID = searchParams.get('event_id')

function Demo() {
  const [isPaused, setIsPaused] = React.useState(false);
  const videoPlayerRef = React.useRef(null);

  const handlePause = () => {
    setIsPaused(true);
  };

  const handlePlay = () => {
    setIsPaused(false);
  };

  const videoPlayerController = (videoPlayerData) => {
    const video = videoPlayerRef.current

    if (!video) return

    if (videoPlayerData.play === true) {
      video.play()
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <video
        ref={videoPlayerRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        poster="https://developers.google.com/interactive-media-ads/images/vsi_poster.jpg"
        playsInline
        muted
        onPause={handlePause}
        onPlay={handlePlay}
        loop
        autoPlay
        controls={!isPaused}
        controlsList="nodownload nofullscreen noremoteplayback"
      >
        <source src="//s0.2mdn.net/4253510/google_ddm_animation_480P.mp4" />
        <source src="//s0.2mdn.net/4253510/google_ddm_animation_480P.webm" />
      </video>
      <StreamLayer.StreamLayerSDKTvPauseAd
        showPauseAd={isPaused}
        videoPlayerController={videoPlayerController}
        options={{
          showPauseButton: true,
        }}
        vastUrls={[
          {
            template: 'default',
            url: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/23213969138/adxvsporta&description_url=http%3A%2F%2Fstreamlayer.io&tfcd=0&npa=0&sz=400x300%7C640x480%7C640x480&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s&correlator=',
          },
        ]}
      />
    </div>
  )
}

function App() {
  return (
    <StreamLayer.StreamLayerProvider
      sdkKey={SDK_KEY}
      event={EVENT_ID}
      production={PRODUCTION}
    >
      <Demo />
    </StreamLayer.StreamLayerProvider>
  );
}

var rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.render(<App />, rootElement);
} else {
  console.error('Root element not found!');
}
