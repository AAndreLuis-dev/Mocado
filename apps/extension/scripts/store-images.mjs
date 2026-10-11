import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ext = resolve(import.meta.dirname, '..');
const out = resolve(process.argv[2] ?? resolve(ext, '../../docs/images'));
mkdirSync(out, { recursive: true });
const { chromium } = createRequire(resolve(ext, 'package.json'))('@playwright/test');
const url = (p) => pathToFileURL(resolve(ext, p)).href;
const demo = (f) => url(`.output/demo/${f}`);
const fonts = 'node_modules/@fontsource-variable';
const icon = url('assets/icon.svg');

const css = `
@font-face { font-family: Next; src: url(${url(`${fonts}/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2`)}); font-weight: 200 800; }
@font-face { font-family: Mono; src: url(${url(`${fonts}/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-wght-normal.woff2`)}); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; }
body { font-family: Next, sans-serif; background: #f3f5f7; color: #1c2330; overflow: hidden; position: relative; }
.brand { display: flex; align-items: center; gap: 14px; font-weight: 800; }
.brand img { display: block; }
h1 { font-weight: 800; letter-spacing: -0.02em; line-height: 1.08; }
h1 em { font-style: normal; color: #2448c8; }
p { color: #5b6573; line-height: 1.45; }
.shot { position: absolute; overflow: hidden; background: #fff; border: 1px solid #d5dae1; border-radius: 16px; box-shadow: 0 24px 60px -20px rgba(28,35,48,.35); }
.shot img { position: absolute; transform-origin: 0 0; }
kbd { font-family: Mono; font-size: .8em; padding: 2px 8px; border: 1px solid #d5dae1; border-bottom-width: 3px; border-radius: 8px; background: #fff; color: #1c2330; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 26px; }
.chips span { font-family: Mono; font-size: 15px; font-weight: 700; color: #2448c8; background: #e8edfb; padding: 6px 10px; border-radius: 8px; }
.dot { position: absolute; border-radius: 50%; }
`;

const shot = ({ src, x, y, w, h, cx = 0, cy = 0, scale = 1 }) =>
  `<div class="shot" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><img src="${src}" style="left:${-cx * scale}px;top:${-cy * scale}px;transform:scale(${scale})"></div>`;

const slide = (title, sub, visuals, extra = '') => `
<div style="position:absolute;left:72px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center">
  <div class="brand" style="font-size:26px;margin-bottom:40px"><img src="${icon}" width="44" height="44">Mocado</div>
  <h1 style="font-size:50px">${title}</h1>
  <p style="font-size:21px;margin-top:22px">${sub}</p>
  ${extra}
</div>
<div class="dot" style="width:620px;height:620px;right:-160px;top:90px;background:#e8edfb"></div>
${visuals}`;

const chips = (items) =>
  `<div class="chips">${items.map((i) => `<span>${i}</span>`).join('')}</div>`;

