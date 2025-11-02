# YouTube scam comment cleaner

This application can be used for analyzing your YouTube video for scam/bot comments and hiding them.
Note that this application doesn't delete any comments. It only changes comments [moderation status](https://developers.google.com/youtube/v3/docs/comments/setModerationStatus) which hides the comments displaying in your video.

```
"moderationStatus": "rejected"
Rejects a comment as being unfit for display. This action also effectively hides all replies to the rejected comment.
```

The `red flags` for scam/bot comment detection are hardcoded for now.\
See: [comment-analysis/src/comment-analysis/RedFlags.ts](comment-analysis/src/comment-analysis/RedFlags.ts)

## Prerequisites

Having NodeJS installed: https://nodejs.org/en

## Getting started

First of all run `npm install`

### Running development server
```bash
npm run dev
```

### Building and running the app locally
```bash
npm run build
npm start
```


## Authentication

This application requires two types of authentication:

### a. YouTube API key (For fetching comments)
Used for reading video data and comments.

### b. Google OAuth2 (Required for moderating comments)
If Google Oauth2 is used, YouTube API key isn't needed.\
The [Comments: setModerationStatus](https://developers.google.com/youtube/v3/docs/comments/setModerationStatus) endpoint requires OAuth2 authentication and cannot use API keys alone. You must sign in with Google to be able to moderate comments.

**WARNING: BEFORE YOU CREATE EITHER AN API KEY OR AN OAUTH2 CLIENT. PLEASE UNDERSTAND WHAT THEY ARE USED FOR AND DO NOT SHARE THEM WITH ANYONE!**

See: https://developers.google.com/youtube/v3/docs

This application only uses these endpoints:
 - [Videos: list](https://developers.google.com/youtube/v3/docs/videos/list)
 - [Channels: list](https://developers.google.com/youtube/v3/docs/channels/list)
 - [CommentThreads: list](https://developers.google.com/youtube/v3/docs/commentThreads/list)
 - [Comments: list](https://developers.google.com/youtube/v3/docs/comments/list)
 - [Comments: setModerationStatus](https://developers.google.com/youtube/v3/docs/comments/setModerationStatus) **(requires OAuth2)**


1. Create a Google Cloud Project: https://console.cloud.google.com/projectcreate
2. Enable YouTube Data API v3: https://console.cloud.google.com/apis/api/youtube.googleapis.com
3. Create the `API key` https://console.cloud.google.com/apis/api/youtube.googleapis.com/credentials from `+ CREATE CREDENTIALS` button.
4. Restrict the API key for your liking from by clicking three dots at right in api key list item and selecting `Edit API key`.\
Configure `API restrictions` -> `Restrict key` -> `YouTube Data API 3v`.\
And you could set an IP address restriction for the API key for example.


## Configuring the API key

You can either paste the YouTube API key to an input field or pre configure it to environment file by creating `.env.local` file in the `web` directory with content:
```
NEXT_PUBLIC_YOUTUBE_API_KEY=<youtube-api-key>
```


## Configuring OAuth2 (Required for moderating comments)

To enable the comment moderating feature, you need to set up Google OAuth2:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to "APIs & Services" > "Credentials" (https://console.cloud.google.com/apis/credentials)
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add you Google account email (what you will be using for signing in) as "audience" to https://console.cloud.google.com/auth/audience
7. Choose "Web application" as application type
8. Add **Authorized JavaScript origins**:
   - URL where the app is hosted (e.g., `https://yourdomain.com`)
9. Add **Authorized redirect URIs**:
   - URL where the app is hosted (e.g., `https://yourdomain.com`)
10. Click "Create" and copy the Client ID

Once copied, you can paste the Client ID to "Google OAuth Client ID" input field in the app and "Sign in with Google" button should appear.


## API Key quota

Projects that enable the YouTube Data API have a default quota allocation of 10,000 units per day.

The only significant quota usages are:
- **Listing comments**\
  Single "list comments" request uses `1 unit` and returns up to 100 comments.\
  When listing more than 100 comments, the list comment endpoint is called multiple times.
- **Hiding comments (setModerationStatus)**\
  Hiding a comments uses `50 units`. TODO: Check what is the max quota when signed in with Oauth2?

You can check your remaining quota from: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

Please read more info from Google's documentation and verify the values:
- https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits
- https://developers.google.com/youtube/v3/determine_quota_cost


## Configuring custom Red flags configuration `.json` file

The app uses a default "<b>Crypto Bots</b>" configuration that tries to detect most common crypto scam comments.

You can also provide your own configuration `.json` file via `LOAD CONFIG` button.

### Configuring:

Create `custom-red-flags.json` file with this content:
```.json
{
  "$schema": "https://github.com/metuuu/youtube-scam-comment-cleaner/blob/main/comment-analysis/src/comment-analysis/red-flags-config-schema.json",
  "name": "Custom Red Flags",
  "flags": [
    {}
  ]
}
```

If you open the file using a modern IDE, it should auto suggest available fields.

The available configuration can also be found from:[red-flags-config-schema.json](comment-analysis/src/comment-analysis/red-flags-config-schema.json).

The `.json` configuration is transformed to javascript object. See: [RedFlags.ts](comment-analysis/src/comment-analysis/RedFlags.ts).

If you are interested of knowing how the comment analysis logic works, please see: [analyzeComment.ts](comment-analysis/src/comment-analysis/analyzeComment.ts).
