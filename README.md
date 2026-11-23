# Tokyo Neon Garage

me de ideias de portioflio bonito e interativo,eu tava pensando em algo haver com carros sabe aqueles carros super velozes e bonitos tipo do velozes e furiosos e uma vibe bem tokyo tipo cidade,e uma vibe bem detalhada nos detalhes e nos minimos detalhes,eu quero que no site me apresente meu nome kauan ribeiro rojas telefone 11930260877 designer,faça o site nessa pegada de encontro de carros e carros porem faça um site que tenha como ficar normal e 3d tambem dependendo de como oo cliente meche e tambem deixe bem interativo com um mini jogo dentro do portifolio tipo do bruno simon porem um jogo de carros tipo drift ou corrida se apegue bastante nos detalhes e use as prints anexadas de exemplo, fumaça saindo do escapamento, som de carro potente, risco de derrapagem ficando no chao, coloque mais carros velozes tipo os anexados, coloque os carros mais fodas tipo escapamento, aerofolio, carros rebaixados ate moto aquelas moto foda com ronco estrondante quero que tenha como andar nela tambem e cortar de giro e sair som no site, coloque trabalhos fakes para mim colocar como curriculo por exemplo sites fakes de hamburgueria, hospedagem, e tambem deixe mais interativo, por exemplo deixe cada topico: meu telefone e minhas informaçoes em um lugar diferente da garagem, e quando eu passo o mouse apareça uma aura envolta roxa e quando eu clico apareça as informaçoes e deixe interativo ao ponto de quando eu passar o mouse no site tenha como eu dar um 360 perfeito na garagem e tudo esteja organizado e funcionando, recorte minha foto dessa carteirinha e coloque na moudura que tem na parede porem com capacete ai quando eu clico em cima o capacete sai e cai no chao se reduzindo de tamanho ate o chao ai quando ele cai no chao ele desaparece.

# Locked
- Visual direction: "Underground Car Meet / Tokyo Night Garage" inspired by early 2000s Fast & Furious tuner culture. Dark wet asphalt with puddles, reflections, neon blue, cyan, magenta and deep purple underglow.
- Professional presentation identity: Name: "Kauan Ribeiro Rojas // Lead Designer", Phone/WhatsApp: "(11) 93026-0877", Education: "Técnico em Informática para Internet (ETEC)", Focus: UI/UX, Product Design, 3D and Web Design.
- Navigation modes: Persistent header switch between "3D DRIVE MEET / 360° GARAGE" and "2D SPEC SHEET / GRID VIEW" for quick recruiter navigation.
- 360° Garage Camera: Orbit controls with smooth damping (dampingFactor: 0.05), horizontal 360° rotation, clamped vertical elevation (15° to 75°), and gentle idle rotation.
- Vehicle Fleet (Interactive 3D models with Three.js / procedural high-detail geometries):
  * Nissan Skyline GT-R R34 (Silver with blue vinyl stripes, front intercooler, blue neon underglow, big rear wing, exhaust pipe).
  * Toyota Supra MK4 (Iconic orange with graphics, massive spoiler, green underglow).
  * Mitsubishi Eclipse GSX (Lime green tuner with blue vinyls).
  * White Superbike / CBR (Sportbike with intense purple/magenta neon underglow as in attachment f6ee7753).
- Vehicle controls & physics:
  * WASD / Arrow keys for driving, acceleration, steering, braking.
  * Drift physics: holding SPACE initiates handbrake drift, leaving dark SVG/canvas tire skid marks on the floor and emitting volumetric tire smoke.
  * Rev limiter / Corte de giro: Key [R] or on-screen button triggers rev limiter bang at 14,000 RPM, spitting realistic exhaust backfire flame particles and engine audio.
- Audio System (Web Audio API synthesis & sound effects):
  * Accelerating engine pitch/revs, turbo spool and blow-off valve hiss upon throttle release, tire screech on drift, metallic 2-step backfire pops, switchable background phonk/synthwave track.
