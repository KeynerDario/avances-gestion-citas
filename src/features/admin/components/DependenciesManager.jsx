import { useState, useEffect } from "react";
import { useAdmin } from "../hooks/useAdmin";
import { Building2, Plus, Pencil, Trash2, Check, Palette } from "lucide-react";
import { SkeletonCard } from "../../../shared/components/EmptyState";

const PRESET_COLORS = [
  "#39A900", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b",
  "#10b981", "#ec4899", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#84cc16", "#e11d48", "#0891b2", "#7c3aed",
];

function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          className={`color-swatch ${value === c ? "selected" : ""}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
      <label className="color-custom">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Palette size={14} />
      </label>
    </div>
  );
}

export function DependenciesManager() {
  const {
    dependencies,
    fetchDependencies,
    createDependency,
    updateDependency,
    deleteDependency,
    loading,
  } = useAdmin();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#39A900");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#39A900");
  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  if (loading && dependencies.length === 0) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        <div className="loading-spinner" />
        <p>Cargando dependencias...</p>
      </div>
    );
  }

  const handleEdit = (dep) => {
    setEditingId(dep.id);
    setEditName(dep.name);
    setEditColor(dep.color || "#39A900");
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      alert("El nombre no puede estar vacío");
      return;
    }
    const success = await updateDependency(editingId, editName.trim(), editColor);
    if (success) {
      setEditingId(null);
      setEditName("");
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert("El nombre no puede estar vacío");
      return;
    }
    if (dependencies.some((d) => d.name.toLowerCase() === newName.toLowerCase())) {
      alert("Ya existe una dependencia con ese nombre");
      return;
    }
    const success = await createDependency(newName.trim(), newColor);
    if (success) {
      setShowCreate(false);
      setNewName("");
      setNewColor("#39A900");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar la dependencia "${name}"? Esta acción no se puede deshacer.`)) return;
    await deleteDependency(id);
  };

  return (
    <div className="dependencies-manager">
      <div className="dep-header">
        <div>
          <h2>Dependencias</h2>
          <p className="dep-subtitle">Gestiona las dependencias del sistema ( Psicología, Enfermería, etc.)</p>
        </div>
        <button className="dep-btn-create" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          Nueva Dependencia
        </button>
      </div>

      {showCreate && (
        <div className="dep-create-form">
          <h3>Crear Dependencia</h3>
          <div className="dep-form-fields">
            <div className="dep-field">
              <label>Nombre</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Psicología"
                autoFocus
              />
            </div>
            <div className="dep-field">
              <label>Color</label>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
          </div>
          <div className="dep-form-actions">
            <button onClick={() => { setShowCreate(false); setNewName(""); }} className="dep-btn-cancel">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={!newName.trim()} className="dep-btn-save">
              <Check size={16} />
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="dep-list">
        {dependencies.length === 0 && (
          <div className="dep-empty">
            <Building2 size={40} />
            <p>No hay dependencias creadas</p>
            <button onClick={() => setShowCreate(true)} className="dep-btn-create">
              <Plus size={16} />
              Crear primera dependencia
            </button>
          </div>
        )}
        {dependencies.map((dep) => (
          <div key={dep.id} className="dep-card">
            {editingId === dep.id ? (
              <div className="dep-edit-form">
                <div className="dep-form-fields">
                  <div className="dep-field">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="dep-field">
                    <label>Color</label>
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  </div>
                </div>
                <div className="dep-form-actions">
                  <button onClick={() => setEditingId(null)} className="dep-btn-cancel">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={!editName.trim()} className="dep-btn-save">
                    <Check size={16} />
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="dep-card-content">
                <div className="dep-card-left">
                  <div className="dep-color-preview" style={{ background: dep.color || "#39A900" }} />
                  <div className="dep-info">
                    <h3>{dep.name}</h3>
                    <span className="dep-id">ID: {dep.id}</span>
                  </div>
                </div>
                <div className="dep-card-actions">
                  <button onClick={() => handleEdit(dep)} className="dep-btn-edit" title="Editar" aria-label="Editar dependencia">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(dep.id, dep.name)} className="dep-btn-delete" title="Eliminar" aria-label="Eliminar dependencia">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
