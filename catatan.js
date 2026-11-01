const KUNCI = 'kharian-catatan';
const $ = id => document.getElementById(id);
let data = [], editId = null;

try { data = JSON.parse(localStorage.getItem(KUNCI)) || []; } catch (e) { data = []; }
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

const simpanData = () => localStorage.setItem(KUNCI, JSON.stringify(data));
const tglLokal = (tambah = 0) => {
  const d = new Date(); d.setDate(d.getDate() + tambah);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function tampil() {
  const list = data.filter(c => c.tanggal === $('tanggal').value).sort((a, b) => a.jam.localeCompare(b.jam));
  $('sesiInfo').textContent = 'Belum ada catatan untuk tanggal ini.';
  $('sesiInfo').hidden = list.length > 0;
  $('daftar').innerHTML = list.map((c, i) => `
    <li><span class="no">${i + 1}</span>
      <div class="isi"><b>${c.jam} ${esc(c.nama)}</b>${c.info ? `<small>${esc(c.info)}</small>` : ''}
        <div class="aksi"><button data-ubah="${c.id}">Ubah</button><button data-hapus="${c.id}">Hapus</button></div>
      </div></li>`).join('');
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
  const { ubah, hapus } = e.target.dataset;
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
