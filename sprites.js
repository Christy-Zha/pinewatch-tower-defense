/* Original sprite art for 松境守卫. All geometry is rasterized to whole pixels. */
(() => {
  "use strict";

  const cache = new Map();
  const ink = "#172b2c";
  const wood = ["#49362b", "#775036", "#a97040", "#d59b54", "#f2c578"];
  const stone = ["#35424b", "#53626a", "#77858a", "#a1afa9", "#d0d6bc"];
  const ice = ["#15475c", "#206e8b", "#279bb6", "#58d4dd", "#9bf1e7", "#e7fff4"];

  function brush(ctx) {
    function rect(c, x, y, w = 1, h = 1) {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    }
    // Scanline fill keeps the sloped roofs, blades and masonry on the pixel grid.
    function poly(c, ...coords) {
      let low = Infinity, high = -Infinity;
      for (let i = 1; i < coords.length; i += 2) {
        low = Math.min(low, coords[i]);
        high = Math.max(high, coords[i]);
      }
      for (let y = low; y < high; y++) {
        const intersections = [];
        for (let i = 0, j = coords.length - 2; i < coords.length; j = i, i += 2) {
          const a = coords[j + 1], b = coords[i + 1], scan = y + 0.5;
          if ((a <= scan && scan < b) || (b <= scan && scan < a)) {
            intersections.push(coords[j] + (scan - a) * (coords[i] - coords[j]) / (b - a));
          }
        }
        intersections.sort((a, b) => a - b);
        for (let i = 0; i + 1 < intersections.length; i += 2) {
          const left = Math.ceil(intersections[i] - 0.5);
          rect(c, left, y, Math.ceil(intersections[i + 1] - 0.5) - left);
        }
      }
    }
    function line(c, ax, ay, bx, by, size = 1) {
      let x = ax, y = ay;
      const dx = Math.abs(bx - ax), dy = -Math.abs(by - ay);
      const sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
      let error = dx + dy;
      while (true) {
        rect(c, x, y, size, size);
        if (x === bx && y === by) break;
        const e = 2 * error;
        if (e >= dy) { error += dy; x += sx; }
        if (e <= dx) { error += dx; y += sy; }
      }
    }
    return { rect, poly, line };
  }

  function tile(key, w, h, painter) {
    if (!cache.has(key)) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext("2d");
      painter(g, brush(g));
      cache.set(key, canvas);
    }
    return cache.get(key);
  }

  function foot(b, colors, halfWidth = 9) {
    const { rect, poly } = b, [dark, shade, mid, light] = colors, w = halfWidth;
    poly(ink, -w - 1,-6, -4,-10, 4,-10, w + 1,-7, w + 1,-2, 4,1, -4,1, -w - 1,-2);
    poly(mid, -w,-6, -3,-9, 3,-9, w,-6, 3,-3, -3,-3);
    poly(shade, -w,-6, -3,-3, 3,-3, 3,0, -3,0, -w,-3);
    poly(dark, 3,-3, w,-6, w,-3, 3,0);
    rect(light, -w + 1,-6,3);
    rect(mid, -5,-3,3);
  }

  function arrowTower(b, level) {
    const { rect, poly, line } = b;
    foot(b, wood);
    // Raised watch platform, mortised timber braces and three visible oak posts.
    poly(ink, -7,-17, 7,-17, 7,-5, 3,-2, -4,-2, -7,-4);
    rect(wood[0], -5,-14,10,10);
    rect("#38483b", -3,-13,5,8);
    line(wood[1], -5,-13, 2,-5, 2);
    line(wood[3], -4,-13, 2,-6);
    line(wood[2], -5,-6, 1,-12, 2);
    rect(wood[2], -7,-16,3,12);
    rect(wood[4], -6,-15,1,10);
    rect(wood[1], 2,-15,3,13);
    rect(wood[3], 2,-13,1,10);
    rect(wood[0], 6,-17,2,12);
    rect(wood[2], 6,-15,1,9);
    poly(ink, -10,-19, -2,-22, 10,-19, 10,-14, 3,-11, -4,-12, -10,-14);
    poly(wood[2], -9,-18, 1,-20, 9,-18, 3,-15, -4,-15);
    poly(wood[1], -9,-17, -3,-15, 3,-15, 3,-12, -3,-13, -9,-15);
    poly(wood[0], 3,-15, 9,-18, 9,-15, 3,-12);
    rect(wood[4], -8,-16,3);
    rect(wood[3], -4,-15,4);
    rect(ink, -7,-20,2,4);
    rect(wood[2], -6,-20,1,4);
    rect(ink, 4,-21,2,5);
    rect(wood[3], 4,-20,1,3);
    // A steep shingled green roof. The right roof plane falls into cool shade.
    poly(ink, -11,-21, -4,-29, 0,-30, 4,-30, 11,-23, 11,-21, 4,-18, -3,-18, -11,-20);
    poly("#387663", -10,-21, -3,-28, 2,-29, -1,-22, -3,-19);
    poly("#256052", -2,-19, 2,-29, 4,-29, 10,-22, 4,-19);
    poly("#55a281", -8,-22, -3,-28, 1,-28, -2,-24);
    line("#a6ce95", -3,-28, 2,-29);
    line("#7cb191", -7,-23, -5,-25);
    rect("#6da98a", -5,-22,3);
    rect("#4c8b71", 1,-23,4);
    rect("#508d72", 4,-22,3);
    rect("#20483e", -6,-20,4);
    line("#a17642", 4,-19, 9,-21);
    // An external mounted crossbow projects off the front of the platform.
    line("#342e2a", -10,-18, -4,-13);
    line("#e3c892", -9,-18, -4,-14);
    line(wood[0], -12,-15, -3,-17, 2);
    line(wood[3], -12,-15, -3,-17);
    rect(stone[4], -13,-15,2);
    rect(wood[1], -4,-18,3,3);
    rect(wood[4], -4,-18,2);
    if (level > 1) {
      rect("#263f40", -2,-14,4,5);
      rect("#dda44d", -2,-14,3,4);
      rect("#f1cc7b", -1,-14,1,3);
    }
    if (level > 2) {
      rect(wood[3], 3,-33,1,5);
      poly("#e8ad4d", 4,-33, 10,-32, 7,-30, 4,-31);
    }
  }

  function cannonTower(b, level) {
    const { rect, poly, line } = b;
    foot(b, stone, 11);
    // Granite drum below the copper-clad gun carriage.
    poly(ink, -9,-14, -3,-17, 3,-17, 10,-14, 10,-7, 3,-3, -3,-3, -9,-6);
    poly(stone[2], -8,-14, -2,-16, 3,-16, 9,-14, 3,-11, -3,-11);
    poly(stone[1], -8,-13, -3,-11, 3,-11, 3,-4, -3,-4, -8,-7);
    poly(stone[0], 3,-11, 9,-14, 9,-8, 3,-4);
    rect(stone[3], -7,-11,3,2);
    rect(stone[2], -3,-10,4,2);
    rect(stone[2], -5,-7,3,2);
    rect(stone[1], 5,-10,3,2);
    rect(stone[3], -7,-6,3);
    rect("#433c38", 7,-26,2,15);
    rect(wood[3], 7,-26,1,11);
    poly("#ab5d38", 8,-25, 14,-24, 12,-22, 14,-21, 8,-21);
    poly("#efb84f", 8,-25, 13,-24, 10,-23, 8,-23);
    rect("#f8d87b", 7,-27,2,2);
    poly(ink, -7,-17, -2,-20, 5,-19, 8,-15, 7,-11, 3,-9, -3,-10, -7,-12);
    poly("#764d36", -6,-16, 0,-19, 5,-18, 7,-15, 6,-12, 3,-10, -2,-11, -6,-13);
    poly("#b17c46", -5,-16, 0,-18, 4,-17, 5,-14, 1,-12, -3,-13);
    rect("#d9a15b", -2,-14,5);
    // Iron muzzle points uphill and left, with a stepped oval open bore.
    poly(ink, -12,-23, -10,-25, -7,-25, -5,-23, 4,-20, 7,-17, 7,-14, 4,-12, 1,-13, -9,-17, -12,-19);
    poly("#485764", -11,-22, -8,-24, -5,-22, 4,-19, 6,-17, 5,-14, 2,-14, -8,-18, -11,-19);
    poly("#74828b", -9,-23, -7,-23, 3,-19, 5,-17, 3,-16, -7,-20);
    line("#a4b2aa", -7,-23, 0,-20);
    poly("#27353e", -8,-19, 1,-16, 5,-14, 2,-14, -8,-17);
    poly("#b58453", -4,-22, -2,-22, -4,-17, -6,-18);
    rect("#efba72", -4,-22,2);
    poly("#303b45", -13,-23, -11,-25, -8,-25, -6,-23, -6,-20, -8,-18, -11,-18, -13,-20);
    rect("#b0bab0", -11,-24,3);
    rect("#798991", -12,-23,2,3);
    rect("#20282e", -10,-23,3,4);
    rect("#0f1e23", -11,-22,3,3);
    rect("#637784", -10,-19,2);
    rect("#48382e", 0,-15,5,5);
    rect("#c0864b", 1,-15,3,4);
    rect("#f4bd72", 1,-15,2);
    rect("#735031", 2,-13);
    if (level > 1) {
      line("#d49e5a", 2,-20, 0,-16,2);
      rect("#f7c678", 2,-20,2);
    }
    if (level > 2) {
      rect("#d7aa64", -6,-10,2,4);
      rect("#eee1a1", -6,-10,2);
      rect("#d7aa64", 0,-9,2,4);
    }
  }

  function frostTower(b, level) {
    const { rect, poly, line } = b;
    foot(b, ["#303e53", "#48596b", "#778597", "#acc3c7"]);
    poly(ink, -8,-12, -2,-15, 3,-15, 8,-12, 7,-6, 2,-3, -3,-3, -8,-6);
    poly("#486279", -7,-12, -2,-14, 2,-14, 7,-12, 2,-9, -3,-9);
    poly("#31465c", -7,-11, -3,-9, 2,-9, 2,-4, -3,-4, -7,-6);
    poly("#213446", 2,-9, 7,-12, 6,-6, 2,-4);
    rect("#adc4be", -7,-10,3);
    rect("#679dba", -4,-7,2,2);
    rect("#b2efe7", -4,-8,2,1);
    rect("#537894", 3,-8,2,2);
    // Three prongs frame the translucent faceted crystal.
    poly("#22374b", -10,-19, -7,-18, -6,-14, -3,-11, -6,-9, -9,-13);
    poly("#7597a7", -9,-18, -7,-16, -7,-13, -5,-11, -7,-12);
    rect("#d1dfd1", -9,-18,2,2);
    poly("#203b51", -6,-23, 0,-32, 2,-32, 7,-24, 5,-17, 0,-11, -4,-16);
    poly(ice[1], -5,-23, 1,-31, 6,-24, 4,-18, 0,-13, -3,-17);
    poly(ice[3], -5,-23, 1,-31, -1,-23, 0,-14, -3,-18);
    poly(ice[4], -5,-23, 1,-31, -2,-23, -4,-19);
    poly(ice[2], -1,-23, 1,-31, 5,-24, 2,-18, 0,-14);
    line(ice[5], -4,-24, 0,-30);
    rect(ice[5], -2,-24,2,2);
    rect(ice[4], 3,-24,2);
    poly("#20354a", 8,-21, 11,-21, 10,-15, 7,-10, 3,-9, 4,-13, 7,-16);
    poly("#697e94", 9,-20, 10,-20, 9,-15, 6,-11, 5,-11, 6,-14);
    rect("#c6dbd5", 8,-20,2,3);
    poly("#293d50", -3,-15, -1,-16, 2,-13, 3,-9, 1,-7, -2,-9);
    line("#d2ad6f", -2,-15, 0,-10,2);
    rect("#ffe0a1", -2,-15,2);
    if (level > 1) {
      poly(ice[2], -9,-16, -10,-22, -8,-24, -6,-20, -7,-16);
      rect(ice[4], -9,-22,2,3);
    }
    if (level > 2) {
      poly(ice[2], 6,-15, 6,-20, 8,-26, 10,-23, 9,-18);
      rect(ice[4], 8,-24,1,4);
    }
  }

  const towers = { arrow: arrowTower, cannon: cannonTower, frost: frostTower };
  function towerTile(type, level) {
    return tile("t" + type + level, 34, 37, (ctx, b) => {
      ctx.translate(17, 34);
      const draw = towers[type] || arrowTower;
      draw(b, level);
    });
  }

  function drawCrisp(ctx, source, ...args) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, ...args);
    ctx.restore();
  }

  function tower(ctx, type, x, y, level = 1) {
    drawCrisp(ctx, towerTile(type, Math.max(1, Math.min(3, level | 0))), Math.round(x) - 17, Math.round(y) - 34);
  }

  function icon(ctx, type) {
    const sprite = towerTile(type, 1);
    drawCrisp(ctx, sprite, 1, type === "cannon" ? 0 : 2, 32, 34, 0, 0, 40, 40);
  }

  // Heads are shared between field units and their enlarged intelligence portraits.
  const faces = {
    scout: {
      colors: { ".": null, X: ink, k: "#344c2c", g: "#659447", l: "#a4bd63", h: "#cad387", b: "#694931", e: "#f4d794", z: "#1b2627", t: "#fbe8b2" },
      rows: ["....XXXX....","...XggggX...","X..XllggkX.X","XgXgllgllXgX",".XgllgggkgX.","..XgbgezeX..","...XklgllgX.","...XgggbtX..","....XkgtX...",".....XXX...."]
    },
    runner: {
      colors: { ".": null, X: ink, s: "#724737", a: "#a46540", r: "#c9814b", h: "#efb978", t: "#efd2a2", e: "#ffd261", n: "#273031" },
      rows: [".X....XX.....",".aX..XrX.....",".satXhrX.....","..XarrraX....","..XahrrrX....",".XsarreXrX...","XsarrrsrrrXX.","XssarttthrnX.",".XsaXtttXXX..","..XXXsaX.....",".....XX......"]
    },
    brute: {
      colors: { ".": null, X: ink, d: "#394750", m: "#64757d", h: "#a0aba1", g: "#71834d", l: "#a7a46a", k: "#4b543b", e: "#f1ac5c", t: "#f8de9e", B: "#664936" },
      rows: [".....XXX......","...XXmmmXX....","..XmhmmmdmX...",".XmhmmmmdmmX..","XtmhhhmmdddXtX","XttXddhddddttX",".XtXkgggkkXtX.","..XglBekelgX..","..XgglllglgX..","..XtkggglltX..","...XttBkttX...","....XgkggX....",".....XXXX....."]
    },
    boss: {
      colors: { ".": null, X: "#322d2b", d: "#582d32", r: "#91453b", m: "#c1674a", h: "#e99360", v: "#522e36", e: "#ffdd77", t: "#f5dca2", a: "#be9759" },
      rows: ["..XX.......XX...","..XtX.....XtX...","..XttX.XXXttX...","...XatXmmXtX....","...XrhmhmmrXX...","..XrhmmhmmrrmXX.",".XrhmmmhmrrrmeX.",".XrmvrrhmvvmrX..","..XrevvhmevrrX..","..XrhhmhhmrrrX..","..XtmhmrmhmtX...","...XttvvvvttX...","...XrrmdmrmX....","....XrrrmdX.....",".....XXXXX......"]
    }
  };

  function mask(b, art, x, y) {
    art.rows.forEach((row, j) => {
      for (let i = 0; i < row.length;) {
        const c = row[i], start = i++;
        while (i < row.length && row[i] === c) i++;
        if (art.colors[c]) b.rect(art.colors[c], x + start, y + j, i - start);
      }
    });
  }

  function portrait(ctx, type) {
    const key = faces[type] ? type : "scout", face = faces[key];
    const w = Math.max(...face.rows.map(row => row.length)), h = face.rows.length;
    const head = tile("h" + key, w, h, (_, b) => mask(b, face, 0, 0));
    const size = Math.min(2, 26 / w, 26 / h);
    const ow = Math.round(w * size), oh = Math.round(h * size);
    drawCrisp(ctx, head, Math.floor((28 - ow) / 2), Math.floor((28 - oh) / 2), ow, oh);
  }

  function scout(b, step) {
    const { rect, poly, line } = b;
    const bob = step & 1;
    rect(ink, -4 - bob,-3,4,3);
    rect("#a58049", -3 - bob,-3,2,2);
    rect(ink, 2 + bob,-3,4,3);
    rect("#84653d", 2 + bob,-3,3,2);
    poly(ink, -4,-11-bob, 2,-12-bob, 5,-9, 4,-3, -2,-2, -5,-5);
    rect("#78523b", -3,-9-bob,6,5);
    rect("#b87c4c", -2,-9-bob,2,5);
    line("#c9a265", -3,-5, 2,-6);
    rect("#a7bc64", 4,-8-bob,2,3);
    line("#453b33", 5,-5-bob, 8,-10-bob, 2);
    line("#d3dac2", 6,-8-bob, 10,-13-bob);
    rect("#fff0c9", 9,-13-bob,2);
    mask(b, faces.scout, -6,-16-bob);
    rect("#546147", -6,-6-bob,3,3);
    rect("#9ca276", -6,-7-bob,2,2);
  }

  function runner(b, step) {
    const { rect, poly, line } = b, bob = step & 1, spread = step < 2 ? 2 : -1;
    poly(ink, -13,-12-bob, -8,-11-bob, -4,-8-bob, -3,-5, -6,-5, -10,-8, -13,-9);
    line("#ba7a4b", -12,-11-bob, -6,-8-bob,2);
    rect("#ead3a0", -13,-12-bob,3,2);
    poly(ink, -8,-9-bob, -4,-11-bob, 3,-12-bob, 7,-10-bob, 7,-5, 2,-4, -3,-3, -8,-4);
    poly("#ad7049", -7,-8-bob, -3,-10-bob, 3,-11-bob, 6,-9, 4,-6, 0,-5, -6,-5);
    rect("#d28b52", -5,-9-bob,6,2);
    rect("#e8ba7f", 0,-6,4,2);
    line("#563e33", -6,-5, -7-spread,-1,2);
    line("#7c513c", -3,-5, -2+spread,-1,2);
    line("#594036", 2,-6, 2-spread,-1,2);
    line("#ae754c", 4,-6, 5+spread,-2,2);
    rect(ink, 5+spread,-1,3);
    mask(b, faces.runner, 1,-16-bob);
  }

  function orc(b, step, big) {
    const { rect, poly, line } = b, bob = step & 1, s = big ? 2 : 0;
    rect(ink, -6-s-bob,-4,5+s,4);
    rect(wood[1], -5-s-bob,-3,4,2);
    rect(ink, 2+bob,-4,5+s,4);
    rect(wood[1], 2+bob,-3,4+s,2);
    poly(ink, -8-s,-13-s-bob, -3,-16-s-bob, 5,-15-s-bob, 8+s,-11-s, 7+s,-5, 2,-3, -4,-3, -8-s,-5);
    rect(big ? "#80403a" : "#536064", -7-s,-11-s-bob,13+2*s,7+s);
    poly(big ? "#b05e45" : "#84938e", -5-s,-11-s, 3,-12-s, 3,-7, -3,-6, -6-s,-8);
    line(wood[0], -6,-12-s-bob, 3,-5,2);
    line(wood[2], -5,-12-s-bob, 3,-6);
    rect(wood[0], -6-s,-5,13+2*s,2);
    rect("#e3b264", -1,-6,3,2);
    rect(big ? "#b4684d" : "#849255", 7+s,-10-s-bob,3+s,5);
    line(wood[1], 9+s,-4, 10+s,-15-s,2);
    if (big) {
      poly("#3d4141", 9,-21, 15,-23, 17,-19, 16,-14, 12,-12, 8,-15);
      rect("#747e81", 10,-20,5,3);
      rect("#bbc1ab", 14,-21,2,2);
      rect("#9aaca2", 10,-15,3);
    } else {
      poly(stone[0], 9,-17, 11,-21, 14,-20, 14,-16, 11,-13, 9,-14);
      line(stone[3], 12,-20, 13,-17);
    }
    mask(b, big ? faces.boss : faces.brute, big ? -7 : -6, (big ? -23 : -20)-bob);
    // Side-facing shoulder armor, with a single bright stud.
    poly(ink, -9-s,-13-s-bob, -5-s,-15-s-bob, -2,-13-s-bob, -1,-9-s-bob, -6-s,-8-s-bob, -9-s,-10-s-bob);
    poly(big ? "#916a4b" : stone[2], -8-s,-13-s-bob, -5-s,-14-s-bob, -3,-12-s-bob, -3,-10-s-bob, -7-s,-10-s-bob);
    rect(big ? "#f6cb81" : stone[4], -7-s,-13-s-bob,3);
  }

  function enemy(ctx, type, x, y, time = 0, facing = 1) {
    const step = Math.floor(time * 8) & 3;
    const sprite = tile("e" + type + step, 39, 29, (g, b) => {
      g.translate(19, 27);
      if (type === "runner") runner(b, step);
      else if (type === "brute" || type === "boss") orc(b, step, type === "boss");
      else scout(b, step);
    });
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    if (facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(sprite, -19, -27);
    ctx.restore();
  }

  function emblem(ctx) {
    const crest = tile("crest", 30, 32, (_, b) => {
      const { poly, line, rect } = b;
      poly("#6a502e", 2,4, 8,4, 15,1, 22,4, 28,4, 28,18, 25,24, 20,28, 15,31, 10,28, 5,24, 2,18);
      poly("#ecbd67", 3,5, 9,5, 15,2, 21,5, 27,5, 27,18, 24,23, 20,27, 15,30, 10,27, 6,23, 3,18);
      poly("#233e37", 5,7, 10,6, 15,4, 21,7, 25,7, 25,17, 23,22, 19,26, 15,28, 11,26, 7,22, 5,17);
      poly("#294d40", 6,8, 12,7, 15,5, 15,26, 11,24, 8,21, 6,17);
      line("#ffe8a0", 3,5, 9,5);
      line("#f6d58b", 10,4, 15,2);
      rect("#91683e", 25,10,1,8);
      rect("#a67e47", 14,20,3,5);
      rect("#f3cd7e", 14,19,1,6);
      poly("#8e824d", 15,7, 19,13, 17,13, 21,17, 18,17, 22,21, 17,22, 13,21, 8,22, 11,18, 9,18, 13,13, 11,14);
      poly("#f0ce85", 15,6, 18,11, 16,11, 20,15, 17,15, 21,19, 17,20, 14,19, 8,21, 12,16, 10,17, 13,12, 11,13);
      poly("#c9a763", 15,8, 18,11, 16,11, 20,15, 16,14, 19,18, 16,18, 14,17);
      rect("#ffe3a3", 13,11,2);
      rect("#ffe3a3", 12,15,2);
      rect("#ffe3a3", 10,19,3);
    });
    drawCrisp(ctx, crest, 0, 0);
  }

  window.PineSprites = { tower, enemy, icon, emblem, portrait };
})();
