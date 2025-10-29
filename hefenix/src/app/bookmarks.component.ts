import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="main">
      <div style="width:100%;max-width:900px;margin:0 auto 1rem auto;display:flex;align-items:center;gap:8px;">
        <h2 style="margin:0;">Bookmarks</h2>
        <span style="margin-left:auto;color:#666;font-size:12px;">{{ items()?.length || 0 }} saved</span>
      </div>
      <div style="width:100%;max-width:900px;margin:0 auto;">
        <p *ngIf="loading()">Loading…</p>
        <p *ngIf="error()" style="color:#b00020;">{{ error() }}</p>
        <div *ngIf="!loading() && !items()?.length" style="color:#666;">No bookmarks yet.</div>
        <div *ngIf="items()?.length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
          <div *ngFor="let repo of items()" style="border:1px solid #eee;border-radius:8px;padding:12px;display:flex;gap:10px;align-items:center;background:#fff;">
            <img [src]="repo.owner?.avatar_url" [alt]="repo.owner?.login" width="48" height="48" style="border-radius:50%;object-fit:cover;flex:0 0 auto;" />
            <div style="min-width:0;display:flex;flex-direction:column;gap:6px;flex:1 1 auto;">
              <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ repo.name }}</div>
              <div style="display:flex;gap:8px;align-items:center;">
                <a [href]="repo.html_url" target="_blank" rel="noopener" style="font-size:12px;color:#1976d2;text-decoration:none;">Open on GitHub</a>
                <button (click)="remove(repo.id)" style="margin-left:auto;padding:.25rem .5rem;border:1px solid #ddd;border-radius:14px;background:#f7f7f7;cursor:pointer;font-size:12px;">Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `
})
export class BookmarksComponent implements OnInit, OnDestroy {
  protected readonly items = signal<any[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetch();
    // Listen for updates from other parts of the app
    window.addEventListener('bookmarks-updated', this.handleUpdated);
  }

  ngOnDestroy(): void {
    window.removeEventListener('bookmarks-updated', this.handleUpdated);
  }

  private readonly handleUpdated = () => {
    this.fetch();
  };

  protected fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    try {
      const stored = localStorage.getItem('bookmarks');
      const parsed = stored ? JSON.parse(stored) : [];
      this.items.set(parsed || []);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load bookmarks');
    }
    this.loading.set(false);
  }

  protected remove(id: number): void {
    const current = this.items() || [];
    const updated = current.filter(r => r?.id !== id);
    this.items.set(updated);
    localStorage.setItem('bookmarks', JSON.stringify(updated));
  }
}


