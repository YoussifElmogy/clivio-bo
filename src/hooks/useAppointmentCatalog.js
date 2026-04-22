import { useCallback, useEffect, useState } from 'react';
import {
  fetchBranches,
  fetchDoctorsForBranch,
  fetchSlotDaysForDoctor,
  fetchTimeSlotsForDoctorDay,
} from '../api/appointmentCatalogApi';

export function useAppointmentCatalog(branchId, doctorId, appointmentDay) {
  const [doctors, setDoctors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [slotDays, setSlotDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingBranches(true);
    fetchBranches()
      .then(branchList => {
        if (!cancelled) {
          setBranches(branchList);
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoadingBranches(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const bid = branchId?.trim();
    if (!bid) {
      setDoctors([]);
      setLoadingDoctors(false);
      return;
    }
    let cancelled = false;
    setDoctors([]);
    setLoadingDoctors(true);
    fetchDoctorsForBranch(bid)
      .then(list => {
        if (!cancelled) setDoctors(list);
      })
      .catch(() => {
        if (!cancelled) setDoctors([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDoctors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const loadSlotDays = useCallback(
    docId => {
      setLoadingSlots(true);
      fetchSlotDaysForDoctor(docId, branchId, doctors)
        .then(days => setSlotDays(days))
        .catch(() => setSlotDays([]))
        .finally(() => setLoadingSlots(false));
    },
    [branchId, doctors]
  );

  useEffect(() => {
    const id = doctorId?.trim() ?? '';
    loadSlotDays(id);
  }, [doctorId, branchId, doctors, loadSlotDays]);

  useEffect(() => {
    const id = doctorId?.trim();
    const day = appointmentDay?.trim();
    if (!id || !day) {
      setTimeSlots([]);
      setLoadingTimes(false);
      return;
    }
    let cancelled = false;
    setLoadingTimes(true);
    fetchTimeSlotsForDoctorDay(id, day, branchId)
      .then(times => {
        if (!cancelled) setTimeSlots(times);
      })
      .catch(() => {
        if (!cancelled) setTimeSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTimes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, appointmentDay, branchId]);

  return {
    doctors,
    branches,
    slotDays,
    timeSlots,
    loadingBranches,
    loadingDoctors,
    loadingSlots,
    loadingTimes,
    error,
  };
}
