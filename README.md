# jigglesaw

Live at https://vixipop.github.io/repertoire/jigglesaw/

As a kid I always received jigsaw puzzles as birthday gifts. I was very fast at solving them, but growing up I quietly forgot this calming hobby of just putting puzzle pieces together. There’s something satisfying about the tactile push of a puzzle piece.
Assembling the full picture feels like a reward won, after the patient act of finding the correct piece, in the correct rotation, by either recognizing the print or brute-forcing a couple of wrong pieces.
That is the feeling I set out to capture for this assignment. That is the experience I wanted to deliver, because the greatest compliment is when someone sees your work and spends a few minutes enjoying it.

## My submission
- A jigsaw puzzle with foamy block pieces, one that feels satisfying to assemble with each click. Nothing too difficult; it takes about 5 minutes to solve.
- The ability to upload any image you want and solve it as a jigsaw puzzle. (This isn’t really locked behind a paywall; it’s just an idea I wanted to explore.)
- Three custom artworks made with shaders, refined with Claude Code for movement and physics.
- Calming music and dark mode for some “quality of life” touches.

## Tech stack
- three.js for the 3D scene: the pieces, table, lighting and camera
- WebGL and GLSL shaders for the foam texture, the painted artworks and the soft finishing pass
- Vanilla JavaScript (ES modules), no framework, to keep it light
- Canvas 2D for the printed artwork, table gradient and dotted frame
- Web Audio API for the synthesised clicks, typewriter sounds and generative piano
- HTML video (WebM with MP4 fallback) for the animated artworks
- Vite as the build tool, and GitHub Pages for hosting

## What I would explore if I had more time
- Integrating a real payments gateway, Dodo Payments, to properly sell the upload feature. Right now the lock is only a front-end showpiece. The plan would be a small server function that holds the API key, creates a checkout session, and only unlocks an upload once the server confirms the payment through a webhook.
- Touch-first play on phones and tablets, with a bigger pickup area and haptic feedback.
- Letting people share a finished puzzle as a link, so a friend can try the same picture.

## Performance

- Every piece is generated from its outline at load (no model files); all
  pieces share two materials and one print texture.
- Draws only while something moves; idle costs nothing.
- Shadows are pre-blurred silhouettes, not shadow maps.
- The foam shader runs only on the side walls; fine pores fade out when they'd shimmer.
- Video presets decode in the browser's media pipeline; the print is only
  re-uploaded when the video shows a new frame.


Thank you I truly enjoyed this assignment.

Plain three.js + Vite, no framework.

```bash
npm install
npm run dev          # local
./deploy-pages.sh    # build and publish to GitHub Pages
```

"# foam-puzzle" 
