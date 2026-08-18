# Social Sharing

## Purpose

Writers lets a reader create a small visual preview of a piece and share that preview from their phone or browser. The preview is designed to create curiosity. It does not publish the entire writing to social media and it does not replace the full reading experience on the Writers website.

## Reader flow

1. Open the Writers homepage or Library.
2. Select a piece by clicking **Read piece** or **Read more**.
3. The piece opens in the full reader.
4. Click **Share** beside the reader's Back button.
5. A themed share dialog opens with a vertical preview card.
6. Choose one of the available actions:
   - **Share preview**
   - **Download image**
   - **Copy link**

The Share button is hidden everywhere else. It only becomes visible after a specific piece has been loaded into the reader because the preview needs that piece's title, author, excerpt, and slug.

## What the preview contains

The generated card is designed for a social Story format at approximately 1080 by 1920 pixels. It contains:

- The Subconscious Prints name
- The work title
- A short excerpt or preview
- The writer's name
- A reminder to read the full piece at Writers

It intentionally does not include the full writing. A person who wants to continue reading must follow the link back to the main Writers website.

## Instagram and social apps

A normal website cannot force a file directly into someone's Instagram Story. Instagram controls the final posting step and does not provide a simple public browser button for personal Story publishing.

On a supported mobile browser, **Share preview** uses the device's native Web Share menu. Instagram may appear as one of the available apps. The reader then chooses Instagram and completes the Story inside Instagram.

If the browser does not support sharing image files, Writers uses a fallback:

1. Download the preview image.
2. Copy the link to the specific piece.
3. The reader uploads the image to their social app and adds the copied link if desired.

This is why the feature is called **Share preview** rather than promising that every browser can publish directly to Instagram.

## Shared link behavior

Each shared link includes the piece slug in the URL hash, for example:

```text
https://your-site.example/#piece/scars
```

When the Writers site opens a valid `#piece/...` link, it loads that specific piece in the reader so the recipient can continue reading on the main website.

## Reading Room label

The header may show:

```text
Reading Room: Off
```

This is a separate optional ambience control. When enabled, it changes to:

```text
Reading Room: On
```

It controls a soft browser-generated background sound and has no connection to social sharing. The setting is saved in the visitor's browser using local storage. It is off by default.

## Troubleshooting

### I cannot see the Share button

Make sure you have opened a specific piece first. The button does not appear on the homepage, Library cards, or author cards. Click **Read piece** or **Read more**, then look beside **Back** at the top of the reader.

If it still does not appear:

1. Refresh the page.
2. Confirm the deployed site is using the latest `main` build.
3. Open the browser developer console and check that `script.js` loaded without an error.
4. Check that the deployed `index.html` contains `data-share-reader` and that the deployed `script.js` contains `createShareCard`.

### Instagram is not shown in the share menu

This depends on the device, browser, operating system, and installed apps. The website cannot guarantee that Instagram will be listed. Use **Download image** and **Copy link** as the universal fallback.

### The Reading Room label is still visible

That label is expected because the ambience toggle is part of the current site header. `Reading Room: Off` means the feature is disabled. It can be renamed or removed as a separate visual decision without affecting social sharing.
