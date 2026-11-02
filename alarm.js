// Alarm Kharian: jadwal notifikasi bunyi dan getar lewat Capacitor (hanya di aplikasi Android).
const Alarm = (() => {
  const SALURAN = 'alarm-kharian-1';
  const ID_TES = 2000000001;
  const cap = window.Capacitor;
  const asli = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const LN = asli ? ((cap.Plugins && cap.Plugins.LocalNotifications) || cap.registerPlugin('LocalNotifications')) : null;
  const info = teks => { const e = document.getElementById('alarmInfo'); if (e) e.textContent = teks; };
  const pesan = e => (e && e.message) || String(e);

  async function siapSaluran() {
    try {
      await LN.createChannel({
        id: SALURAN, name: 'Alarm Kharian', description: 'Bunyi dan getar saat kegiatan mulai dan selesai',
        importance: 5, visibility: 1, vibration: true
      });
      return true;
    } catch (e) { info('Gagal membuat saluran alarm: ' + pesan(e)); return false; }
  }

  async function izin() {
    if (!LN) return info('Alarm hanya berfungsi di aplikasi Kharian (APK), tidak di Chrome.');
    try {
      let s = await LN.checkPermissions();
      if (s.display !== 'granted') s = await LN.requestPermissions();
      let tepat = 'tidak diketahui';
      try { tepat = (await LN.checkExactNotificationSetting()).exact_alarm; } catch (e) {}
      info(`Izin notifikasi: ${s.display}. Izin alarm tepat waktu: ${tepat}.`);
      if (tepat === 'denied') await LN.changeExactNotificationSetting();
      return s.display === 'granted';
    } catch (e) { info('Gagal meminta izin: ' + pesan(e)); return false; }
  }

  async function tes() {
    if (!LN) return info('Alarm hanya berfungsi di aplikasi Kharian (APK), tidak di Chrome.');
    if (!(await izin()) || !(await siapSaluran())) return;
    try {
      await LN.schedule({ notifications: [{
        id: ID_TES, title: 'Tes alarm Kharian', body: 'Kalau ini berbunyi dan bergetar, alarm Kharian berfungsi.',
        channelId: SALURAN, schedule: { at: new Date(Date.now() + 60000), allowWhileIdle: true }
      }] });
      info('Tes dijadwalkan. Tutup aplikasi, lalu tunggu 1 menit sampai notifikasi muncul.');
    } catch (e) { info('Gagal menjadwalkan tes: ' + pesan(e)); }
  }

  const idDari = (c, jenis) => (c.id % 100000000) * 2 + (jenis === 'selesai' ? 1 : 0);

  // Menyusun ulang semua jadwal dari daftar catatan: batalkan yang lama, pasang yang baru.
  async function sinkron(data) {
    if (!LN) return;
    try {
      if ((await LN.checkPermissions()).display !== 'granted') return;
      if (!(await siapSaluran())) return;
      const { notifications } = await LN.getPending();
      const lama = notifications.filter(n => n.id !== ID_TES).map(n => ({ id: n.id }));
      if (lama.length) await LN.cancel({ notifications: lama });
      const kini = Date.now(), baru = [];
      data.forEach(c => {
        if (c.alarm === false) return;
        [['mulai', new Date(c.tanggal + 'T' + c.jam).getTime()], ['selesai', c.akhir]].forEach(([jenis, waktu]) => {
          if (!waktu || waktu <= kini + 3000) return;
          baru.push({ waktu, n: {
            id: idDari(c, jenis),
            title: jenis === 'mulai' ? `${c.nama} dimulai` : `${c.nama} selesai`,
            body: jenis === 'mulai' ? `Mulai pukul ${c.jam}` : 'Kegiatan selesai',
            channelId: SALURAN,
            schedule: { at: new Date(waktu), allowWhileIdle: true }
          } });
        });
      });
      const pilih = baru.sort((a, b) => a.waktu - b.waktu).slice(0, 200).map(x => x.n);
      if (pilih.length) await LN.schedule({ notifications: pilih });
      info(pilih.length ? `Alarm aktif untuk ${pilih.length} jadwal berikutnya.` : 'Belum ada jadwal alarm berikutnya.');
    } catch (e) { info('Gagal mengatur alarm: ' + pesan(e)); }
  }

  function mulai(data) {
    if (!LN) return info('Alarm hanya berfungsi di aplikasi Kharian (APK), tidak di Chrome.');
    sinkron(data);
  }

  return { izin, tes, sinkron, mulai };
})();
