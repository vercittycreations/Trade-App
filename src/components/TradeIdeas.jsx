export default function TradeIdeas({ ideas }) {
  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h3>Strategy Lab</h3>
          <p className="muted">Curated prompts to guide practice trades.</p>
        </div>
        <span className="pill">Learning focus</span>
      </div>
      <div className="idea-grid">
        {ideas.map((idea) => (
          <div key={idea.title} className="idea-card">
            <h4>{idea.title}</h4>
            <p>{idea.description}</p>
            <p className="muted">Next step: {idea.action}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
