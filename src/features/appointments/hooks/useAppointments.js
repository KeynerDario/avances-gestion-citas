import { useState, useCallback, useEffect, useRef } from "react";
import { AppointmentRepository } from "../api/appointments.repository";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { useAuth } from "../../../providers/AuthContext";

const STATUS = {
  IDLE: "idle",
  CREATING: "creating",
  FETCHING: "fetching",
  UPDATING: "updating",
  ERROR: "error",
};

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState(null);
  const { user, profile, isAprendiz } = useAuth();
  const userId = user?.id;
  const dependencyId = profile?.dependency_id;
  const userIsAprendiz = isAprendiz();

  const fetchAppointments = useCallback(
    async (filters = {}) => {
      setStatus(STATUS.FETCHING);
      setError(null);

      try {
        const roleFilters = userIsAprendiz
          ? { userId }
          : { dependencyId };

        const data = await AppointmentRepository.fetch({
          ...roleFilters,
          ...filters,
        });
        setAppointments(data);
        return data;
      } catch (err) {
        setError(err.message);
        toast.error("Error cargando citas");
        return [];
      } finally {
        setStatus(STATUS.IDLE);
      }
    },
    [userId, dependencyId, userIsAprendiz],
  );

  const fetchRef = useRef(fetchAppointments);

  useEffect(() => {
    fetchRef.current = fetchAppointments;
  }, [fetchAppointments]);

  // Debounced realtime subscription — avoids rapid re-fetches on burst events
  useEffect(() => {
    let debounceTimer = null;
    let mounted = true;
    const channelName = `appointments-${Math.random().toString(36).slice(2, 8)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (mounted) fetchRef.current();
          }, 1000);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const createAppointment = async (formData) => {
    setStatus(STATUS.CREATING);

    try {
      if (isAprendiz()) {
        const pendingCount = await AppointmentRepository.countPending(user.id);
        if (pendingCount >= 2) {
          throw new Error(
            "Ya tienes 2 citas pendientes. Espera a que se atienda una.",
          );
        }
      }

      const isAvailable = await AppointmentRepository.checkAvailability(
        formData.dependency_id,
        formData.scheduled_date,
        formData.scheduled_time,
      );

      if (!isAvailable) {
        throw new Error("Este horario ya está ocupado. Selecciona otro.");
      }

      const professionalId = await AppointmentRepository.findProfessionalForDependency(
        formData.dependency_id
      );

      const newAppointment = await AppointmentRepository.create({
        ...formData,
        user_id: user.id,
        professional_id: professionalId,
        status: "pending",
      }, user.id);

      setAppointments((prev) => [...prev, newAppointment]);
      toast.success("Cita agendada correctamente");
      return { success: true, data: newAppointment };
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return { success: false, error: err.message };
    } finally {
      setStatus(STATUS.IDLE);
    }
  };

  const updateStatus = async (appointmentId, newStatus, notes = null) => {
    setStatus(STATUS.UPDATING);

    try {
      const updates = { status: newStatus };
      if (notes) updates.notes = notes;

      const updated = await AppointmentRepository.update(
        appointmentId,
        updates,
        user.id,
      );

      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? updated : app)),
      );

      toast.success(
        `Cita ${newStatus === "confirmed" ? "confirmada" : "actualizada"}`,
      );
      return { success: true };
    } catch (err) {
      toast.error("Error actualizando cita");
      return { success: false, error: err.message };
    } finally {
      setStatus(STATUS.IDLE);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    const appointment = appointments.find((a) => a.id === appointmentId);

    if (appointment.status !== "pending") {
      toast.error("Solo puedes cancelar citas pendientes");
      return { success: false };
    }

    return updateStatus(appointmentId, "cancelled");
  };

  return {
    appointments,
    status,
    error,
    isLoading: status === STATUS.FETCHING,
    isCreating: status === STATUS.CREATING,
    fetchAppointments,
    createAppointment,
    updateStatus,
    cancelAppointment,
  };
}
