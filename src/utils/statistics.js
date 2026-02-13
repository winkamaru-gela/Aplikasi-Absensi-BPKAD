// Fungsi untuk Menghitung Statistik Harian (Dashboard & Laporan Harian)
export const getDailyStats = (date, session, employees, attendance) => {
    // 1. Ambil data absensi yang valid (approved) sesuai tanggal & sesi
    const logs = attendance.filter(l => l.date === date && l.session === session && l.statusApproval === 'approved');
    
    // 2. Ambil hanya pegawai dengan role 'user'
    const pegawaiOnly = employees.filter(e => e.role === 'user');

    // 3. Siapkan container (bucket) untuk grouping pegawai berdasarkan status
    const grouped = {
      Hadir: [],
      Sakit: [],
      Izin: [],
      Cuti: [],
      'Dinas Luar': [],
      Alpa: [] 
    };

    const recordedIds = new Set();

    // 4. Masukkan pegawai yang absen ke bucket yang sesuai
    logs.forEach(log => {
      const emp = pegawaiOnly.find(e => e.id === log.userId);
      if (emp) {
          recordedIds.add(emp.id);
          // Pastikan status dikenali, jika tidak masukkan ke Hadir sebagai fallback
          const status = grouped[log.status] ? log.status : 'Hadir';
          grouped[status].push(emp);
      }
    });

    // 5. Cari pegawai yang Alpa (tidak ada di log absensi)
    grouped.Alpa = pegawaiOnly.filter(e => !recordedIds.has(e.id));

    // 6. Hitung ringkasan angka
    const totalTidakHadir = grouped.Sakit.length + grouped.Izin.length + grouped.Cuti.length + grouped['Dinas Luar'].length + grouped.Alpa.length;

    const counts = {
      Hadir: grouped.Hadir.length,
      Sakit: grouped.Sakit.length,
      Izin: grouped.Izin.length,
      Cuti: grouped.Cuti.length,
      DL: grouped['Dinas Luar'].length,
      Alpa: grouped.Alpa.length,
      TotalPegawai: pegawaiOnly.length,
      TotalKurang: totalTidakHadir
    };

    return { grouped, counts, logs };
};

// Fungsi untuk Menghitung Statistik Bulanan per User (Rekapan Bulanan)
export const getMonthlyStats = (month, attendance) => {
    // 1. Filter semua log di bulan tersebut
    const monthlyLogs = attendance.filter(l => l.date.startsWith(month) && l.statusApproval === 'approved');
    
    // 2. Fungsi helper untuk menghitung detail per user
    const calculateUserStats = (userId) => {
         const userLogs = monthlyLogs.filter(l => l.userId === userId);
         const stats = {
            Hadir: { p: 0, s: 0 },
            Sakit: { p: 0, s: 0 },
            Izin: { p: 0, s: 0 },
            Cuti: { p: 0, s: 0 },
            'Dinas Luar': { p: 0, s: 0 }
        };

        userLogs.forEach(log => {
            const status = log.status; 
            const session = log.session; 
            
            if (stats[status]) {
                if (session === 'Pagi') stats[status].p += 1;
                else if (session === 'Sore') stats[status].s += 1;
            }
        });
        return stats;
    };

    return { monthlyLogs, calculateUserStats };
};

// Fungsi Baru: Statistik Tahunan per User (Rekapan Tahunan)
export const getYearlyStats = (year, attendance, userId) => {
    // 1. Filter logs untuk tahun tertentu & user tertentu
    const yearPrefix = `${year}-`;
    const userLogs = attendance.filter(l => 
        l.userId === userId && 
        l.date.startsWith(yearPrefix) && 
        l.statusApproval === 'approved'
    );

    // 2. Definisi Bulan
    const months = [
        { id: '01', name: 'Januari' }, { id: '02', name: 'Februari' }, { id: '03', name: 'Maret' },
        { id: '04', name: 'April' }, { id: '05', name: 'Mei' }, { id: '06', name: 'Juni' },
        { id: '07', name: 'Juli' }, { id: '08', name: 'Agustus' }, { id: '09', name: 'September' },
        { id: '10', name: 'Oktober' }, { id: '11', name: 'November' }, { id: '12', name: 'Desember' }
    ];

    // 3. Loop setiap bulan untuk hitung stats
    const statsByMonth = months.map(m => {
        // Ambil log bulan ini
        const currentMonthLogs = userLogs.filter(l => l.date.startsWith(`${year}-${m.id}`));
        
        const stats = {
            Hadir: { p: 0, s: 0 },
            Sakit: { p: 0, s: 0 },
            Izin: { p: 0, s: 0 },
            Cuti: { p: 0, s: 0 },
            'Dinas Luar': { p: 0, s: 0 }
        };

        currentMonthLogs.forEach(log => {
             const status = log.status; 
             const session = log.session;
             if (stats[status]) {
                if (session === 'Pagi') stats[status].p += 1;
                else if (session === 'Sore') stats[status].s += 1;
             }
        });

        // Hitung total kehadiran efektif bulan ini
        const totalHadir = stats.Hadir.p + stats.Hadir.s;

        return {
            monthName: m.name,
            stats,
            totalHadir
        };
    });

    return statsByMonth;
};