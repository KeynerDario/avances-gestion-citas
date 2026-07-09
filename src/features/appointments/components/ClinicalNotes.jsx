import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Save, Trash2, X } from "lucide-react";
import { ProfessionalRepository } from "../api/professional.repository";
import { toast } from "sonner";

export function ClinicalNotes({ appointmentId, professionalId, onSave }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ProfessionalRepository.getNotesByAppointment(
        appointmentId,
      );
      setNotes(data);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) loadNotes();
  }, [appointmentId, loadNotes]);

  const handleSave = async () => {
    if (!newNote.trim()) return;
    try {
      const note = await ProfessionalRepository.createNote({
        appointment_id: appointmentId,
        professional_id: professionalId,
        content: newNote.trim(),
      }, professionalId);
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
      onSave?.();
    } catch {
      toast.error("Error guardando nota");
    }
  };

  const handleUpdate = async (id) => {
    if (!editContent.trim()) return;
    try {
      const updated = await ProfessionalRepository.updateNote(id, editContent, professionalId);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setEditingId(null);
      setEditContent("");
    } catch {
      toast.error("Error actualizando nota");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta nota?")) return;
    try {
      await ProfessionalRepository.deleteNote(id, professionalId);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Error eliminando nota");
    }
  };

  return (
    <div className="clinical-notes">
      <div className="notes-header">
        <FileText size={16} />
        <span>Notas Clínicas</span>
        {notes.length > 0 && <span className="notes-count">{notes.length}</span>}
      </div>

      <div className="note-input-area">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Escribir nota clínica..."
          rows={3}
          aria-label="Nueva nota clínica"
        />
        <button
          onClick={handleSave}
          disabled={!newNote.trim()}
          className="btn-save-note"
        >
          <Save size={14} />
          Guardar
        </button>
      </div>

      {isLoading ? (
        <p className="notes-loading">Cargando notas...</p>
      ) : notes.length === 0 ? (
        <p className="notes-empty">No hay notas registradas</p>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="note-item">
              {editingId === note.id ? (
                <div className="note-edit">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    aria-label="Editar nota clínica"
                  />
                  <div className="note-edit-actions">
                    <button onClick={() => handleUpdate(note.id)} className="btn-save-note">
                      <Save size={12} /> Guardar
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditContent(""); }}
                      className="btn-cancel-note"
                    >
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="note-content">{note.content}</p>
                  <div className="note-footer">
                    <span className="note-date">
                      {new Date(note.created_at).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="note-actions">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}
                        className="btn-edit-note"
                        aria-label="Editar nota"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="btn-delete-note"
                        aria-label="Eliminar nota"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
