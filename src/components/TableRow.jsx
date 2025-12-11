import "./TableRow.css";

const TableRow = ({ task }) => {
  return (
    <tr>
      <td>{task.id}</td>
      <td>{task.company}</td>
      <td>{task.type}</td>
      <td>{task.assigned}</td>

      <td>
        <span className={`badge ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </td>

      <td>
        <span className={`badge ${task.status.toLowerCase()}`}>
          {task.status}
        </span>
      </td>

      <td>
        <a href={`/tasks/${task.id}`} className="view-link">View</a> |
        <span className="delete-link"> Delete</span>
      </td>
    </tr>
  );
};

export default TableRow;
