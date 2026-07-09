import { useState, useCallback } from "react";
import { ProfessionalRepository } from "../api/professional.repository";
import { AppointmentRepository } from "../api/appointments.repository";
import { toast } from "sonner";
import { useAuth } from "../../../providers/AuthContext";

export function useProfessional() {
  const { user } = useAuth();
  const userId = user?.id;

  const [schedules, setSchedules] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await ProfessionalRepository.getSchedules(userId);
      setSchedules(data);
    } catch {
      // tabla podría no existir aún
      setSchedules([]);
    }
  }, [userId]);

  const saveSchedule = useCallback(
    async (scheduleData) => {
      try {
        await ProfessionalRepository.upsertSchedule({
          ...scheduleData,
          professional_id: userId,
        }, userId);
        toast.success("Horario guardado");
        await fetchSchedules();
        return true;
      } catch {
        toast.error("Error guardando horario");
        return false;
      }
    },
    [userId, fetchSchedules],
  );

  const deleteSchedule = useCallback(
    async (id) => {
      try {
        await ProfessionalRepository.deleteSchedule(id, userId);
        toast.success("Horario eliminado");
        await fetchSchedules();
        return true;
      } catch {
        toast.error("Error eliminando horario");
        return false;
      }
    },
    [fetchSchedules, userId],
  );

  const toggleSchedule = useCallback(
    async (id, isActive) => {
      try {
        await ProfessionalRepository.toggleSchedule(id, isActive, userId);
        await fetchSchedules();
        return true;
      } catch {
        toast.error("Error actualizando horario");
        return false;
      }
    },
    [fetchSchedules, userId],
  );

  const fetchDayAgenda = useCallback(
    async (date) => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const data = await ProfessionalRepository.getDayAgenda(userId, date);
        setDayAppointments(data);
      } catch {
        setDayAppointments([]);
      } finally {
        setIsLoading(false);
      }
    },
    [userId],
  );

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await ProfessionalRepository.getProfessionalStats(userId);
      setStats(data);
    } catch {
      // ignore
    }
  }, [userId]);

  const fetchNotes = useCallback(async (appointmentId) => {
    try {
      const data = await ProfessionalRepository.getNotesByAppointment(
        appointmentId,
      );
      setNotes(data);
      return data;
    } catch {
      return [];
    }
  }, []);

  const createNote = useCallback(
    async (appointmentId, content) => {
      try {
        const note = await ProfessionalRepository.createNote({
          appointment_id: appointmentId,
          professional_id: userId,
          content,
        }, userId);
        toast.success("Nota guardada");
        setNotes((prev) => [note, ...prev]);
        return note;
      } catch {
        toast.error("Error guardando nota");
        return null;
      }
    },
    [userId],
  );

  const updateNote = useCallback(async (id, content) => {
    try {
      const updated = await ProfessionalRepository.updateNote(id, content, userId);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      toast.success("Nota actualizada");
      return updated;
    } catch {
      toast.error("Error actualizando nota");
      return null;
    }
  }, [userId]);

  const deleteNote = useCallback(async (id) => {
    try {
      await ProfessionalRepository.deleteNote(id, userId);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Nota eliminada");
      return true;
    } catch {
      toast.error("Error eliminando nota");
      return false;
    }
  }, [userId]);

  const updateAppointmentStatus = useCallback(
    async (appointmentId, newStatus) => {
      try {
        const updated = await AppointmentRepository.update(appointmentId, {
          status: newStatus,
        }, userId);
        toast.success(
          newStatus === "confirmed"
            ? "Cita confirmada"
            : newStatus === "completed"
              ? "Cita completada"
              : "Cita marcada como no asistida",
        );
        return updated;
      } catch {
        toast.error("Error actualizando cita");
        return null;
      }
    },
    [userId],
  );

  return {
    schedules,
    fetchSchedules,
    saveSchedule,
    deleteSchedule,
    toggleSchedule,
    dayAppointments,
    fetchDayAgenda,
    isLoadingDayAgenda: isLoading,
    stats,
    fetchStats,
    notes,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    updateAppointmentStatus,
    isLoading,
  };
}
