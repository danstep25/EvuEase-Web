import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectEvaluationService } from '../subject-evaluation/subject-evaluation.service';
import { filterAddSubjectCatalog } from '../subject-evaluation/subject-evaluation.mapper';
import type { AddSubjectCatalogItem } from '../subject-evaluation/subject-evaluation.models';

@Component({
  selector: 'app-subject-evaluation-add-subject-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subject-evaluation-add-subject-dialog.component.html',
  styleUrl: './subject-evaluation-add-subject-dialog.component.scss'
})
export class SubjectEvaluationAddSubjectDialogComponent implements OnChanges {
  private readonly subjectEvaluationService = inject(SubjectEvaluationService);

  @Input() isOpen = false;
  @Input() studentId: string | null = null;
  @Input() excludeCourseCodes: readonly string[] = [];
  @Input() termLabel = '';
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly subjectAdded = new EventEmitter<AddSubjectCatalogItem>();

  searchQuery = '';
  catalog: readonly AddSubjectCatalogItem[] = [];
  isLoading = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['isOpen']?.currentValue === true || changes['studentId']) && this.isOpen && this.studentId) {
      this.loadCatalog();
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.catalog = [];
      this.searchQuery = '';
    }
  }

  get searchResults(): readonly AddSubjectCatalogItem[] {
    return filterAddSubjectCatalog(this.catalog, this.searchQuery, this.excludeCourseCodes);
  }

  get hasSearchQuery(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  get hasSearchResults(): boolean {
    return this.searchResults.length > 0;
  }

  get showEmptyState(): boolean {
    return this.isLoading || !this.hasSearchQuery || !this.hasSearchResults;
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.searchQuery = '';
    this.closed.emit();
  }

  onAddSubject(item: AddSubjectCatalogItem): void {
    this.subjectAdded.emit(item);
  }

  isPrerequisiteNone(prerequisite: string): boolean {
    return prerequisite.trim().toLowerCase() === 'none';
  }

  trackItem(_index: number, item: AddSubjectCatalogItem): string {
    return item.courseCode;
  }

  private loadCatalog(): void {
    if (!this.studentId) {
      return;
    }
    this.isLoading = true;
    this.subjectEvaluationService
      .getAddSubjectCatalog(this.studentId, this.excludeCourseCodes, this.termLabel)
      .subscribe({
        next: (items) => {
          this.catalog = items;
          this.isLoading = false;
        },
        error: () => {
          this.catalog = [];
          this.isLoading = false;
        }
      });
  }
}
