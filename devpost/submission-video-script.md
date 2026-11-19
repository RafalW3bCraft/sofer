# Sofer — Submission Video

**Target runtime:** 2:45, with a hard cap of 3:00  
**Format:** 16:9 screen capture, English narration and English captions  
**Recording note:** Capture the live hosted site. Show the actual `inferenceSource` label for every AI scene; do not use simulated source labels or fabricated responses.

## Timed narration and picture

| Time | Picture | Narration |
|---|---|---|
| 0:00–0:20 | Home dashboard, then the Continue action | Learning to read Arabic can feel difficult when a learner sees words without the context that connects them. Sofer teaches Modern Standard Arabic one sentence at a time, with a calm, guest-first experience that starts immediately. |
| 0:20–0:48 | Curriculum list; open a trusted greetings lesson | Each lesson begins with a practical sentence and a clear learning objective. Arabic appears right-to-left, while transliteration and translation help a new reader find their footing. Reviewed material stays distinct from candidate lesson content. |
| 0:48–1:12 | Select a token; show its contextual meaning and grammar panel; answer a comprehension question | Tap a word to explore its meaning in context, its grammar, and its role in the sentence. Then answer a deterministic comprehension question. The curated translation and answer key remain the source of truth for learning and grading. |
| 1:12–1:48 | Prepare the device model; ask a short lesson-grounded tutor question; show the response and actual source | The tutor uses Firebase AI Logic with the current lesson as context. A learner can prepare the device model with a direct action, then ask a focused question about the sentence. Sofer reports the inference source returned by Firebase, making the response path visible. |
| 1:48–2:08 | Switch to a cloud inference setting; ask a second grounded question; show actual source | When the selected inference policy uses the cloud, the same Firebase AI Logic layer provides a lesson-aware response. Generated explanations support the lesson while reviewed translations and grading stay unchanged. |
| 2:08–2:28 | Practice activity, vocabulary review, progress page | Practice turns recognition into recall with vocabulary and sentence reconstruction. Progress is saved locally for guest learners, and words marked for review remain easy to revisit. |
| 2:28–2:43 | Return to dashboard, finish on Sofer wordmark | Sofer combines Arabic-first learning design with Firebase AI Logic hybrid inference: private, responsive device inference where available, and a cloud path when the policy calls for it. Every step keeps the learner focused on understanding the language. |

## Recording checklist

- Use current Chrome desktop for the on-device section and wait for device-model preparation to complete before recording the inference request.
- Capture the actual response source in the interface; keep the source label legible long enough to read.
- Use a second AI request for the cloud section and capture its actual source label.
- Keep the Firebase project identifiers, browser console, local environment, and personal learner data out of frame.
- Add English subtitles, check the final runtime is below three minutes, and publish the final video publicly on YouTube.
- Keep the public video URL unset in submission materials until upload and playback have been verified.
