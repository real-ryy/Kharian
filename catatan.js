const KUNCI = 'kharian-catatan';
const $ = id => document.getElementById(id);
let data = [], editId = null;

try { data = JSON.parse(localStorage.getItem(KUNCI)) || []; } catch (e) { data = []; }
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

const simpanData = () => { localStorage.setItem(KUNCI, JSON.stringify(data)); Alarm.sinkron(data); };
const tglLokal = () => {
  const d = new Date();
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const jamDari = ms => new Date(ms).toTimeString().slice(0, 5);
const mulaiMs = c => new Date(c.tanggal + 'T' + c.jam).getTime();
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Jam selesai yang lebih awal dari jam mulai dianggap keesokan harinya.
function hitungAkhir(tanggal, jam, jamS) {
  if (!jamS) return null;
  const d = new Date(tanggal + 'T' + jamS);
  if (jamS < jam) d.setDate(d.getDate() + 1);
  return d.getTime();
}

function statusDari(c) {
  const kini = Date.now();
  if (kini < mulaiMs(c)) return 'belum';
  return c.akhir && kini >= c.akhir ? 'selesai' : 'berlangsung';
}

function ket(c, s) {
  const mati = c.alarm === false ? ' (tanpa alarm)' : '';
  if (s === 'belum') return `Mulai otomatis pukul ${c.jam}` + (c.akhir ? `, selesai ${jamDari(c.akhir)}` : '') + mati;
  if (s === 'berlangsung') return `Sedang berlangsung sejak ${c.jam}` + (c.akhir ? `, selesai otomatis ${jamDari(c.akhir)}` : ', belum ada jam selesai') + mati;
  return `Selesai: ${c.jam} sampai ${jamDari(c.akhir)}`;
}

function tampil() {
  const list = data.filter(c => c.tanggal === $('tanggal').value).sort((a, b) => a.jam.localeCompare(b.jam));
  $('sesiInfo').textContent = 'Belum ada catatan untuk tanggal ini.';
  $('sesiInfo').hidden = list.length > 0;
  $('daftar').innerHTML = list.map((c, i) => {
    const s = statusDari(c);
    return `<li class="${s}"><span class="no">${i + 1}</span>
      <div class="isi"><b>${c.jam} ${esc(c.nama)}</b>${c.info ? `<small>${esc(c.info)}</small>` : ''}
        <small class="st ${s}">${ket(c, s)}</small>
        <div class="aksi">${s === 'berlangsung' ? `<button class="utama" data-selesai="${c.id}">Selesai</button>` : ''}
          <button data-ubah="${c.id}">Ubah</button><button data-hapus="${c.id}">Hapus</button></div>
      </div></li>`;
  }).join('');
}

function kosongkanForm() {
  editId = null;
  ['nama', 'info', 'jam', 'jamSelesai'].forEach(k => $(k).value = '');
  $('alarm').checked = true;
  $('judulForm').textContent = 'Catatan baru';
  $('simpan').textContent = 'Simpan catatan';
  $('batal').hidden = true;
}

$('simpan').onclick = () => {
  const nama = $('nama').value.trim(), tanggal = $('tanggal').value, jam = $('jam').value, jamS = $('jamSelesai').value;
  if (!nama || !tanggal || !jam) return alert('Isi nama kegiatan, tanggal, dan jam mulai dulu.');
  const lama = editId && data.find(c => c.id === editId);
  const isi = { nama, info: $('info').value.trim(), tanggal, jam, alarm: $('alarm').checked };
  // Jam selesai yang tidak diubah tetap memakai waktu aslinya (misalnya dari tombol Selesai).
  isi.akhir = lama && lama.akhir && jamS === jamDari(lama.akhir) && tanggal === lama.tanggal && jam === lama.jam
    ? lama.akhir : hitungAkhir(tanggal, jam, jamS);
  if (lama) Object.assign(lama, isi); else data.push({ id: Date.now(), ...isi });
  simpanData(); kosongkanForm(); tampil();
};
$('batal').onclick = () => { kosongkanForm(); tampil(); };
$('tanggal').onchange = tampil;

$('daftar').onclick = e => {
  const { ubah, hapus, selesai } = e.target.dataset;
  if (selesai) {
    data.find(x => x.id == selesai).akhir = Date.now();
    simpanData(); tampil();
  }
  if (ubah) {
    const c = data.find(x => x.id == ubah);
    editId = c.id;
    $('nama').value = c.nama; $('info').value = c.info; $('tanggal').value = c.tanggal;
    $('jam').value = c.jam; $('jamSelesai').value = c.akhir ? jamDari(c.akhir) : '';
    $('alarm').checked = c.alarm !== false;
    $('judulForm').textContent = 'Ubah catatan';
    $('simpan').textContent = 'Simpan perubahan';
    $('batal').hidden = false;
    $('nama').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (hapus && confirm('Hapus catatan ini?')) {
    data = data.filter(x => x.id != hapus);
    simpanData(); tampil();
  }
};

$('izinAlarm').onclick = Alarm.izin;
$('tesAlarm').onclick = Alarm.tes;

$('tanggal').value = tglLokal();
tampil();
Alarm.mulai(data);
setInterval(tampil, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tampil(); });
