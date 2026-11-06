export function qrMake(data) {
  const EC = [7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  const NB = [1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25]
  const raw = (v) => {
    let r = (16 * v + 128) * v + 64
    if (v >= 2) {
      const a = (v / 7 | 0) + 2
      r -= (25 * a - 10) * a - 55
      if (v >= 7) r -= 36
    }
    return r
  }

  let ver = 1
  for (;; ver++) {
    if (ver > 40) throw new Error('Data terlalu besar')
    if (4 + (ver < 10 ? 8 : 16) + 8 * data.length <= ((raw(ver) >> 3) - EC[ver - 1] * NB[ver - 1]) * 8) break
  }

  const cap = ((raw(ver) >> 3) - EC[ver - 1] * NB[ver - 1]) * 8
  const bits = []
  const put = (v, k) => {
    for (let i = k - 1; i >= 0; i--) bits.push((v >>> i) & 1)
  }

  put(4, 4)
  put(data.length, ver < 10 ? 8 : 16)
  data.forEach((b) => put(b, 8))
  put(0, Math.min(4, cap - bits.length))
  while (bits.length % 8) bits.push(0)
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8)

  const cw = []
  for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2))

  const mul = (x, y) => {
    let z = 0
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 285)
      z ^= ((y >>> i) & 1) * x
    }
    return z
  }

  const nb = NB[ver - 1]
  const el = EC[ver - 1]
  const rc = raw(ver) >> 3
  const ns = nb - rc % nb
  const sl = rc / nb | 0

  const div = Array(el).fill(0)
  div[el - 1] = 1
  for (let i = 0, r = 1; i < el; i++) {
    for (let j = 0; j < el; j++) {
      div[j] = mul(div[j], r)
      if (j + 1 < el) div[j] ^= div[j + 1]
    }
    r = mul(r, 2)
  }

  const bl = []
  for (let i = 0, k = 0; i < nb; i++) {
    const d = cw.slice(k, k + sl - el + (i < ns ? 0 : 1))
    k += d.length
    const rem = Array(el).fill(0)
    for (const b of d) {
      const f = b ^ rem.shift()
      rem.push(0)
      div.forEach((c, j) => { rem[j] ^= mul(c, f) })
    }
    if (i < ns) d.push(0)
    bl.push(d.concat(rem))
  }

  const all = []
  for (let i = 0; i < bl[0].length; i++) {
    bl.forEach((b, j) => {
      if (i !== sl - el || j >= ns) all.push(b[i])
    })
  }

  const n = ver * 4 + 17
  const m = []
  const fn = []
  for (let i = 0; i < n; i++) {
    m.push(Array(n).fill(false))
    fn.push(Array(n).fill(false))
  }

  const set = (x, y, v) => {
    m[y][x] = v
    fn[y][x] = true
  }

  for (let i = 0; i < n; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }

  const finder = (x, y) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const xx = x + dx
        const yy = y + dy
        if (xx >= 0 && xx < n && yy >= 0 && yy < n) {
          const d = Math.max(Math.abs(dx), Math.abs(dy))
          set(xx, yy, d !== 2 && d !== 4)
        }
      }
    }
  }
  finder(3, 3)
  finder(n - 4, 3)
  finder(3, n - 4)

  if (ver > 1) {
    const na = (ver / 7 | 0) + 2
    const st = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2
    const pos = [6]
    for (let p = n - 7; pos.length < na; p -= st) pos.splice(1, 0, p)
    pos.forEach((x, i) => pos.forEach((y, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) return
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
      }
    }))
  }

  const fmt = (mk) => {
    const d = (1 << 3) | mk
    let r = d
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537)
    const b = ((d << 10) | r) ^ 0x5412
    const g = (i) => ((b >>> i) & 1) === 1
    for (let i = 0; i <= 5; i++) set(8, i, g(i))
    set(8, 7, g(6))
    set(8, 8, g(7))
    set(7, 8, g(8))
    for (let i = 9; i < 15; i++) set(14 - i, 8, g(i))
    for (let i = 0; i < 8; i++) set(n - 1 - i, 8, g(i))
    for (let i = 8; i < 15; i++) set(8, n - 15 + i, g(i))
    set(8, n - 8, true)
  }
  fmt(0)

  if (ver >= 7) {
    let r = ver
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25)
    const b = (ver << 12) | r
    for (let i = 0; i < 18; i++) {
      const c = ((b >>> i) & 1) === 1
      const a = n - 11 + i % 3
      const q = i / 3 | 0
      set(a, q, c)
      set(q, a, c)
    }
  }

  for (let i = 0, right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const up = ((right + 1) & 2) === 0
        const y = up ? n - 1 - vert : vert
        if (!fn[y][x] && i < all.length * 8) {
          m[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1
          i++
        }
      }
    }
  }

  const MK = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => ((x / 3 | 0) + (y / 2 | 0)) % 2 === 0,
    (x, y) => x * y % 2 + x * y % 3 === 0,
    (x, y) => (x * y % 2 + x * y % 3) % 2 === 0,
    (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0,
  ]

  const app = (k) => {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!fn[y][x] && MK[k](x, y)) m[y][x] = !m[y][x]
      }
    }
  }

  const pen = () => {
    let p = 0
    let d = 0
    for (let a = 0; a < n; a++) {
      for (let t = 0; t < 2; t++) {
        let run = 1
        for (let b = 1; b <= n; b++) {
          if (b < n && (t ? m[b][a] === m[b - 1][a] : m[a][b] === m[a][b - 1])) run++
          else {
            if (run >= 5) p += run - 2
            run = 1
          }
        }
      }
    }
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (m[y][x]) d++
        if (x < n - 1 && y < n - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3
      }
    }
    return p + (Math.ceil(Math.abs(d * 20 - n * n * 10) / (n * n)) - 1) * 10
  }

  let best = 0
  let bp = 1e9
  for (let k = 0; k < 8; k++) {
    fmt(k)
    app(k)
    const p = pen()
    if (p < bp) {
      bp = p
      best = k
    }
    app(k)
  }
  fmt(best)
  app(best)

  return { n, m }
}
