import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { onSnapshot, addDoc } from "firebase/firestore";
import { auth, getCollectionPath } from '../lib/firebase';
import { INITIAL_SETTINGS } from '../utils/helpers';

export const useAppData = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null); // User yang login di aplikasi (bukan auth firebase)
  
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [holidays, setHolidays] = useState([]);
  
  const [loading, setLoading] = useState(true);

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

  // 2. Load Data (Hanya berjalan setelah Auth Firebase siap)
  useEffect(() => {
    if (!firebaseUser) return;

    // Listener Data Pegawai
    const unsubEmp = onSnapshot(getCollectionPath('users'), (snap) => {
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Set loading false hanya setelah data pegawai termuat (data kritikal)
      setLoading(false);
    }, (error) => console.error("Err Employees:", error));

    // Listener Data Absensi
    const unsubAtt = onSnapshot(getCollectionPath('attendance'), (snap) => {
      setAttendance(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Err Attendance:", error));

    // Listener Settings
    const unsubSet = onSnapshot(getCollectionPath('settings'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) setSettings(data[0]);
      else addDoc(getCollectionPath('settings'), INITIAL_SETTINGS);
    }, (error) => console.error("Err Settings:", error));

    // Listener Holidays
    const unsubHol = onSnapshot(getCollectionPath('holidays'), (snap) => {
       setHolidays(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Err Holidays:", error));

    return () => { unsubEmp(); unsubAtt(); unsubSet(); unsubHol(); };
  }, [firebaseUser]);

  // Fungsi Login Aplikasi (Memcocokkan username/pass dengan data pegawai)
  const handleAppLogin = (username, password) => {
    const user = employees.find(u => u.username === username && u.password === password);
    if (user) {
      setAppUser(user);
      return true; // Login sukses
    } else {
      return false; // Login gagal
    }
  };

  const handleAppLogout = () => {
    setAppUser(null);
  };

  return {
    firebaseUser,
    appUser,
    employees,
    attendance,
    settings,
    holidays,
    loading,
    handleAppLogin,
    handleAppLogout
  };
};