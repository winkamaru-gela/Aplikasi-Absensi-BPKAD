export const DEFAULT_LOGO_URL = "https://play-lh.googleusercontent.com/FXc0mf6YaPS9bgd1JIUN8AHu-y53Ukbz0lW3hmD3F4CR9xXuMO6TrXqxqnm_-PcA9UfD=w600-h300-pc0xffffff-pd";

export const INITIAL_SETTINGS = {
  opdName: 'Badan Pengelolaan Keuangan dan Aset Daerah',
  opdShort: 'Singakatan Organisasi',
  parentAgency: 'Pemerintah Kabupaten Pulau Taliabu',
  address: 'Jl. Merdeka No. 1, Bobong, Pulau Taliabu',
  logoUrl: DEFAULT_LOGO_URL,
  kepalaName: 'Darwin Kamarudin ... Ganti',
  kepalaNip: '199208xxxxxxxxx',
  kepalaJabatan: 'Kepala Badan atau lainnya',
  titimangsa: 'Bobong'
};

export const formatDateIndo = (dateStr) => {
  if (!dateStr) return '';
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('id-ID', options);
};

export const formatDateNoWeekday = (dateStr) => {
  if (!dateStr) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('id-ID', options);
};

export const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
};

export const checkAbsensiTime = (session) => {
  const now = new Date();
  const hour = now.getHours();
  // Pagi: 06.00 - 09.00
  if (session === 'Pagi') {
    return hour >= 6 && hour < 9; 
  }
  // Sore: 16.00 - 18.00
  if (session === 'Sore') {
    return hour >= 16 && hour < 18;
  }
  return false;
};

export const exportToCSV = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + data.map(e => Object.values(e).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};