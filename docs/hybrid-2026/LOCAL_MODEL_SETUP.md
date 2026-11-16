# On-device model setup and evidence

The UI invokes `initializeDeviceModel()` only from an explicit button gesture. The current Firebase guide limits the web on-device path to supported Chrome desktop browsers (Chrome 139+) and single-turn text generation; mobile, Firefox, and other browsers must not be described as supported local inference. Model download can take time and requires browser storage and device capacity.

1. Use a current supported Chrome desktop build and enable the Chrome Prompt API/local model feature as directed by the current Firebase hybrid guide.
2. Configure a Firebase web app and valid App Check for the environment.
3. Open a lesson, click **Prepare on-device model**, and wait for the UI to report ready.
4. Ask a short tutor question. Record the response's actual `inferenceSource`; the selected mode alone is not evidence of on-device execution.
5. Repeat with an Arabic input, including diacritics, prefixes/suffixes and a short sentence. Preserve the exact prompt, output, browser/device details, model availability result, and observed inference source in `EVIDENCE.md`.

No real device or Arabic language-quality result has been obtained in this environment yet. Do not present a mocked provider as real local-model evidence.

Official guide: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
