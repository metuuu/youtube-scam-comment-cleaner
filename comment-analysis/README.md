# YouTube comment analyzer

To run this library locally, you must configure create [.env.local](.env.local) file and configure `YOUTUBE_API_KEY`.

```
YOUTUBE_API_KEY=<api-key>
```

Then configure [.env](.env) file.

```
RED_FLAG_WEIGHT_THRESHOLD=4
YOUTUBE_VIDEO_ID=<video-id-to-analyze>
```

Then run with command `npm run start`. The results will be outputted to `./output/<video-id>.json`.
