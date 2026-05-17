<script lang="ts">
  const inventory = [
    {
      id: "EIR-MK7-248",
      title: "Volkswagen MK7 GTI",
      type: "Carbon LED Steering Wheel",
      price: "€549",
      status: "Available",
    },
    {
      id: "EIR-W205-251",
      title: "Mercedes W205",
      type: "Carbon LED Steering Wheel",
      price: "€649",
      status: "Awaiting Drop",
    },
    {
      id: "EIR-F30M-253",
      title: "BMW F30 M Sport",
      type: "Carbon LED Steering Wheel",
      price: "€599",
      status: "Awaiting Drop",
    },
  ];
</script>

<main class="site">
  <section class="hero">
    <div class="topline">
      <span>ÉIRVOX COMMERCE SYSTEM_</span>
      <span>INVENTORY LAYER /// 001</span>
      <span>EST. 2025</span>
    </div>

    <div class="center">
      <p class="system">COMMERCE SYSTEM — INVENTORY LAYER /// 001</p>
      <h1>ÉIRVOX.</h1>
      <div class="rule"></div>
      <p class="tagline">NO BORDERS. ONE MARKET.</p>
      <p class="sub">
        Curated automotive parts, sourced across markets and brought into circulation.
      </p>
    </div>

    <div class="bottomline">
      <span>NO BORDERS.<br />ONE MARKET.<br />ÉIRVOX.</span>
      <span>eirvox.ie</span>
    </div>
  </section>

  <section class="terminal">
    <div class="panel">
      <div class="panel-head">
        <span>DROP 001</span>
        <span>STATUS / STANDBY</span>
      </div>

      <h2>AWAITING INVENTORY</h2>

      <div class="stats">
        <div>
          <span>ACTIVE LISTINGS</span>
          <strong>0</strong>
        </div>
        <div>
          <span>ACQUISITIONS QUEUED</span>
          <strong>12</strong>
        </div>
        <div>
          <span>SYSTEM STATUS</span>
          <strong>ONLINE</strong>
        </div>
      </div>

      <p class="cursor">&gt; DROP 001 — AWAITING_</p>
    </div>
  </section>

  <section class="inventory">
    <div class="section-label">
      <span>SELECTED INVENTORY</span>
      <span>COMING SOON</span>
    </div>

    <div class="grid">
      {#each inventory as item}
        <article class="card">
          <div class="card-meta">
            <span>{item.id}</span>
            <span>{item.status}</span>
          </div>

          <div class="placeholder">
            <span>ITEM IMAGE</span>
          </div>

          <h3>{item.title}</h3>
          <p>{item.type}</p>

          <div class="card-foot">
            <span>{item.price}</span>
            <button>Reserve</button>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <footer>
    <span>ÉIRVOX.</span>
    <span>NO BORDERS. ONE MARKET.</span>
    <span>eirvox.ie</span>
  </footer>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    background: #070604;
    color: #f2f2ec;
    font-family:
      "SF Mono", "IBM Plex Mono", "Roboto Mono", "Courier New", monospace;
  }

  :global(button) {
    font: inherit;
  }

  .site {
    min-height: 100vh;
    background:
      radial-gradient(circle at center, rgba(232, 101, 31, 0.08), transparent 36%),
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      #070604;
    background-size: auto, 100% 4px, auto;
  }

  .hero {
    min-height: 100vh;
    position: relative;
    padding: 2rem;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .hero::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.85) 78%),
      repeating-linear-gradient(
        to bottom,
        rgba(255,255,255,0.035) 0,
        rgba(255,255,255,0.035) 1px,
        transparent 1px,
        transparent 5px
      );
    mix-blend-mode: screen;
    opacity: 0.28;
  }

  .topline,
  .bottomline {
    position: absolute;
    left: 2rem;
    right: 2rem;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: #e8651f;
    font-size: clamp(0.7rem, 1.2vw, 0.95rem);
    letter-spacing: 0.03em;
  }

  .topline {
    top: 2rem;
  }

  .bottomline {
    bottom: 2rem;
    align-items: flex-end;
  }

  .center {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 920px;
  }

  .system {
    color: #f2f2ec;
    opacity: 0.76;
    font-size: clamp(0.75rem, 1.3vw, 1rem);
    letter-spacing: 0.08em;
    margin-bottom: 1rem;
  }

  h1 {
    margin: 0;
    color: #e8651f;
    font-size: clamp(4rem, 15vw, 12rem);
    line-height: 0.82;
    letter-spacing: -0.08em;
    text-shadow: 0 0 18px rgba(232, 101, 31, 0.28);
  }

  .rule {
    width: min(520px, 75vw);
    height: 1px;
    margin: 2rem auto 1.5rem;
    background: #e8651f;
    opacity: 0.75;
  }

  .tagline {
    color: #e8651f;
    font-size: clamp(1rem, 2vw, 1.4rem);
    margin: 0 0 1rem;
  }

  .sub {
    max-width: 620px;
    margin: 0 auto;
    color: rgba(242, 242, 236, 0.72);
    line-height: 1.7;
    font-size: 0.95rem;
  }

  .terminal,
  .inventory {
    padding: 6rem 2rem;
  }

  .panel {
    max-width: 1100px;
    margin: 0 auto;
    border: 1px solid rgba(232, 101, 31, 0.55);
    border-radius: 6px;
    padding: clamp(1.25rem, 4vw, 3rem);
    background: rgba(0, 0, 0, 0.28);
    box-shadow: 0 0 40px rgba(232, 101, 31, 0.06);
  }

  .panel-head,
  .section-label,
  .card-meta,
  .card-foot,
  footer {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .panel-head,
  .section-label,
  .card-meta {
    color: #e8651f;
    font-size: 0.8rem;
  }

  h2 {
    color: #e8651f;
    font-size: clamp(2.8rem, 9vw, 7rem);
    line-height: 0.92;
    letter-spacing: -0.06em;
    margin: 3rem 0;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid rgba(232, 101, 31, 0.3);
    border-bottom: 1px solid rgba(232, 101, 31, 0.3);
  }

  .stats div {
    padding: 1.5rem 1rem;
    border-right: 1px solid rgba(232, 101, 31, 0.3);
  }

  .stats div:last-child {
    border-right: 0;
  }

  .stats span {
    display: block;
    color: rgba(242, 242, 236, 0.62);
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .stats strong {
    color: #e8651f;
    font-size: 1.4rem;
    font-weight: 400;
  }

  .cursor {
    color: #e8651f;
    margin: 2rem 0 0;
    font-size: 1rem;
  }

  .inventory {
    max-width: 1240px;
    margin: 0 auto;
  }

  .section-label {
    margin-bottom: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .card {
    border: 1px solid rgba(232, 101, 31, 0.28);
    padding: 1rem;
    background: rgba(255, 255, 255, 0.015);
  }

  .placeholder {
    height: 320px;
    margin: 1rem 0;
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at center, rgba(232,101,31,0.12), transparent 38%),
      #030302;
    border: 1px solid rgba(232, 101, 31, 0.18);
    color: rgba(242, 242, 236, 0.32);
    font-size: 0.75rem;
  }

  h3 {
    margin: 0;
    color: #f2f2ec;
    font-size: 1rem;
    font-weight: 400;
  }

  .card p {
    color: rgba(242, 242, 236, 0.55);
    font-size: 0.8rem;
    min-height: 2.5rem;
  }

  .card-foot {
    align-items: center;
    color: #e8651f;
  }

  button {
    border: 1px solid rgba(232, 101, 31, 0.55);
    background: transparent;
    color: #e8651f;
    padding: 0.65rem 0.9rem;
    cursor: pointer;
    text-transform: uppercase;
    font-size: 0.72rem;
  }

  button:hover {
    background: rgba(232, 101, 31, 0.1);
  }

  footer {
    padding: 2rem;
    color: #e8651f;
    border-top: 1px solid rgba(232, 101, 31, 0.18);
    font-size: 0.8rem;
  }

  @media (max-width: 820px) {
    .topline span:nth-child(2),
    .topline span:nth-child(3) {
      display: none;
    }

    .stats,
    .grid {
      grid-template-columns: 1fr;
    }

    .stats div {
      border-right: 0;
      border-bottom: 1px solid rgba(232, 101, 31, 0.3);
    }

    .stats div:last-child {
      border-bottom: 0;
    }

    .bottomline,
    footer {
      flex-direction: column;
    }

    .hero {
      padding: 1.25rem;
    }

    .topline,
    .bottomline {
      left: 1.25rem;
      right: 1.25rem;
    }
  }
</style>
