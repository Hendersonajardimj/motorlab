# MotorLab

An interactive robotics lesson about motor feedback. Inspect a schematic motor, wheel and encoder, predict the effect of load, then compare a fixed drive command with a proportional–integral controller.

[Try the lesson](https://hendersonajardimj.github.io/motorlab/) · [Project story](https://hendeaux.dev/projects/motorlab)

## Try it

1. Read the short lesson. Two identical motors turn side by side in a no-load preview: one driven by a fixed command, one by feedback.
2. Choose predictions in step 02 and record them to unlock the comparison.
3. Press **Run load test** under the motors. The same load arrives at 4 seconds and ends at 9. Pause, reset, or drag the timeline (arrow keys work too) to revisit any moment.
4. Compare the measured speeds and drive, then try the unreachable-target preset.
5. Explain the causal chain and check four selected statements with a transparent local rubric.

## Engineering decisions

- A deterministic first-order motor model separates simulation from rendering. The PI controller uses feedforward and conditional integration to prevent windup at the drive ceiling.
- The mechanism is drawn from the same model samples as the graph. Each wheel turns by its own simulated angle (shown at 0.2×), a brake shoe closes while the load is applied, each motor's band glows with its drive command, and the encoder pickup flashes as marks pass. Only the feedback motor has a cable from its encoder back to its controller. A caption, the readouts and the control-loop line state the numbers for the moment on screen.
- Three.js supplies the inspectable 3D scene. Keyboard camera controls, a still view and a face-on 2D fallback keep the lesson usable without motion or WebGL. Add `?fallback=1` to force the fallback.
- Motion follows the system reduced-motion setting unless the learner chooses otherwise with **Still view**. In still view the parts stay put while the experiment, readouts, graph and timeline keep working. Progress saved by earlier versions is kept; a record that predates this setting is copied once, untouched, to `motorlab-public-progress-v1-before-motion-setting`.
- Predictions are recorded before a run. Changing its parameters invalidates the prior prediction and results so the evidence corresponds to the current settings.
- Progress stays in browser localStorage; export it as JSON or keep a local backup when starting a fresh lesson. There is no account, backend, analytics or AI-provider connection.
- The coach checks selected causal statements. It saves written notes without claiming to evaluate their meaning.

## Model and limits

The model is illustrative, not measured hardware: `dω/dt = (200u − ω − d) / 0.65`, integrated with a 0.01-second Euler step. Load is an equivalent speed loss, not torque; normalized drive is not voltage or current. The loaded steady-state capacity is `max(0, 200 × drive ceiling − load)` rpm.

At the default 100 rpm target and 45 rpm-equivalent load, the fixed command approaches 55 rpm while feedback recovers near 100 rpm. At an 80% ceiling and 70 rpm-equivalent load, capacity is 90 rpm: feedback cannot achieve a 160 rpm target. Electrical dynamics, sensor noise, delay, thermal limits and real motor identification are omitted. The geometry is schematic; the wheels are shown at 0.2× angular speed for legibility. The brake shoe pictures the load; it is not a torque model. The encoder disc's 16 marks illustrate counting; the model's speed measurement stays ideal. No hardware is connected.

## Run locally

Requires Node.js 22 or later and npm. No credentials are needed.

```sh
npm ci
npm test
npm run build
npm start
```

Open `http://127.0.0.1:4319`. `MOTOR_LAB_PORT` changes the server port. `dist/` is a standalone static site that also works under a subdirectory such as GitHub Pages; `MOTOR_LAB_BASE=/motorlab npm start` serves it the way Pages does, at `http://127.0.0.1:4319/motorlab/`, including the redirect without a trailing slash and the 404 page. The build versions the app's own modules by content so a page never mixes cached files from two releases.

## Verification

`npm test` runs fourteen Node tests. The four original tests cover loaded equilibrium and disturbance timing, saturation and anti-windup recovery, deterministic no-load convergence, and causal rubric checks. The others check that mechanism frames, phases and captions come straight from the model samples, that the motion preference and its migration behave, and that the build is subpath-safe. CI runs the same tests and builds the static site for every pull request; merges to main deploy it to GitHub Pages.

`scripts/browser-check.mjs` drives Chromium through the built site under a subpath: preview motion, play, pause, reset, keyboard scrubbing against model angles, reduced motion, a restored still-view record, the 2D fallback, three widths and direct Pages URLs. It needs `playwright-core` and a Chromium, so it is not part of CI.

## Origin and licensing

Joshua Henderson-Jardim built this lesson with AI assistance as part of his robotics learning. This public release is curated from the October 5, 2026 Motor Lab source at `a3a7a9bade8f1bd13e496ce3c9b54092a48e6d2a`. The simulation and four original model tests are retained. Private operational records, a separate video prototype and original device-voice recordings are excluded; this release provides a text lesson.

The authored code, lesson and schematic geometry are MIT licensed. Three.js 0.185.1 is separately MIT licensed; its notice is retained in `THIRD-PARTY-NOTICES/three-LICENSE.txt` and included in the build. Source anchors in the lesson link to learning references; their content and third-party models are not bundled. The side-by-side motors and phase timeline were informed by Techartist's later Two Hearts lesson (consulted October 23, 2026); no assets are reused. Tailwind Plus was consulted for interface patterns; its component source is not included.