const images = {
  'screenshot-1-fill.png': [
    1280,
    800,
    slide(
      'Preencha o formulário inteiro com <em>um atalho</em>',
      'Aperte <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>F</kbd>: o Mocado detecta os campos e preenche CPF, CNPJ, endereço, telefone e mais.',
      shot({
        src: demo('01__Ctrl+Shift+F → empresa coerente (CNPJ, IE da UF, endereço).png'),
        x: 590,
        y: 80,
        w: 520,
        h: 639,
        cx: 270,
        cy: 90,
        scale: 0.9,
      }) + shot({ src: demo('ui/popup-light.png'), x: 920, y: 170, w: 320, h: 516, scale: 0.86 }),
    ),
  ],
  'screenshot-2-coherent.png': [
    1280,
    800,
    slide(
      'Pessoas e empresas <em>coerentes</em>',
      'A mesma UF no CPF, no título, no DDD e no endereço real. Empresa com CNPJ, inscrição estadual da UF e data de abertura.',
      shot({
        src: demo('01__Ctrl+Shift+F → empresa coerente (CNPJ, IE da UF, endereço).png'),
        x: 600,
        y: 102,
        w: 620,
        h: 596,
        cx: 270,
        cy: 90,
        scale: 0.84,
      }),
      chips(['CPF', 'CNPJ', 'IE · 27 UFs', 'CEP real', 'DDD da UF']),
    ),
  ],
  'screenshot-3-history.png': [
    1280,
    800,
    slide(
      'Cole um CPF e descubra <em>onde ele foi usado</em>',
      'Todo preenchimento vai para um histórico local e pesquisável. Rotule, favorite, reuse o perfil e exporte em JSON.',
      shot({
        src: demo('06__Cole um CPF e descubra onde foi usado.png'),
        x: 580,
        y: 108,
        w: 660,
        h: 585,
        cx: 205,
        cy: 20,
        scale: 0.75,
      }),
    ),
  ],
  'screenshot-4-generator.png': [
    1280,
    800,
    slide(
      'Gere um valor avulso e <em>copie</em>',
      'Popup com geradores de documentos, pessoa, empresa, cartão, conta bancária e veículo. Tema claro e escuro.',
      shot({
        src: demo('ui/popup-pessoa-light.png'),
        x: 600,
        y: 140,
        w: 300,
        h: 474,
        scale: 0.79,
      }) + shot({ src: demo('ui/popup-dark.png'), x: 930, y: 186, w: 300, h: 474, scale: 0.79 }),
      chips(['CNH', 'RENAVAM', 'PIS', 'Título', 'Cartão', 'Placa Mercosul']),
    ),
  ],
  'screenshot-5-local.png': [
    1280,
    800,
    slide(
      'Respeita máscaras. <em>Tudo local.</em>',
      'Funciona com frameworks modernos e bibliotecas de máscara. Sem rede, sem telemetria, sem conta: só acessa a página quando você pede.',
      shot({
        src: demo('03__Respeita máscaras e campos só com números.png'),
        x: 600,
        y: 90,
        w: 620,
        h: 330,
        cx: 270,
        cy: 30,
        scale: 0.84,
      }) +
        shot({
          src: demo('ui/options-light.png'),
          x: 600,
          y: 450,
          w: 620,
          h: 270,
          cx: 210,
          cy: 360,
          scale: 0.72,
        }),
    ),
  ],
  'promo-small-440x280.png': [
    440,
    280,
    `
    <div class="dot" style="width:300px;height:300px;right:-90px;top:-70px;background:#e8edfb"></div>
    <div class="dot" style="width:120px;height:120px;right:40px;bottom:-50px;background:#f4e9f7"></div>
    <div style="position:absolute;left:36px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
      <div class="brand" style="font-size:40px"><img src="${icon}" width="64" height="64">Mocado</div>
      <h1 style="font-size:24px;margin-top:22px;max-width:330px">Dados de teste <em>brasileiros</em> em um atalho</h1>
    </div>`,
  ],
  'promo-marquee-1400x560.png': [
    1400,
    560,
    `
    <div class="dot" style="width:640px;height:640px;right:-60px;top:-40px;background:#e8edfb"></div>
    <div class="dot" style="width:200px;height:200px;left:520px;bottom:-110px;background:#f4e9f7"></div>
    <div style="position:absolute;left:90px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center">
      <div class="brand" style="font-size:52px"><img src="${icon}" width="80" height="80">Mocado</div>
      <h1 style="font-size:44px;margin-top:30px">Dados de teste <em>brasileiros</em>, preenchidos em um atalho</h1>
      <p style="font-size:20px;margin-top:18px">CPF, CNPJ, endereço e mais. Tudo local.</p>
    </div>
    ${shot({ src: demo('01__Ctrl+Shift+F → empresa coerente (CNPJ, IE da UF, endereço).png'), x: 760, y: 60, w: 400, h: 560, cx: 270, cy: 90, scale: 0.8 })}
    ${shot({ src: demo('ui/popup-pessoa-light.png'), x: 1040, y: 100, w: 300, h: 520, scale: 0.79 })}`,
  ],
  'store-icon-128.png': [
    128,
    128,
    `<img src="${icon}" width="96" height="96" style="position:absolute;left:16px;top:16px">`,
    true,
  ],
};

const browser = await chromium.launch();
for (const [name, [width, height, body, transparent]] of Object.entries(images)) {
  const page = await browser.newPage({ viewport: { width, height } });
  const tmp = resolve(out, '_tmp.html');
  writeFileSync(
    tmp,
    `<!doctype html><meta charset="utf-8"><style>${css}${transparent ? 'body{background:transparent}' : ''}</style><body style="width:${width}px;height:${height}px">${body}</body>`,
  );
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  rmSync(tmp);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: resolve(out, name),
    omitBackground: !!transparent,
  });
  await page.close();
}
await browser.close();
