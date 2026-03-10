// =============================================
//  Kalkulator Untung Rugi Bisnis
//  script.js
// =============================================

// ── STATE ──
let selPeriod = 30;
let D = null; // hasil kalkulasi terakhir

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  setPeriod(30);
});

// ── PERIOD SELECTOR ──
function setPeriod(d) {
  selPeriod = d;

  // update active tab
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`.ptab[data-d="${d}"]`);
  if (tab) tab.classList.add('active');

  const cw = document.getElementById('cwrap');
  const hg = document.getElementById('hariGroup');
  const pl = document.getElementById('pLbl');

  if (d === 'c') {
    // Custom period
    cw.classList.add('show');
    const cd = parseInt(document.getElementById('custDays').value) || 0;
    selPeriod = cd || 'c';
    pl.textContent = cd ? `dalam ${cd} hari` : 'dalam periode custom';
  } else {
    cw.classList.remove('show');
    const names = {
      1:  'hari ini',
      2:  'dalam 2 hari',
      7:  'dalam 7 hari',
      30: 'dalam 30 hari (1 bulan)'
    };
    pl.textContent = names[d] || `dalam ${d} hari`;
  }

  // Tampilkan hari kerja hanya untuk periode bulanan / custom
  hg.style.display = (d === 30 || d === 'c') ? '' : 'none';

  prvTerjual();
}

function onCustDays() {
  const cd = parseInt(document.getElementById('custDays').value) || 0;
  selPeriod = cd || 'c';
  document.getElementById('pLbl').textContent = cd ? `dalam ${cd} hari` : 'dalam periode custom';
  prvTerjual();
}

// ── FORMAT HELPERS ──
function fmt(n) {
  return 'Rp ' + Math.abs(Math.round(n)).toLocaleString('id-ID');
}

function fmtN(n) {
  return Math.round(n).toLocaleString('id-ID');
}

// ── LIVE PREVIEW: MARGIN ──
function prvMargin() {
  const hpp = +document.getElementById('hpp').value || 0;
  const hj  = +document.getElementById('hj').value  || 0;
  const pv  = document.getElementById('pvMargin');
  const pvH = document.getElementById('pvHPP');

  if (hpp && hj) {
    const m   = hj - hpp;
    const pct = ((m / hpp) * 100).toFixed(1);

    if (m >= 0) {
      pv.innerHTML = `Margin: <span>${fmt(m)} / pcs (${pct}%)</span> — untung ini per produk sebelum biaya ops`;
    } else {
      pv.innerHTML = `<span class="warn">⚠️ Harga jual LEBIH RENDAH dari HPP! Rugi ${fmt(Math.abs(m))} per produk.</span>`;
    }
    pvH.innerHTML = `Modal: <span>${fmt(hpp)} / pcs</span>`;
  } else {
    pv.textContent  = '—';
    pvH.textContent = hpp ? `Modal: ${fmt(hpp)} / pcs` : 'Isi kedua harga untuk melihat margin';
  }
}

// ── LIVE PREVIEW: BIAYA OPS ──
function prvOps() {
  let tot = 0;
  document.querySelectorAll('.ops-input').forEach(i => tot += +i.value || 0);

  const el = document.getElementById('pvOps');
  if (tot) {
    el.innerHTML = `Total biaya ops: <span>${fmt(tot)} / bulan</span> — harus ditutup oleh laba penjualan`;
  } else {
    el.textContent = 'Kosong = tidak ada biaya tetap (misal: jualan dari rumah)';
  }
}

// ── LIVE PREVIEW: JUMLAH TERJUAL ──
function prvTerjual() {
  const t    = +document.getElementById('terjual').value || 0;
  const days = typeof selPeriod === 'number' ? selPeriod : 0;
  const hj   = +document.getElementById('hj').value || 0;
  const el   = document.getElementById('pvTerjual');

  if (t && days) {
    const perH = (t / days).toFixed(1);
    el.innerHTML = `Rata-rata: <span>${perH} pcs/hari</span>` +
      (hj ? ` — Omzet estimasi: <span>${fmt(t * hj)}</span>` : '');
  } else {
    el.textContent = '—';
  }
}

