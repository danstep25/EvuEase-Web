import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-evaluator-feature-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="evaluator-page">
      <header class="evaluator-page__header">
        <h1 class="evaluator-page__title">{{ title }}</h1>
        <p class="evaluator-page__subtitle">This area is read-only or coming soon for evaluators.</p>
      </header>
      <div class="evaluator-surface evaluator-surface--padded">
        <p class="evaluator-placeholder-lead">This section is under construction.</p>
      </div>
    </div>
  `,
  styles: []
})
export class EvaluatorFeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  get title(): string {
    return this.route.snapshot.data['title'] ?? 'Evaluator Feature';
  }
}