- Garage Environmental Props & Purple Aura Hotspots:
  * Left brick wall: 7-drawer black tool chest (c9ff84e9). On hover, pulses purple aura; on click, drawers slide open with mechanical sound, revealing design portfolio cases:
    1. Case 01: 'Smash & Drift Burger' (Artisanal burger delivery app & visual identity).
    2. Case 02: 'Kyoto Retreat & Resort' (Boutique hotel luxury booking platform).
    3. Case 03: 'Apex Telemetry' (Automotive dashboard & performance tracker).
  * Right workbench: Vintage landline telephone with coiled wire. On hover, pulses purple aura; on click, rings and opens direct WhatsApp hotline (11) 93026-0877 with pre-filled message.
  * Back wall: Framed portrait Easter Egg. Initially shows Kauan wearing a racing helmet with a tinted visor. On click, the helmet pops off with an unbuckle sound, drops to the floor with gravity and bounce physics, scales down, hits the concrete with a thud and dissolves in purple smoke, revealing Kauan's real photo (attached file kauan_photo.png) and opening his full bio modal (ETEC credentials, skills, tools, resume download).
  * Floor & surroundings: Iridescent motor oil puddles with magenta/blue sheen, dropped wrenches and sockets, stacked tire racks, fuel drums, and realistic warehouse lighting.

# Open
- 2D Fallback / Recruiter View: Full editorial grid view listing Kauan's resume, case studies, interactive Figma embeds, design process, and contact form, seamlessly switchable at any time.
- Touch controls: Responsive virtual joystick and drift pedals for mobile visitors.
- Audio consent: Non-intrusive sound toggle ('AUDIO: ON / MUTE') respecting browser autoplay policies.
- Performance optimization: Efficient Three.js render loop with adaptive pixel ratio and low-polygon LOD for high frame rates.

Build a real working app, not a clickable prototype; the screen and kit files show layout, content and look (a wireframe's, structure only) and are never code to copy. The screens are the moments the user designed, not the whole product. Before building, walk through each flow as its user would and design what the pictures leave out, as a product designer would for this product: the steps a flow needs to finish and how the app responds to what the user does, including the moments its users will actually run into, like waiting on something or finding nothing yet. Add nothing a user of this product would never meet, and keep an app the user wants simple, simple. Never leave a step the product's core flows need as "coming soon", unless the brief says the user chose to. Where such a step needs an outside service, build every part up to it and say in your reply what's left to connect. Fill product gaps only, never a look the design set: an added step reuses the UI kit's tokens, chrome and parts and the nearest designed screen's layout, with no new visual direction. Look at every screen's picture before writing code; design.md says which picture or sheet holds each screen. Open the UI kit's shells and parts HTML for the header, tab bar, composer and components, not only its tokens. Use each finished screen's copy exactly as design.md lists it; never invent copy for one. A wireframe under design.md's Wireframes gives structure only: build it in the design's look, as design.md says. The screens' photos are placeholders for the mockups only: replace every photo design.md lists with the user's own upload for it, else as design.md says (a photo without people re-composed with imagegen--edit_image from it as a reference, a photo of people generated from its brief and never from the photo), and ship no set photo or its URL. For a design that came with no design.md, every photo on assets.lovable.dev or images.unsplash.com is a set photo: replace it with the user's own upload for it, else a new image generated for its slot, any person in it one who doesn't exist, never from the photo or a picture showing it. Build and check each screen at the canvas it was drawn at: phone 393×764, tablet landscape 1133×744, tablet portrait 744×1133, desktop 1280×832. After building, screenshot the app at those sizes and states, compare each finished screen with its picture, and fix every visual difference you didn't choose; check a wireframe's screen against its structure, never its grey look. End your reply with "Changed from the mockups": each deliberate change and why, and "Added beyond the mockups": each step, state or interaction you built that no screen shows.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tokyo-neon-garage.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8c46b393-ddba-4875-80b5-d0d676ef56ba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
