import type {
  ContextListItem,
  ExecutionTarget,
  ProjectContext,
  RoadmapItem,
} from '../shared/project-context';

function renderList(
  items: ContextListItem[],
  tone: 'implemented' | 'planned' | 'template'
): string {
  return items
    .map((item) => {
      const detail = item.notes ?? item.reason ?? item.note ?? '';
      const meta = item.path ?? item.source ?? '';

      return `
        <li class="status-list__item">
          <div class="status-list__top">
            <span class="status-dot status-dot--${tone}"></span>
            <strong>${item.label}</strong>
          </div>
          ${detail ? `<p>${detail}</p>` : ''}
          ${meta ? `<code>${meta}</code>` : ''}
        </li>
      `;
    })
    .join('');
}

function renderStack(stack: Record<string, string[]>): string {
  return Object.entries(stack)
    .map(
      ([group, values]) => `
        <div class="stack-block">
          <div class="stack-block__title">${group}</div>
          <div class="chip-row">
            ${values.map((value) => `<span class="chip chip--muted">${value}</span>`).join('')}
          </div>
        </div>
      `
    )
    .join('');
}

function renderTargets(targets: ExecutionTarget[]): string {
  return targets
    .map(
      (target) => `
        <article class="target-card">
          <div class="target-card__top">
            <strong>${target.label}</strong>
            <span class="chip chip--soft">${target.mode}</span>
          </div>
          <code>${target.entry}</code>
          <ul class="command-list">
            ${target.commands.map((command) => `<li><code>${command}</code></li>`).join('')}
          </ul>
        </article>
      `
    )
    .join('');
}

function renderRoadmap(items: RoadmapItem[]): string {
  return items
    .map(
      (item) => `
        <li class="roadmap-item">
          <div class="roadmap-item__top">
            <span class="phase-pill">${item.phase}</span>
            <strong>${item.title}</strong>
            <span class="chip chip--${item.status === 'done' ? 'done' : 'muted'}">${item.status}</span>
          </div>
          <p>${item.outcome}</p>
        </li>
      `
    )
    .join('');
}

