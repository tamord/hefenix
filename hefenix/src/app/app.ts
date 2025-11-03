import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';
import { MatIcon } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, HttpClientModule, MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hefenix');
  protected readonly searchQuery = signal('');
  protected readonly results = signal<any>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly bookmarkedIds = signal<Set<number>>(new Set<number>());
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly token = signal<string | null>(localStorage.getItem('authToken'));

  constructor(private readonly http: HttpClient, private readonly router: Router) {
    const stored = localStorage.getItem('bookmarks');
    if (stored) {
      try {
        const arr: any[] = JSON.parse(stored);
        const ids = new Set<number>((arr || []).map(x => x?.id).filter((x: any) => typeof x === 'number'));
        this.bookmarkedIds.set(ids);
      } catch {}
    }
  }

  protected onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.results.set(null);
    const url = `${environment.apiBaseUrl}/api/mody/search?query=${encodeURIComponent(query)}`;
    this.http.get(url, { withCredentials: false }).subscribe({
      next: (res) => {
        this.results.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        
        this.error.set(err?.message ?? 'Request failed');
        this.loading.set(false);
      }
    });
  }

  protected onViewBookmarks(ev?: Event): void {
    if (ev) {
      ev.preventDefault();
    }
    this.router.navigate(['/bookmarks']).then(() => {
      // wait a tick for view to render, then scroll down
      setTimeout(() => {
        const target = document.body.scrollHeight;
        try {
          window.scrollTo({ top: target, behavior: 'smooth' });
        } catch {
          window.scrollTo(0, target);
        }
      }, 50);
    });
  }

  protected isBookmarked(repoId: number): boolean {
    return this.bookmarkedIds().has(repoId);
  }

  protected login(): void {
    const body = { username: this.username().trim(), password: this.password() };
    if (!body.username || !body.password) {
      this.error.set('Enter username and password');
      return;
    }
    this.error.set(null);
    this.http.post<any>(`${environment.apiBaseUrl}/api/auth/login`, body).subscribe({
      next: (res) => {
        const tok = res?.access_token as string;
        if (tok) {
          localStorage.setItem('authToken', tok);
          this.token.set(tok);
        } else {
          this.error.set('Login failed');
        }
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Login failed');
      }
    });
  }

  protected toggleBookmark(repo: any): void {
    const current = new Set(this.bookmarkedIds());
    const id = repo?.id as number;
    console.log('toggleBookmark', { id, has: current.has(id) });
    if (current.has(id)) {
      current.delete(id);
      const stored = localStorage.getItem('bookmarks');
      if (stored) {
        try {
          const arr: any[] = JSON.parse(stored) || [];
          const next = arr.filter(x => x?.id !== id);
          localStorage.setItem('bookmarks', JSON.stringify(next));
        } catch {}
      }
      // notify listeners
      try { window.dispatchEvent(new CustomEvent('bookmarks-updated')); } catch {}
    } else {
      current.add(id);
      const stored = localStorage.getItem('bookmarks');
      try {
        const arr: any[] = stored ? JSON.parse(stored) : [];
        const filtered = (arr || []).filter(x => x?.id !== id);
        filtered.push(repo);
        localStorage.setItem('bookmarks', JSON.stringify(filtered));
        // notify listeners
        try { window.dispatchEvent(new CustomEvent('bookmarks-updated')); } catch {}
        // Navigate to bookmarks without refreshing the page
        this.router.navigate(['/bookmarks']);
      } catch {
        localStorage.setItem('bookmarks', JSON.stringify([repo]));
        try { window.dispatchEvent(new CustomEvent('bookmarks-updated')); } catch {}
        this.router.navigate(['/bookmarks']);
      }
    }
    this.bookmarkedIds.set(current);
  }
}
