interface Toast {
  id: number;
  text: string;
}

interface ToastContainerProps {
  notifications: Toast[];
  onRemove: (id: number) => void;
}

function ToastContainer({ notifications, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {notifications.map((note) => (
        <div key={note.id} className="toast-card">
          <div className="toast-header">
            <strong>Missionsbericht</strong>
            <button onClick={() => onRemove(note.id)}>×</button>
          </div>
          <p>{note.text}</p>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;