export function renderEditorShell(context: ProjectContext): string {
  const implementedCount = context.currentState.implemented.length;
  const plannedCount = context.plannedStack.candidates.length;
  const templateCount = context.currentState.templateOnly.length;

  return `
    <div class="app-shell">
      <aside class="rail" aria-label="Herramientas del shell">
        <div class="rail__brand">P10</div>
        <button class="rail__button rail__button--active" type="button" title="Inicio">
          <span class="icon-slot" data-icon="home"></span>
        </button>
        <button class="rail__button" type="button" title="Capas">
          <span class="icon-slot" data-icon="layers"></span>
        </button>
        <button class="rail__button" type="button" title="Texto">
          <span class="icon-slot" data-icon="text"></span>
        </button>
        <button class="rail__button" type="button" title="Pen">
          <span class="icon-slot" data-icon="pen"></span>
        </button>
        <button class="rail__button" type="button" title="Mover">
          <span class="icon-slot" data-icon="move"></span>
        </button>
      </aside>

      <div class="app-main">
        <header class="topbar">
          <div>
            <div class="kicker">P10pro · base ejecutable minima</div>
            <h1>${context.project.name}</h1>
            <p class="lead">${context.project.summary}</p>
          </div>
          <div class="topbar__actions">
            <a class="link-button" href="docs/index.html">Abrir docs</a>
            <a class="link-button link-button--ghost" href="docs/inicio/codedesign_technical_docs_v2.html">Vista tecnica</a>
            <button class="theme-button" id="themeToggle" type="button">Cambiar tema</button>
          </div>
        </header>

        <main class="workspace-layout">
          <section class="workspace-column workspace-column--wide">
            <section class="hero-card">
              <div class="hero-card__grid">
                <article class="hero-card__story">
                  <div class="kicker">Estado real</div>
                  <h2>Una sola verdad del proyecto antes de crecer.</h2>
                  <p>
                    La app, la documentacion y el sketch local comparten el mismo contrato. Nada de lo que aparece aqui
                    se presenta como implementado si no existe en disco o no arranca hoy.
                  </p>
                  <div class="chip-row">
                    <span class="chip chip--done">${implementedCount} implementado</span>
                    <span class="chip chip--soft">${plannedCount} planned</span>
                    <span class="chip chip--muted">${templateCount} template_only</span>
                  </div>
                </article>

                <article class="hero-card__panel">
                  <div class="mini-label">Regla de gobernanza</div>
                  <p>${context.project.governance.rule}</p>
                  <div class="path-list">
                    <code>${context.project.governance.sourceOfTruth}</code>
                    <code>${context.project.governance.humanSummary}</code>
                    ${context.project.governance.derivedViews.map((view) => `<code>${view}</code>`).join('')}
                  </div>
                </article>
              </div>
            </section>

            <section class="canvas-card">
              <div class="canvas-card__header">
                <div>
                  <div class="kicker">Shell del editor</div>
                  <h2>Workspace local listo para evolucionar.</h2>
                </div>
                <span class="chip chip--soft">sin backend</span>
              </div>
              <div class="canvas-stage">
                <div class="canvas-stage__frame">
                  <div class="canvas-stage__toolbar">
                    <span class="chip chip--muted">sidebar</span>
                    <span class="chip chip--muted">header</span>
                    <span class="chip chip--muted">status panel</span>
                  </div>
                  <div class="canvas-stage__grid">
                    <div class="canvas-node canvas-node--primary">
                      <span class="canvas-node__label">App web</span>
                      <strong>Vite + TypeScript</strong>
                      <p>Entrada real para iterar sin seguir documentando fantasias full-stack.</p>
                    </div>
                    <div class="canvas-node">
                      <span class="canvas-node__label">Docs</span>
                      <strong>HTML + Markdown</strong>
                      <p>Vistas alineadas con el contrato estructurado del proyecto.</p>
                    </div>
                    <div class="canvas-node">
                      <span class="canvas-node__label">Processing</span>
                      <strong>Sketch local</strong>
                      <p>Superficie creativa separada del runtime web.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="section-card">
              <div class="section-card__top">
                <div>
                  <div class="kicker">Stack implementado</div>
                  <h2>Lo que si existe hoy.</h2>
                </div>
              </div>
              ${renderStack(context.implementedStack)}
            </section>

            <section class="section-card">
              <div class="section-card__top">
                <div>
                  <div class="kicker">Roadmap</div>
                  <h2>Siguientes capas sin reabrir la desalineacion.</h2>
                </div>
              </div>
              <ul class="roadmap-list">${renderRoadmap(context.roadmap)}</ul>
            </section>
          </section>

          <aside class="workspace-column workspace-column--side">
            <section class="section-card">
              <div class="section-card__top">
                <div>
                  <div class="kicker">Implementado hoy</div>
                  <h2>Capas activas</h2>
                </div>
              </div>
              <ul class="status-list">${renderList(context.currentState.implemented, 'implemented')}</ul>
            </section>

            <section class="section-card">
              <div class="section-card__top">
                <div>
                  <div class="kicker">Ejecucion local</div>
                  <h2>Targets y comandos</h2>
                </div>
              </div>
              ${renderTargets(context.executionTargets)}
            </section>

            <section class="section-card">
              <div class="section-card__top">
                <div>
                  <div class="kicker">Planned</div>
                  <h2>Fuera del estado actual</h2>
                </div>
              </div>
              <ul class="status-list">${renderList(context.currentState.notImplemented, 'planned')}</ul>
              <div class="chip-row">
                ${context.plannedStack.explicitlyNotCurrent.map((value) => `<span class="chip chip--muted">${value}</span>`).join('')}
              </div>
            </section>

            <section class="section-card">
              <div class="section-card__top">
                <div>
                  <div class="kicker">Template only</div>
                  <h2>Herencia controlada</h2>
                </div>
              </div>
              <ul class="status-list">${renderList(context.currentState.templateOnly, 'template')}</ul>
              <div class="template-artifacts">
                ${context.templateOnlyArtifacts
                  .map(
                    (artifact) => `
                      <article class="artifact-card">
                        <strong>${artifact.name}</strong>
                        <p>${artifact.policy}</p>
                        <div class="path-list">
                          ${artifact.paths.map((path) => `<code>${path}</code>`).join('')}
                        </div>
                      </article>
                    `
                  )
                  .join('')}
              </div>
            </section>

            <section class="section-card">
              <div class="section-card__top">
                <div>
                  <div class="kicker">Enlaces locales</div>
                  <h2>Superficies separadas</h2>
                </div>
              </div>
              <div class="link-stack">
                <a class="link-button" href="docs/index.html">Portal documental</a>
                <a class="link-button link-button--ghost" href="docs/inicio/codedesign_technical_docs_v2.html">Vista tecnica derivada</a>
                <a class="link-button link-button--ghost" href="creative/processing/Sketch.pde">Ver Sketch.pde</a>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  `;
}
