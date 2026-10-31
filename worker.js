// Render gists as SVG for embeds
// GET /GIST_ID[/FILENAME]?grid=1&theme={auto,dark,light}
const API = 'https://api.github.com/gists/';
const FS = 14, LINE = 20, PAD = 16, CELL = FS * 0.6; // monospace cell = 0.6em

// GH dark/light palettes
const THEMES = {
  dark: { bg: '#0d1117', fg: '#e6edf3', errBg: '#2d1215', errFg: '#f85149' },
  light: { bg: '#ffffff', fg: '#1f2328', errBg: '#ffebe9', errFg: '#cf222e' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// auto = dark base (fallback for renderers without media-query support),
// light under @media (prefers-color-scheme:light)
const rule = (p) => `.bg{fill:${p.bg}}.fg{fill:${p.fg}}.eb{fill:${p.errBg}}.ef{fill:${p.errFg}}`;
const style = (theme) =>
  theme === 'auto'
    ? `<style>${rule(THEMES.dark)}@media (prefers-color-scheme:light){${rule(THEMES.light)}}</style>`
    : `<style>${rule(THEMES[theme] ?? THEMES.dark)}</style>`;

function svg(content, grid, theme) {
  const lines = content.replace(/\s+$/, '').split('\n');
  const maxLen = Math.max(...lines.map((l) => [...l].length));
  const w = Math.min(960, Math.max(320, maxLen * FS * 0.6 + PAD * 2));
  const h = PAD * 2 + lines.length * LINE;
  // grid: one <text> per char, forcing wide glyph overlap
  const rows = lines
    .map((l, i) => {
      const y = PAD + i * LINE + LINE - 5;
      return grid
        ? [...l].map((ch, j) => (ch === ' ' ? '' : `<text x="${PAD + j * CELL}" y="${y}">${esc(ch)}</text>`)).join('')
        : `<text x="${PAD}" y="${y}">${esc(l)}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="${w}" height="${h}"
viewBox="0 0 ${w} ${h}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${FS}">
${style(theme)}
<rect class="bg" width="100%" height="100%"/>
<g class="fg">
${rows}
</g>
</svg>`;
}

async function err(status, msg, theme) {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="40">${style(theme)}
<rect class="eb" width="100%" height="100%"/>
<text class="ef" x="12" y="25" font-family="monospace" font-size="14">${esc(msg)}</text></svg>`,
    { status, headers: { 'content-type': 'image/svg+xml' } },
  );
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const [id, file] = url.pathname.split('/').filter(Boolean);
    const grid = url.searchParams.get('grid') === '1'; // ?grid=1 pins each char to the grid; default is one <text> per line
    const theme = url.searchParams.get('theme') ?? 'auto'; // ?theme={auto,dark,light}
    if (!id) return err(400, 'syntax: /GIST_ID[/FILENAME]?grid=1&theme={auto,dark,light}', theme);
    const res = await fetch(API + id);
    if (!res.ok) return err(res.status, `gist API error: ${res.status}`, theme);
    const gist = await res.json();
    const key = file && gist.files[file] ? file : Object.keys(gist.files)[0];
    if (!key) return err(404, 'gist has no files', theme);
    const f = gist.files[key];
    // binary/large -> null content; raw_url always works
    const content = f.content ?? (await (await fetch(f.raw_url)).text());
    return new Response(svg(content, grid, theme), {
      headers: {
        'content-type': 'image/svg+xml',
        // always fresh; use 'max-age=300' instead if the anonymous 60 req/h GitHub API limit is hit
        'cache-control': 'no-store',
      },
    });
  },
};
