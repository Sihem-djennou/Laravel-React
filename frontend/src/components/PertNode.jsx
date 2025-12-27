const PertNode = ({ data }) => {
  const { label = {}, isCritical = false } = data || {};
  const {
    full_label = "Unknown Task",
    description = "",
    start = "N/A",
    end = "N/A",
    duration = 0,
    slack = 0,
    predecessors = []
  } = label;

  return (
    <div className={`pert-node-content ${isCritical ? 'critical' : ''}`}>
      <strong>{full_label}</strong>
      {description && <div className="pert-description">{description}</div>}
      <div className="pert-times">
        Start: {start} | End: {end} | Duration: {duration} days
      </div>
      {isCritical ? (
        <div className="pert-critical-info">
          ⚠️ This task is on the critical path! Any delay affects project completion.
        </div>
      ) : (
        <div className="pert-slack">Slack: {slack} days</div>
      )}
      {Array.isArray(predecessors) && predecessors.length > 0 && (
        <div className="pert-predecessors">
          Depends on: {predecessors.join(", ")}
        </div>
      )}
    </div>
  );
};

export default PertNode;