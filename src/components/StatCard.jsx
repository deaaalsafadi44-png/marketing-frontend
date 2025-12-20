import "./StatCard.css";

const StatCard = ({ title, value, color, border }) => {
  return (
    <div
      className="stat-card"
      style={{ borderLeft: `5px solid ${border}` }}
    >
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <span className="stat-value" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