// ── BIAYA OPS: TAMBAH / HAPUS ──
function addOps() {
  const li = document.getElementById('opsList');
  const el = document.createElement('div');
  el.className = 'ops-item';
  el.innerHTML = `
    <div class="ops-name" contenteditable="true">Biaya Lain</div>
    <div class="iw" style="flex:1">
      <span class="ipfx">Rp</span>
      <input type="number" class="ops-input" placeholder="0" min="0" oninput="prvOps()">
    </div>
    <button class="rm-btn" onclick="rmOps(this)">×</button>
  `;
  li.appendChild(el);
  el.querySelector('input').focus();
}

function rmOps(btn) {
  if (document.querySelectorAll('.ops-item').length <= 1) return;
  btn.closest('.ops-item').remove();
  prvOps();
}

// ── TOOLTIP TOGGLE ──
function toggleTip(id) {
  document.getElementById(id).classList.toggle('show');
}

// ── GLOSSARY TOGGLE ──
function toggleGlos() {
  document.getElementById('glosBody').classList.toggle('show');
  document.getElementById('glosArr').classList.toggle('open');
}

// ── MAIN CALCULATION ──
function hitung() {
  const hpp     = +document.getElementById('hpp').value    || 0;
  const hj      = +document.getElementById('hj').value     || 0;
  const terjual = +document.getElementById('terjual').value || 0;
  const hariOps = +document.getElementById('hariOps').value || 26;

  // Resolve custom period
  if (selPeriod === 'c' || typeof selPeriod !== 'number' || !selPeriod) {
    const cd = parseInt(document.getElementById('custDays').value) || 0;
    if (!cd) {
      alert('Masukkan jumlah hari untuk periode custom!');
      return;
    }
    selPeriod = cd;
  }

  const days = selPeriod;

  // Validasi input wajib
  if (!hpp || !hj || !terjual || !days) {
    alert('Mohon isi HPP, Harga Jual, Jumlah Terjual, dan pilih periode terlebih dahulu!');
    return;
  }

  // Hitung total biaya operasional
  let totalOps = 0;
  document.querySelectorAll('.ops-input').forEach(i => totalOps += +i.value || 0);

  // Kalkulasi utama
  const margin     = hj - hpp;
  const marginPct  = hpp > 0 ? (margin / hpp * 100) : 0;
  const bepBln     = (totalOps > 0 && margin > 0) ? Math.ceil(totalOps / margin) : 0;
  const bepHari    = hariOps > 0 ? Math.ceil(bepBln / hariOps) : 0;

  // Biaya ops proporsional ke periode
  const opsPerDay  = totalOps / 30;
  const opsPeriod  = opsPerDay * days;

  const omzet      = terjual * hj;
  const totalHPP   = terjual * hpp;
  const labaKotor  = terjual * margin;
  const labaBersih = labaKotor - opsPeriod;
  const perHari    = terjual / days;

  // Simpan ke state global
  D = {
    hpp, hj, margin, marginPct,
    bepBln, bepHari,
    totalOps, opsPerDay, opsPeriod,
    terjual, days, hariOps,
    omzet, totalHPP, labaKotor, labaBersih,
    perHari
  };

  renderResult();
}

