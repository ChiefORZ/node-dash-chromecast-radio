require('dotenv').load();

var dash_button = require('node-dash-button');
var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const pkg = require('./package.json');

var dash = dash_button(process.env.DASH_MAC_ADDRESS, null, 10000, 'udp');
console.log('service %s running!', pkg.name);

dash.on('detected', initializeChromecast);
dash.on('detected', () => console.log('press detected'));

var client;
var player;

function initializeChromecast() {
  if (!client) {
    client = new Client();

    client.connect(process.env.CHROMECAST_IP_ADDRESS, function() {
      console.log('connected to chromecast, launching %s ...', process.env.STREAM_TITLE);
      client.launch(DefaultMediaReceiver, function(err, p) {
        player = p;
        var media = {
          contentId: process.env.STREAM_URL,
          contentType: 'audio/mpeg',
          streamType: 'LIVE',
          metadata: {
            type: 0,
            metadataType: 0,
            title: process.env.STREAM_TITLE,
            images: [{ url: process.env.STREAM_ICON_URL }],
          },
        };

        player.on('status', function(status) {
          console.log('status broadcast playerState=%s', status.playerState);
        });

        console.log(
          'app "%s" launched, loading media %s ...',
          player.session.displayName,
          media.contentId
        );

        player.load(media, { autoplay: true }, function(err, status) {
          console.log('media loaded playerState=%s', status.playerState);
        });
      });
    });

    client.on('error', function(err) {
      console.log('Error: %s', err.message);
      client.close();
      player = null;
      client = null;
    });
  } else {
    console.log('connected to chromecast, stopping %s ...', process.env.STREAM_TITLE);
    player.stop();
    client.close();
    player = null;
    client = null;
  }
}
