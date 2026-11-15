# Screen-reader test script (NVDA, about 10 minutes)

NVDA is free for Windows: <https://www.nvaccess.org/download/>.
Use Chrome, Edge or Firefox. Keep this list on a second screen or a phone.

**NVDA basics**
- Start or stop NVDA: `Ctrl + Alt + N`
- Stop speech: `Ctrl`
- The **NVDA key** is `Insert` (or `Caps Lock` if you set it up that way)
- NVDA switches by itself between **browse mode** (reading) and **focus
  mode** (using controls). `NVDA + Space` switches by hand.

## 1. Page structure

1. Open <http://localhost:8080/website/> and wait for "Neo Universe".
2. Press `H` a few times. **Expect:** "Spin the planet, heading level 1", then
   "Everything on the globe", "Earth datasets", "In orbit".
3. Press `D` a few times. **Expect:** landmarks such as "banner",
   "Topics navigation", "main", "content info".

## 2. Skip links

1. Press `Ctrl + Home`, then `Tab`. **Expect:** "Skip to Open, link". It appears on screen.
2. Press `Enter`, then listen. **Expect:** focus lands on the Open or Explore button.

## 3. Choosing on the globe

1. Press `Tab` until you hear "Globe, facing …, grouping".
2. Press `NVDA + Space` to be sure you are in focus mode.
3. Press `Right arrow`. **Expect:** something like "Listening quiz. Topic in
   orbit, Three quick questions. Press Enter to open."
4. Press `Right arrow` again. **Expect:** an Earth dataset, for example "GEDI
   Forest Height. Earth dataset, over the Amazon rainforest. Press Enter to explore."
5. Press `Enter`. **Expect:** "Opened GEDI Forest Height" and the panel title is read.

## 4. The panel

1. Press `H` (browse mode). **Expect:** "What you're seeing", "The science",
   "How it will sound", "What to listen for", "Data facts".
2. `Tab` to Play video. **Expect:** "Play video, GEDI Forest Height, button".
   Press `Space`. **Expect:** "Playing video: GEDI Forest Height".
3. `Tab` to "Replace this video" and press `Enter`. **Expect:** it expands and
   the link field is announced.
4. Press `Escape`. **Expect:** "Back to the globe" and focus is back on the globe.

## 5. Topics from the menu

1. `Shift + Tab` up to the header menu and choose **Quiz**. **Expect:** "Opened
   Listening quiz".
2. `Tab` to a question. **Expect:** "Question 1 of 3: …, grouping", then radio buttons.
3. Pick an answer with the arrow keys, `Tab` to Check answer, press `Space`.
   **Expect:** "Quiz answer correct…" or "Quiz answer incorrect. The answer is…",
   then the score.
4. Press `Escape`. **Expect:** focus goes back to the Quiz menu button.

## 6. Without the 3D

1. Press `H` until "Everything on the globe".
2. `Tab` through. **Expect:** "Explore Night Lights, 2012 to 2023, button" and
   so on, then "Open How pictures become sound, button" and the other topics.

## 7. Accessibility pop-up

1. Press `Alt + A`. **Expect:** "Accessibility settings opened" and the heading "Accessibility".
2. `Tab` to **Test announcement** and press `Space`. **Expect:** "Test announcement.
   If you can hear this, your screen reader works with this page."
3. `Tab` to a setting, for example **Larger text**. **Expect:** "Larger text,
   switch, off". Press `Space`. **Expect:** "Larger text on" and the text grows.
4. Press `Escape`. **Expect:** the pop-up closes and focus returns where you were.
5. In focus mode, press `W`. **Expect:** "Facing …" with what the globe faces.

## 8. Motion and low vision (no NVDA needed)

- Press **Pause spinning**. The globe stops. **Expect:** "Spinning paused".
- Zoom to 200% (`Ctrl + +`). Nothing should overlap or need sideways scrolling.
- Windows high contrast (`Left Alt + Left Shift + Print Screen`): buttons and
  focus outlines should stay visible.

## What to say to the judges

"The whole globe can be used without seeing it: every choice is read out, the
arrow keys turn it, Enter opens it, Escape brings you back, and everything on
it is also in a plain list. We tested it with NVDA."
