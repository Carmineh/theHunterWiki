/**
 * First Time User Experience: a short guided tour shown on the first launch.
 * It can be reopened at any time from the "?" button in the toolbar.
 * The overlay only covers the content area, never the ad slots.
 */

const COMPLETED_KEY = 'onboarding.completed';

interface Step {
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to theHunterWiki',
    body: 'Need zones, fur types and trophy scores for every animal in theHunter: Call of the Wild, always at hand.',
  },
  {
    title: 'Browse by reserve',
    body: 'Pick a reserve to see its animals, then pick an animal to see its need zones, fur types and trophy scores.',
  },
  {
    title: 'Search any animal',
    body: 'Start typing an animal name in the search bar at the top to jump straight to it.',
  },
  {
    title: 'Use it in-game',
    body:
      'While playing, press <kbd class="hotkey-display">Ctrl+B</kbd> to show or hide the wiki over the game. ' +
      'Click the hotkey button at the top to change it. With two monitors, the wiki also stays open on your second screen.',
  },
];

export class Onboarding {
  private stepIndex = 0;
  private readonly overlay: HTMLElement;

  constructor(private readonly onHotkeyMarkupAdded: () => void) {
    this.overlay = this.createOverlay();
  }

  /** Shows the tour if the user has never completed or skipped it. */
  showIfFirstLaunch(): void {
    if (!this.isCompleted()) this.open();
  }

  open(): void {
    this.stepIndex = 0;
    this.render();
    this.overlay.classList.remove('hidden');
  }

  private close(): void {
    this.overlay.classList.add('hidden');
    this.markCompleted();
  }

  private next(): void {
    if (this.stepIndex === STEPS.length - 1) return this.close();
    this.stepIndex++;
    this.render();
  }

  private back(): void {
    if (this.stepIndex === 0) return;
    this.stepIndex--;
    this.render();
  }

  private render(): void {
    const step = STEPS[this.stepIndex];
    const isLast = this.stepIndex === STEPS.length - 1;

    this.overlay.querySelector('.onboarding-title')!.textContent = step.title;
    this.overlay.querySelector('.onboarding-body')!.innerHTML = step.body;
    this.overlay.querySelector('.onboarding-dots')!.innerHTML = STEPS.map(
      (_, i) => `<span class="onboarding-dot${i === this.stepIndex ? ' active' : ''}"></span>`
    ).join('');

    (this.overlay.querySelector('[data-action="back"]') as HTMLButtonElement).disabled =
      this.stepIndex === 0;
    this.overlay.querySelector('[data-action="next"]')!.textContent = isLast ? 'Got it' : 'Next';

    this.onHotkeyMarkupAdded();
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'onboarding hidden';
    overlay.innerHTML = `
      <div class="onboarding-card" role="dialog" aria-modal="true">
        <h3 class="onboarding-title"></h3>
        <p class="onboarding-body"></p>
        <div class="onboarding-footer">
          <button class="onboarding-skip" data-action="skip">Skip</button>
          <div class="onboarding-dots"></div>
          <div class="onboarding-nav">
            <button class="btn-secondary" data-action="back">Back</button>
            <button class="btn-primary" data-action="next">Next</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('[data-action="skip"]')!.addEventListener('click', () => this.close());
    overlay.querySelector('[data-action="back"]')!.addEventListener('click', () => this.back());
    overlay.querySelector('[data-action="next"]')!.addEventListener('click', () => this.next());

    document.querySelector('.layout')!.appendChild(overlay);
    return overlay;
  }

  private isCompleted(): boolean {
    try {
      return localStorage.getItem(COMPLETED_KEY) === '1';
    } catch {
      return false;
    }
  }

  private markCompleted(): void {
    try {
      localStorage.setItem(COMPLETED_KEY, '1');
    } catch {
      // storage unavailable: the tour will show again next time
    }
  }
}