// ── RENDER HASIL ──
function renderResult() {
  const d = D;
  if (!d) return;

  const card = document.getElementById('resultCard');
  card.style.display = 'block';

  // Tentukan status
  let cls, icon, lbl;
  if (d.labaBersih > 0)      { cls = 'profit';     icon = '🎉'; lbl = 'UNTUNG!'; }
  else if (d.labaBersih < 0) { cls = 'loss';       icon = '😟'; lbl = 'RUGI'; }
  else                       { cls = 'break-even'; icon = '😐'; lbl = 'IMPAS'; }

  card.className = 'result-card ' + cls;
  document.getElementById('resIcon').textContent = icon;
  document.getElementById('resLbl').textContent  = lbl;

  // Period badge
  const pnames = { 1: '1 Hari', 2: '2 Hari', 7: '7 Hari', 30: '1 Bulan' };
  document.getElementById('resPBadge').textContent = pnames[d.days] || d.days + ' Hari';

  // Big number
  document.getElementById('bnLbl').textContent = d.labaBersih >= 0 ? 'Laba Bersih Periode Ini' : 'Kerugian Periode Ini';
  document.getElementById('bnVal').textContent  = fmt(d.labaBersih);
  document.getElementById('bnSub').textContent  = `Periode ${d.days} hari — ${fmtN(d.terjual)} pcs terjual`;

  // Grid cards
  document.getElementById('rMargin').textContent    = fmt(d.margin);
  document.getElementById('rMarginPct').textContent = d.marginPct.toFixed(1) + '%';
  document.getElementById('rOmzet').textContent     = fmt(d.omzet);
  document.getElementById('rLabaKotor').textContent = fmt(d.labaKotor);

  // BEP
  document.getElementById('rBEP').textContent   = d.bepHari;
  document.getElementById('bepH').textContent   = d.bepHari;
  document.getElementById('bepB').textContent   = fmtN(d.bepBln);
  document.getElementById('bepOps').textContent = fmtN(d.totalOps);

  // Default view tab sesuai periode
  const dv = d.days === 1 ? 'h' : d.days === 2 ? '2h' : d.days === 7 ? 'm' : 'b';
  switchView(dv);

  // Progress bar
  const bepPeriod = d.bepHari * d.days;
  const maxPcs    = Math.max(bepPeriod * 1.6, d.terjual * 1.3, 1);
  const pct       = Math.min((d.terjual / maxPcs) * 100, 100);
  const bepPct    = Math.min((bepPeriod / maxPcs) * 100, 100);

  setTimeout(() => {
    document.getElementById('progBar').style.width = pct + '%';
  }, 150);

  document.getElementById('bepMark').style.left      = bepPct + '%';
  document.getElementById('progPct').textContent     = bepPeriod > 0
    ? `${((d.terjual / bepPeriod) * 100).toFixed(0)}% dari BEP` : '—';
  document.getElementById('progMax').textContent     = Math.round(maxPcs) + ' pcs';
  document.getElementById('progBepLbl').textContent  = `▲ BEP (${fmtN(bepPeriod)} pcs)`;

  // Advice box
  const ab = document.getElementById('advBox');
  const at = document.getElementById('advTitle');
  const ax = document.getElementById('advText');

  if (d.labaBersih > 0) {
    ab.className   = 'advice-box a-profit';
    at.textContent = '💡 Kamu Sudah Untung! Tips Selanjutnya:';
    const lebih    = (d.perHari - d.bepHari).toFixed(1);
    ax.textContent = `Selamat! Kamu untung ${fmt(d.labaBersih)} dalam ${d.days} hari. Rata-rata kamu jual ${d.perHari.toFixed(1)} pcs/hari, melewati BEP ${d.bepHari} pcs/hari (+${lebih} pcs/hari extra). Pertimbangkan untuk meningkatkan kapasitas produksi atau gencarkan promosi untuk omzet yang lebih besar.`;
  } else if (d.labaBersih < 0) {
    ab.className   = 'advice-box a-loss';
    at.textContent = '⚠️ Kamu Masih Rugi — Ini yang Perlu Dilakukan:';
    const kurang   = (d.bepHari - d.perHari).toFixed(1);
    ax.textContent = `Kamu perlu minimal ${d.bepHari} pcs/hari, tapi rata-rata baru ${d.perHari.toFixed(1)} pcs/hari (kurang ${kurang} pcs/hari). Ada 3 cara untuk atasi ini: (1) Naikkan harga jual, (2) Kurangi HPP/modal per produk, atau (3) Tambah volume penjualan lewat promosi. Kurangi biaya ops juga bisa membantu menurunkan BEP.`;
  } else {
    ab.className   = 'advice-box a-bep';
    at.textContent = '⚖️ Tepat di Titik Impas (Break Even)';
    ax.textContent = `Tidak untung dan tidak rugi. Untuk mulai menghasilkan profit, coba jual lebih dari ${d.bepHari} pcs/hari, atau cari cara memangkas biaya operasional agar BEP turun.`;
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── SWITCH VIEW TAB ──
function switchView(mode) {
  const d = D;
  if (!d) return;

  // Update active tab
  const modeMap = { h: 'Harian', '2h': '2 Hari', m: 'Minggu', b: 'Bulanan', i: 'Inputan' };
  document.querySelectorAll('.vtab').forEach(t => {
    t.classList.toggle('active', t.querySelector('span').textContent.trim() === modeMap[mode]);
  });

  const multMap = { h: 1, '2h': 2, m: 7, b: 30, i: d.days };
  const mult    = multMap[mode] || d.days;
  const lbl     = modeMap[mode] || (d.days + ' Hari');

  const note = mode === 'i'
    ? `Data inputan kamu: ${d.days} hari`
    : `Estimasi berdasarkan rata-rata ${d.perHari.toFixed(1)} pcs/hari × ${mult} hari`;
  document.getElementById('viewNote').textContent = note;

  // Hitung nilai untuk periode ini
  const ops  = (d.totalOps / 30) * mult;
  const tj   = d.perHari * mult;
  const om   = tj * d.hj;
  const thpp = tj * d.hpp;
  const lk   = tj * d.margin;
  const lb   = lk - ops;

  const lbColor = lb > 0 ? 'var(--green)' : lb < 0 ? 'var(--red)' : 'var(--yellow)';
  const lbSign  = lb >= 0 ? '' : '-';

  // Helper render
  const fv = (n, c = '') =>
    `<span style="font-family:'Sora',sans-serif;font-weight:700;${c ? 'color:' + c : ''}">${fmt(n)}</span>`;
  const fn = (n) =>
    `<span style="font-family:'Sora',sans-serif;font-weight:700">${Math.round(n).toLocaleString('id-ID')} pcs</span>`;

  const isInput = mode === 'i';

  document.getElementById('stblBody').innerHTML = `
    <tr>
      <td>📦 Estimasi Produk Terjual</td>
      <td>${fn(isInput ? d.terjual : tj)}</td>
    </tr>
    <tr>
      <td>💰 Omzet <small style="color:var(--muted)">(uang masuk)</small></td>
      <td>${fv(isInput ? d.omzet : om)}</td>
    </tr>
    <tr>
      <td>🏭 Total Modal / HPP</td>
      <td>${fv(isInput ? d.totalHPP : thpp)}</td>
    </tr>
    <tr>
      <td>📈 Laba Kotor <small style="color:var(--muted)">(omzet−modal)</small></td>
      <td>${fv(isInput ? d.labaKotor : lk, 'var(--green)')}</td>
    </tr>
    <tr>
      <td>🔧 Biaya Operasional <small style="color:var(--muted)">(${lbl})</small></td>
      <td>${fv(isInput ? d.opsPeriod : ops, 'var(--yellow)')}</td>
    </tr>
    <tr class="tr-total">
      <td>🏆 Laba / Rugi Bersih</td>
      <td style="color:${isInput ? (d.labaBersih > 0 ? 'var(--green)' : d.labaBersih < 0 ? 'var(--red)' : 'var(--yellow)') : lbColor}">
        ${isInput ? (d.labaBersih < 0 ? '-' : '') + fmt(d.labaBersih) : lbSign + fmt(lb)}
      </td>
    </tr>
  `;
}

// ── RESET ──
function doReset() {
  // Kosongkan semua input
  ['hpp', 'hj', 'terjual', 'custDays'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('hariOps').value = '26';
  document.querySelectorAll('.ops-input').forEach(i => i.value = '');

  // Sembunyikan hasil
  document.getElementById('resultCard').style.display = 'none';
  document.getElementById('progBar').style.width = '0%';

  // Reset preview teks
  ['pvMargin', 'pvHPP', 'pvOps', 'pvTerjual'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });

  // Reset state
  D = null;
  selPeriod = 30;
  setPeriod(30);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
