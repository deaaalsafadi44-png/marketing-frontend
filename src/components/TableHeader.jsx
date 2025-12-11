import "./TableHeader.css";

const TableHeader = () => {
  return (
    <div className="filters-box">
      <label>Company:</label>
      <input type="text" placeholder="Company" />

      <label>Department:</label>
      <input type="text" placeholder="Department" />

      <label>Status:</label>
      <input type="text" placeholder="Status" />

      <label>Search:</label>
      <input type="text" placeholder="Search task..." />
    </div>
  );
};

export default TableHeader;
