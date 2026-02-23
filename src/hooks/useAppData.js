import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { 
  onSnapshot, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { auth, getCollectionPath } from '../lib/firebase';
import { INITIAL_SETTINGS } from '../utils/helpers';

export const useAppData = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  
  // Data ini hanya akan diisi setelah login berhasil
  const [attendance, setAttendance] = useState([]); 
  const [pendingAbsensi, setPendingAbsensi] = useState([]); 
  const [holidays, setHolidays] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 1. Init Auth Firebase
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Login Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => { 
        if (user) setFirebaseUser(user); 
    });
    return () => unsubscribe();
  }, []);

  // Mengecek apakah data esensial untuk login sudah termuat
  useEffect(() => {
    if (employeesLoaded && settingsLoaded) {
      setLoading(false);
    }
  }, [employeesLoaded, settingsLoaded]);

  // 2. Load Data Tahap 1 (PRE-LOGIN: Hanya Pegawai & Pengaturan)
  useEffect(() => {
    if (!firebaseUser) return;

    // A. Pegawai (Untuk verifikasi akun)
    const unsubEmp = onSnapshot(getCollectionPath('users'), (snap) => {
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setEmployeesLoaded(true);
    }, (error) => console.error("Err Employees:", error));

    // B. Settings (Untuk logo dan teks OPD di halaman login)
    const unsubSet = onSnapshot(getCollectionPath('settings'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) {
          setSettings(data[0]);
      } else {
          addDoc(getCollectionPath('settings'), INITIAL_SETTINGS);
      }
      setSettingsLoaded(true);
    }, (error) => console.error("Err Settings:", error));

    return () => { 
      unsubEmp(); 
      unsubSet(); 
    };
  }, [firebaseUser]);

  // 3. Load Data Tahap 2 (POST-LOGIN: Data Absensi & Libur)
  useEffect(() => {
    // Hentikan eksekusi jika user belum login ke dalam aplikasi
    if (!firebaseUser || !appUser) return;

    // A. Attendance (Bulan Ini)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    
    const attendanceQuery = query(
      getCollectionPath('attendance'),
      where('date', '>=', startOfMonth)
    );

    const unsubAtt = onSnapshot(attendanceQuery, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendance(data);
    }, (error) => console.error("Err Attendance:", error));

    // B. Pending Absensi
    const pendingQuery = query(
      getCollectionPath('attendance'),
      where('statusApproval', '==', 'pending')
    );

    const unsubPending = onSnapshot(pendingQuery, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setPendingAbsensi(data);
    }, (error) => console.error("Err Pending:", error));

    // C. Holidays
    const unsubHol = onSnapshot(getCollectionPath('holidays'), (snap) => {
       setHolidays(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Err Holidays:", error));

    return () => { 
      unsubAtt(); 
      unsubPending(); 
      unsubHol(); 
    };
  }, [firebaseUser, appUser]);

  // --- Helper Fetch Manual ---
  const fetchAttendanceByRange = async (startDate, endDate) => {
    try {
      const q = query(
        getCollectionPath('attendance'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching range:", error);
      return [];
    }
  };

  const handleAppLogin = (username, password) => {
    const user = employees.find(u => u.username === username && u.password === password);
    if (user) {
      setAppUser(user);
      return true;
    }
    return false;
  };

  const handleAppLogout = () => {
    setAppUser(null);
  };

  return {
    firebaseUser,
    appUser,
    employees,
    attendance,      
    pendingAbsensi,  
    settings,
    holidays,
    loading,
    handleAppLogin,
    handleAppLogout,
    fetchAttendanceByRange
  };
};