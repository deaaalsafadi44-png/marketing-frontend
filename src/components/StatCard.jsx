    import "./StatCard.css";

const StatCard = ({ title, value, color, border }) => {
  return (
    <div className="stat-card" style={{ borderBottom: `5px solid ${border}` }}>
      <span className="stat-value" style={{ color: color }}>
        {value}
      </span>
      <span className="stat-title">{title}</span>
    </div>
  );
};

export default StatCard;      
 