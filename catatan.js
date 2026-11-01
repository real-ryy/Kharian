const KUNCI = 'kharian-catatan';
const $ = id => document.getElementById(id);
const LABEL = { belum: 'Belum mulai', berlangsung: 'Sedang berlangsung', selesai: 'Selesai' };
const TOMBOL = { belum: 'Mulai', berlangsung: 'Selesai', selesai: 'Buka lagi' };
let data = [], editId = null;

try { data = JSON.parse(localStorage.getItem(KUNCI)) || []; } catch (e) { data = []; }
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

const simpanData = () => localStorage.setItem(KUNCI, JSON.stringify(data));
const tglLokal = (tambah = 0) => {
  const d = new Date(); d.setDate(d.getDate() + tambah);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const jamDari = ms => new Date(ms).toTimeString().slice(0, 5);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function ket(c) {
  const s = c.status || 'belum';
  if (s === 'berlangsung') return `Sedang berlangsung sejak ${jamDari(c.mulai)}`;
  if (s === 'selesai') return `Selesai: mulai ${jamDari(c.mulai)}, berakhir ${jamDari(c.selesai)}`;
  return LABEL.belum;
}

function tampil() {
  const list = data.filter(c => c.tanggal === $('tanggal').value).sort((a, b) => a.jam.localeCompare(b.jam));
  $('sesiInfo').textContent = 'Belum ada catatan untuk tanggal ini.';
  $('sesiInfo').hidden = list.length > 0;
  $('daftar').innerHTML = list.map((c, i) => {
    const s = c.status || 'belum';
    return `<li class="${s}"><span class="no">${i + 1}</span>
      <div class="isi"><b>${c.jam} ${esc(c.nama)}</b>${c.info ? `<small>${esc(c.info)}</small>` : ''}
        <small class="st ${s}">${ket(c)}</small>
        <div class="aksi"><button class="utama" data-status="${c.id}">${TOMBOL[s]}</button>
          <button data-ubah="${c.id}">Ubah</button><button data-hapus="${c.id}">Hapus</button></div>
      </div></li>`;
  }).join('');
}

function kosongkanForm() {
  editId = null;
  $('nama').value = ''; $('info').value = ''; $('jam').value = '';
  $('judulForm').textContent = 'Catatan baru';
  $('simpan').textContent = 'Simpan catatan';
  $('batal').hidden = true;
}

$('simpan').onclick = () => {
  const nama = $('nama').value.trim(), tanggal = $('tanggal').value, jam = $('jam').value;
  if (!nama || !tanggal || !jam) return alert('Isi nama kegiatan, tanggal, dan jam dulu.');
  const isi = { nama, info: $('info').value.trim(), tanggal, jam };
  if (editId) Object.assign(data.find(c => c.id === editId), isi);
  else data.push({ id: Date.now(), ...isi });
  simpanData(); kosongkanForm(); tampil();
};
$('batal').onclick = () => { kosongkanForm(); tampil(); };
$('tanggal').onchange = tampil;
$('hariIni').onclick = () => { $('tanggal').value = tglLokal(0); tampil(); };
$('besok').onclick = () => { $('tanggal').value = tglLokal(1); tampil(); };

$('daftar').onclick = e => {
  const { ubah, hapus, status } = e.target.dataset;
  if (status) {
    const c = data.find(x => x.id == status), s = c.status || 'belum';
    if (s === 'belum') { c.status = 'berlangsung'; c.mulai = Date.now(); }
    else if (s === 'berlangsung') { c.status = 'selesai'; c.selesai = Date.now(); }
    else { c.status = 'belum'; delete c.mulai; delete c.selesai; }
    simpanData(); tampil();
  }
  if (ubah) {
    const c = data.find(x => x.id == ubah);
    editId = c.id;
    $('nama').value = c.nama; $('info').value = c.info; $('tanggal').value = c.tanggal; $('jam').value = c.jam;
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

$('tanggal').value = tglLokal(0);
tampil();
