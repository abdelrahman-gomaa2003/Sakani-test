import { useNavigate } from "react-router-dom";

function EmptyState({ icon = "search_off", title, description, actionLabel, actionTo }) {
  const navigate = useNavigate();
  return (
    <div className="text-center py-5">
      <span className="material-symbols-outlined d-block mb-3" style={{ fontSize: 72, color: "var(--outline, #b0b0b0)" }}>{icon}</span>
      <h5 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1e1e1e)" }}>{title}</h5>
      {description && <p className="mb-3" style={{ color: "var(--outline, #767586)", maxWidth: 380, marginInline: "auto" }}>{description}</p>}
      {actionLabel && (
        <button className="btn btn-primary rounded-3 px-4 py-2 fw-bold" onClick={() => actionTo ? navigate(actionTo) : navigate(-1)}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
